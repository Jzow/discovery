# 使用非阻塞显示

我们现在有一个基本功能齐全的贪吃蛇游戏。
但你可能发现，当蛇变长一些时，很难区分蛇和食物，以及判断蛇的行进方向，因为所有LED的亮度都是一样的。
让我们来解决这个问题。

`microbit`库提供了两种不同的LED矩阵接口：一种是我们一直在使用的、基本的、阻塞式接口，另一种是非阻塞接口，它允许你自定义每个LED的亮度。
在硬件层面上，每个LED要么是“开”的，要么是“关”的，但`microbit::display::nonblocking`模块通过快速开关LED来模拟每个LED的十个亮度级别。

与非阻塞接口交互的代码非常简单，并且会遵循与我们用于与按钮交互的代码类似的结构。

```rust
use core::cell::RefCell;
use cortex_m::interrupt::{free, Mutex};
use microbit::display::nonblocking::Display;
use microbit::gpio::DisplayPins;
use microbit::pac;
use microbit::pac::TIMER1;

static DISPLAY: Mutex<RefCell<Option<Display<TIMER1>>>> = Mutex::new(RefCell::new(None));

pub(crate) fn init_display(board_timer: TIMER1, board_display: DisplayPins) {
    let display = Display::new(board_timer, board_display);

    free(move |cs| {
        *DISPLAY.borrow(cs).borrow_mut() = Some(display);
    });
    unsafe {
        pac::NVIC::unmask(pac::Interrupt::TIMER1)
    }
}
```

首先，我们初始化一个代表LED显示的`microbit::display::nonblocking::Display`结构体，将其传递给板子的`TIMER1`和`DisplayPins`外设。
然后我们将显示存储在一个互斥锁中。
最后，我们取消`TIMER1`中断的屏蔽。

然后我们定义了几个便利函数，允许我们轻松地设置（或取消设置）要显示的图像。

```rust
use tiny_led_matrix::Render;

// ...

/// Display an image.
pub(crate) fn display_image(image: &impl Render) {
    free(|cs| {
        if let Some(display) = DISPLAY.borrow(cs).borrow_mut().as_mut() {
            display.show(image);
        }
    })
}

/// Clear the display (turn off all LEDs).
pub(crate) fn clear_display() {
    free(|cs| {
        if let Some(display) = DISPLAY.borrow(cs).borrow_mut().as_mut() {
            display.clear();
        }
    })
}
```

`display_image`函数接收一张图像，并指示显示屏显示它。
就像它调用的`Display::show`方法一样，这个函数接收一个实现了`tiny_led_matrix::Render`特性的结构体。
这个特性确保了结构体包含了`Display`在LED矩阵上渲染它所需的数据和方法。
`microbit::display::nonblocking`模块提供的`Render`的两种实现是`BitImage`和`GreyscaleImage`。
在`BitImage`中，每个“像素”（或LED）要么被点亮，要么没有（就像我们使用阻塞式接口时一样），而在`GreyscaleImage`中，每个“像素”可以有不同的亮度。

`clear_display`函数正如其名，做的就是清除显示。

最后，我们使用`interrupt`宏来定义`TIMER1`中断的处理程序。
这个中断每秒触发多次，这就是允许`Display`快速循环不同LED的开和关，以产生不同亮度级别的错觉。
我们处理程序代码所做的就是调用`Display::handle_display_event`方法，它处理这个。

```rust
use microbit::pac::interrupt;

// ...

#[interrupt]
fn TIMER1() {
    free(|cs| {
        if let Some(display) = DISPLAY.borrow(cs).borrow_mut().as_mut() {
            display.handle_display_event();
        }
    })
}
```

现在我们只需要更新我们的`main`函数，调用`init_display`并使用我们定义的新函数与我们的新显示交互。

```rust
#![no_main]
#![no_std]

mod game;
mod control;
mod display;

use cortex_m_rt::entry;
use microbit::{
    Board,
    hal::{prelude::*, Rng, Timer},
    display::nonblocking::{BitImage, GreyscaleImage}
};
use rtt_target::rtt_init_print;
use panic_rtt_target as _;

use crate::control::{get_turn, init_buttons};
use crate::display::{clear_display, display_image, init_display};
use crate::game::{Game, GameStatus};


#[entry]
fn main() -> ! {
    rtt_init_print!();
    let mut board = Board::take().unwrap();
    let mut timer = Timer::new(board.TIMER0).into_periodic();
    let mut rng = Rng::new(board.RNG);
    let mut game = Game::new(rng.random_u32());

    init_buttons(board.GPIOTE, board.buttons);
    init_display(board.TIMER1, board.display_pins);


    loop {
        loop {  // Game loop
            let image = GreyscaleImage::new(&game.game_matrix(6, 3, 9));
            display_image(&image);
            timer.delay_ms(game.step_len_ms());
            match game.status {
                GameStatus::Ongoing => game.step(get_turn(true)),
                _ => {
                    for _ in 0..3 {
                        clear_display();
                        timer.delay_ms(200u32);
                        display_image(&image);
                        timer.delay_ms(200u32);
                    }
                    clear_display();
                    display_image(&BitImage::new(&game.score_matrix()));
                    timer.delay_ms(2000u32);
                    break
                }
            }
        }
        game.reset();
    }
}
```