# 控制

游戏的主角（蛇）由micro:bit正面的两个按钮控制。
按钮A让蛇左转，按钮B让蛇右转。

我们使用`microbit::pac::interrupt`宏，并发地处理按键的按下。
中断由micro:bit的GPIOTE（**G**eneral **P**urpose **I**nput/**O**utput **T**asks and **E**vents）外设产生。

## `controls`模块

本节的代码放在一个`src`目录下`controls.rs`文件中。

我们需要跟踪两个全局的可变状态：`GPIOTE`外设的引用，以及记录下一个要转的方向。

```rust
use core::cell::RefCell;
use cortex_m::interrupt::Mutex;
use microbit::hal::gpiote::Gpiote;
use crate::game::Turn;

// ...

static GPIO: Mutex<RefCell<Option<Gpiote>>> = Mutex::new(RefCell::new(None));
static TURN: Mutex<RefCell<Turn>> = Mutex::new(RefCell::new(Turn::None));
```

用`RefCell`包裹数据，可以允许其内部可变。
关于`RefCell`，可以阅读[这个文档](https://doc.rust-lang.org/std/cell/struct.RefCell.html)，以及[the Rust Book](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html)的相应章节。
`RefCell`又被`cortex_m::interrupt::Mutex`包裹，让它可以安全访问。
`cortex_m` crate提供的互斥锁使用了一个叫[临界区段](https://zh.wikipedia.org/wiki/臨界區段)的概念。
互斥锁中的数据只能在传递给`cortex_m::interrupt:free`的函数或闭包中访问，这保证了函数或闭包中的代码本身不会被中断。

首先，初始化按钮：

```rust
use cortex_m::interrupt::free;
use microbit::{
    board::Buttons,
    pac::{self, GPIOTE}
};

// ...

/// Initialise the buttons and enable interrupts.
pub(crate) fn init_buttons(board_gpiote: GPIOTE, board_buttons: Buttons) {
    let gpiote = Gpiote::new(board_gpiote);

    let channel0 = gpiote.channel0();
    channel0
        .input_pin(&board_buttons.button_a.degrade())
        .hi_to_lo()
        .enable_interrupt();
    channel0.reset_events();

    let channel1 = gpiote.channel1();
    channel1
        .input_pin(&board_buttons.button_b.degrade())
        .hi_to_lo()
        .enable_interrupt();
    channel1.reset_events();

    free(move |cs| {
        *GPIO.borrow(cs).borrow_mut() = Some(gpiote);

        unsafe {
            pac::NVIC::unmask(pac::Interrupt::GPIOTE);
        }
        pac::NVIC::unpend(pac::Interrupt::GPIOTE);
    });
}
```

nRF52上的`GPIOTE`外设有8个"通道"，每个通道都可以连接到一个`GPIO`引脚，并配置为响应某些事件，包括上升沿（从低到高的信号转换）和下降沿（高到低的信号）。
一个按钮是一个`GPIO`引脚，当未按下时信号高，按下时信号低。
因此，按钮按下是一个下降沿。

我们将`channel0`连接到`button_a`，`channel1`连接到`button_b`，并分别让它们在下降沿（`hi_to_lo`）时产生事件。
我们在`GPIO`互斥锁中保存了一个`GPIOTE`外设的引用。
接着，`unmask` `GPIOTE`中断，让它们可以被硬件传播，并调用 unpend 来清除所有待处理状态的中断（这些中断可能在未被取消屏蔽之前就已经产生了）。

接下来，我们编写处理中断的代码。
我们使用`microbit::pac`提供的`interrupt`宏（对于v2而言，它是从`nrf52833_hal` crate重新导出的）。
我们定义一个与我们要处理的中断（可以从[这里]找到所有中断(https://docs.rs/nrf52833-hal/latest/nrf52833_hal/pac/enum.Interrupt.html)）同名的函数，并用#[interrupt]注解它。

```rust
use microbit::pac::interrupt;

// ...

#[interrupt]
fn GPIOTE() {
    free(|cs| {
        if let Some(gpiote) = GPIO.borrow(cs).borrow().as_ref() {
            let a_pressed = gpiote.channel0().is_event_triggered();
            let b_pressed = gpiote.channel1().is_event_triggered();

            let turn = match (a_pressed, b_pressed) {
                (true, false) => Turn::Left,
                (false, true) => Turn::Right,
                _ => Turn::None
            };

            gpiote.channel0().reset_events();
            gpiote.channel1().reset_events();

            *TURN.borrow(cs).borrow_mut() = turn;
        }
    });
}
```

当产生`GPIOTE`中断时，我们检查每个按钮是否被按下。如果只有按钮A被按下，我们记录蛇应该向左转。如果只有按钮B被按下，我们记录蛇应该向右转。
在任何其他情况下，我们记录蛇不应该转弯。
相关的转向存储在`TURN`互斥锁中。
所有这些操作都发生在一个`free`块中，以确保我们在处理这个中断时不会被再次中断。

最后，我们暴露一个简单的函数来获取下一个转向。

```rust
/// Get the next turn (i.e., the turn corresponding to the most recently pressed button).
pub fn get_turn(reset: bool) -> Turn {
    free(|cs| {
        let turn = *TURN.borrow(cs).borrow();
        if reset {
            *TURN.borrow(cs).borrow_mut() = Turn::None
        }
        turn
    })
}
```

这个函数简单地返回`TURN`互斥锁的当前值。
它接收一个布尔类型的参数：`reset`。
如果`reset`为`true`，则`TURN`的值会被重置，也就是置为`Turn::None`。

## 更新`main`文件

回到我们的`main`函数，我们需要在main循环之前添加对`init_buttons`的调用，并在游戏循环中，将`game.step`方法的占位符`Turn::None`参数替换为由`get_turn`返回的值。

```rust
#![no_main]
#![no_std]

mod game;
mod control;

use cortex_m_rt::entry;
use microbit::{
    Board,
    hal::{prelude::*, Rng, Timer},
    display::blocking::Display
};
use rtt_target::rtt_init_print;
use panic_rtt_target as _;

use crate::game::{Game, GameStatus};
use crate::control::{init_buttons, get_turn};

#[entry]
fn main() -> ! {
    rtt_init_print!();
    let mut board = Board::take().unwrap();
    let mut timer = Timer::new(board.TIMER0);
    let mut rng = Rng::new(board.RNG);
    let mut game = Game::new(rng.random_u32());

    let mut display = Display::new(board.display_pins);

    init_buttons(board.GPIOTE, board.buttons);

    loop {  // Main loop
        loop {  // Game loop
            let image = game.game_matrix(9, 9, 9);
            // The brightness values are meaningless at the moment as we haven't yet
            // implemented a display capable of displaying different brightnesses
            display.show(&mut timer, image, game.step_len_ms());
            match game.status {
                GameStatus::Ongoing => game.step(get_turn(true)),
                _ => {
                    for _ in 0..3 {
                        display.clear();
                        timer.delay_ms(200u32);
                        display.show(&mut timer, image, 200);
                    }
                    display.clear();
                    display.show(&mut timer, game.score_matrix(), 1000);
                    break
                }
            }
        }
        game.reset();
    }
}
```

现在我们可以使用micro:bit的按钮来控制蛇了！