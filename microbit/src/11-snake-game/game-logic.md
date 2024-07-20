# 游戏逻辑

首先，让我们先了解一下游戏逻辑。
你可能已经很熟悉贪吃蛇游戏了，它的基本思想是玩家在二维网格上操纵一条蛇。
在任何给定时间，网格的一个随机位置上有“食物”，游戏的目标是让蛇尽可能多地“吃”食物。
蛇每次吃了食物，它的长度就会增加。如果蛇撞到自己的尾巴，玩家就会输掉游戏。
在游戏的一些变体中，如果蛇撞到网格的边缘，玩家也会输掉游戏，但鉴于我们网格的尺寸较小，我们将实现一个“环绕”规则，即如果蛇从网格的一边出去，它将从相对的另一边回来。

## `game`模块

本节的代码应该放在我们的`src`目录中的一个单独文件`game.rs`中。

```rust
use heapless::FnvIndexSet;

/// A single point on the grid.
#[derive(Debug, Copy, Clone, Eq, PartialEq, Hash)]
struct Coords {
   // Signed ints to allow negative values (handy when checking if we have gone
   // off the top or left of the grid)
   row: i8,
   col: i8
}

impl Coords {
   /// Get random coordinates within a grid. `exclude` is an optional set of
   /// coordinates which should be excluded from the output.
   fn random(
      rng: &mut Prng,  // We define the Prng struct below
      exclude: Option<&FnvIndexSet<Coords, 32>>
   ) -> Self {
      let mut coords = Coords {
         row: ((rng.random_u32() as usize) % 5) as i8,
         col: ((rng.random_u32() as usize) % 5) as i8
      };
      while exclude.is_some_and(|exc| exc.contains(&coords)) {
         coords = Coords {
            row: ((rng.random_u32() as usize) % 5) as i8,
            col: ((rng.random_u32() as usize) % 5) as i8
         }
      }
      coords
   }

   /// Whether the point is outside the bounds of the grid.
   fn is_out_of_bounds(&self) -> bool {
      self.row < 0 || self.row >= 5 || self.col < 0 || self.col >= 5
   }
}
```

我们使用`Coords`结构体来表示网格上的坐标。
由于`Coords`只包含两个整数，我们可以让编译器为它派生`Copy`trait的实现，这样我们就可以在不用担心所有权的情况下传递`Coords`结构体。
我们还定义了一个关联函数：`Coords::random`，它可以为我们提供一个网格上的随机位置。稍后，我们将使用它来确定为蛇放置食物的位置。
为了实现这个函数，我们需要一个随机数的源。

nRF52833有一个随机数生成器（RNG）外设，[说明书](https://infocenter.nordicsemi.com/pdf/nRF52833_PS_v1.3.pdf)的6.19节是它的文档。
HAL通过`microbit::hal::rng::Rng`结构体为我们提供了一个简单的接口，用于访问RNG。
但它是一个阻塞接口，并且生成一个随机字节所需的时间是变化，且无法预测的。
因此，我们定义了一个[伪随机](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)数生成器(PRNG)，它使用[xorshift](https://en.wikipedia.org/wiki/Xorshift)算法来生成随机的`u32`值，我们可以使用它来确定放置食物的位置。
这个算法很基础，而且并非加密安全；但它很高效、易于实现，而且对于我们小小的贪吃蛇游戏已经足够。
`Prng`结构体需要一个初始化种子值，我们从RNG外设获取它。

```rust
/// A basic pseudo-random number generator.
struct Prng {
    value: u32
}

impl Prng {
    fn new(seed: u32) -> Self {
        Self {value: seed}
    }

    /// Basic xorshift PRNG function: see https://en.wikipedia.org/wiki/Xorshift
    fn xorshift32(mut input: u32) -> u32 {
        input ^= input << 13;
        input ^= input >> 17;
        input ^= input << 5;
        input
    }

    /// Return a pseudo-random u32.
    fn random_u32(&mut self) -> u32 {
        self.value = Self::xorshift32(self.value);
        self.value
    }
}
```

我们还需要定义一些`enum`来帮助我们管理游戏状态：移动方向、转弯方向、游戏当前状态，以及游戏特定“步骤”的结果（例如，蛇移动一次）。

```rust
/// Define the directions the snake can move.
enum Direction {
    Up,
    Down,
    Left,
    Right
}

/// What direction the snake should turn.
#[derive(Debug, Copy, Clone)]
pub enum Turn {
    Left,
    Right,
    None
}

/// The current status of the game.
pub enum GameStatus {
    Won,
    Lost,
    Ongoing
}

/// The outcome of a single move/step.
enum StepOutcome {
    /// Grid full (player wins)
    Full(Coords),
    /// Snake has collided with itself (player loses)
    Collision(Coords),
    /// Snake has eaten some food
    Eat(Coords),
    /// Snake has moved (and nothing else has happened)
    Move(Coords)
}
```

接下来，定义一个`Snake`结构体，它保存蛇占据的所有坐标，以及行进方向。
我们使用队列（`heapless::spsc::Queue`）来保存坐标的顺序，并用一个哈希集合（`heapless::FnvIndexSet`）来快速地进行冲撞检测。
`Snake`也提供了方法用于移动。

```rust
use heapless::spsc::Queue;

// ...

struct Snake {
    /// Coordinates of the snake's head.
    head: Coords,
    /// Queue of coordinates of the rest of the snake's body. The end of the tail is
    /// at the front.
    tail: Queue<Coords, 32>,
    /// A set containing all coordinates currently occupied by the snake (for fast
    /// collision checking).
    coord_set: FnvIndexSet<Coords, 32>,
    /// The direction the snake is currently moving in.
    direction: Direction
}

impl Snake {
    fn new() -> Self {
        let head = Coords { row: 2, col: 2 };
        let initial_tail = Coords { row: 2, col: 1 };
        let mut tail = Queue::new();
        tail.enqueue(initial_tail).unwrap();
        let mut coord_set: FnvIndexSet<Coords, 32> = FnvIndexSet::new();
        coord_set.insert(head).unwrap();
        coord_set.insert(initial_tail).unwrap();
        Self {
            head,
            tail,
            coord_set,
            direction: Direction::Right,
        }
    }

    /// Move the snake onto the tile at the given coordinates. If `extend` is false,
    /// the snake's tail vacates the rearmost tile.
    fn move_snake(&mut self, coords: Coords, extend: bool) {
        // Location of head becomes front of tail
        self.tail.enqueue(self.head).unwrap();
        // Head moves to new coords
        self.head = coords;
        self.coord_set.insert(coords).unwrap();
        if !extend {
            let back = self.tail.dequeue().unwrap();
            self.coord_set.remove(&back);
        }
    }

    fn turn_right(&mut self) {
        self.direction = match self.direction {
            Direction::Up => Direction::Right,
            Direction::Down => Direction::Left,
            Direction::Left => Direction::Up,
            Direction::Right => Direction::Down
        }
    }

    fn turn_left(&mut self) {
        self.direction = match self.direction {
            Direction::Up => Direction::Left,
            Direction::Down => Direction::Right,
            Direction::Left => Direction::Down,
            Direction::Right => Direction::Up
        }
    }

    fn turn(&mut self, direction: Turn) {
        match direction {
            Turn::Left => self.turn_left(),
            Turn::Right => self.turn_right(),
            Turn::None => ()
        }
    }
}
```

`Game`结构体保存游戏状态。
它持有`Snake`对象，食物的当前坐标，游戏速度（决定蛇移动间隔的时间），游戏当前状态（进行、胜利或失败），以及玩家的分数。

这个结构体包含了处理游戏步骤的方法，它们决定了蛇的下一步并据此更新游戏状态。
此外，它还包含了两个方法：`game_matrix`和`score_matrix`。
它们可以输出二维矩阵值，用于在LED矩阵上显示游戏状态，或玩家分数（我们晚点就可以看到）。

```rust
/// Struct to hold game state and associated behaviour
pub(crate) struct Game {
    rng: Prng,
    snake: Snake,
    food_coords: Coords,
    speed: u8,
    pub(crate) status: GameStatus,
    score: u8
}

impl Game {
    pub(crate) fn new(rng_seed: u32) -> Self {
        let mut rng = Prng::new(rng_seed);
        //let mut tail: FnvIndexSet<Coords, 32> = FnvIndexSet::new();
        //tail.insert(Coords { row: 2, col: 1 }).unwrap();
        let snake = Snake::new();
        let food_coords = Coords::random(&mut rng, Some(&snake.coord_set));
        Self {
            rng,
            snake,
            food_coords,
            speed: 1,
            status: GameStatus::Ongoing,
            score: 0
        }
    }

    /// Reset the game state to start a new game.
    pub(crate) fn reset(&mut self) {
        self.snake = Snake::new();
        self.place_food();
        self.speed = 1;
        self.status = GameStatus::Ongoing;
        self.score = 0;
    }

    /// Randomly place food on the grid.
    fn place_food(&mut self) -> Coords {
        let coords = Coords::random(&mut self.rng, Some(&self.snake.coord_set));
        self.food_coords = coords;
        coords
    }

    /// "Wrap around" out of bounds coordinates (eg, coordinates that are off to the
    /// left of the grid will appear in the rightmost column). Assumes that
    /// coordinates are out of bounds in one dimension only.
    fn wraparound(&self, coords: Coords) -> Coords {
        if coords.row < 0 {
            Coords { row: 4, ..coords }
        } else if coords.row >= 5 {
            Coords { row: 0, ..coords }
        } else if coords.col < 0 {
            Coords { col: 4, ..coords }
        } else {
            Coords { col: 0, ..coords }
        }
    }

    /// Determine the next tile that the snake will move on to (without actually
    /// moving the snake).
    fn get_next_move(&self) -> Coords {
        let head = &self.snake.head;
        let next_move = match self.snake.direction {
            Direction::Up => Coords { row: head.row - 1, col: head.col },
            Direction::Down => Coords { row: head.row + 1, col: head.col },
            Direction::Left => Coords { row: head.row, col: head.col - 1 },
            Direction::Right => Coords { row: head.row, col: head.col + 1 },
        };
        if next_move.is_out_of_bounds() {
            self.wraparound(next_move)
        } else {
            next_move
        }
    }

    /// Assess the snake's next move and return the outcome. Doesn't actually update
    /// the game state.
    fn get_step_outcome(&self) -> StepOutcome {
        let next_move = self.get_next_move();
        if self.snake.coord_set.contains(&next_move) {
            // We haven't moved the snake yet, so if the next move is at the end of
            // the tail, there won't actually be any collision (as the tail will have
            // moved by the time the head moves onto the tile)
            if next_move != *self.snake.tail.peek().unwrap() {
                StepOutcome::Collision(next_move)
            } else {
                StepOutcome::Move(next_move)
            }
        } else if next_move == self.food_coords {
            if self.snake.tail.len() == 23 {
                StepOutcome::Full(next_move)
            } else {
                StepOutcome::Eat(next_move)
            }
        } else {
            StepOutcome::Move(next_move)
        }
    }

    /// Handle the outcome of a step, updating the game's internal state.
    fn handle_step_outcome(&mut self, outcome: StepOutcome) {
        self.status = match outcome {
            StepOutcome::Collision(_) => GameStatus::Lost,
            StepOutcome::Full(_) => GameStatus::Won,
            StepOutcome::Eat(c) => {
                self.snake.move_snake(c, true);
                self.place_food();
                self.score += 1;
                if self.score % 5 == 0 {
                    self.speed += 1
                }
                GameStatus::Ongoing
            },
            StepOutcome::Move(c) => {
                self.snake.move_snake(c, false);
                GameStatus::Ongoing
            }
        }
    }

    pub(crate) fn step(&mut self, turn: Turn) {
        self.snake.turn(turn);
        let outcome = self.get_step_outcome();
        self.handle_step_outcome(outcome);
    }

    /// Calculate the length of time to wait between game steps, in milliseconds.
    /// Generally this will get lower as the player's score increases, but need to
    /// be careful it cannot result in a value below zero.
    pub(crate) fn step_len_ms(&self) -> u32 {
        let result = 1000 - (200 * ((self.speed as i32) - 1));
        if result < 200 {
            200u32
        } else {
            result as u32
        }
    }

    /// Return an array representing the game state, which can be used to display the
    /// state on the microbit's LED matrix. Each `_brightness` parameter should be a
    /// value between 0 and 9.
    pub(crate) fn game_matrix(
        &self,
        head_brightness: u8,
        tail_brightness: u8,
        food_brightness: u8
    ) -> [[u8; 5]; 5] {
        let mut values = [[0u8; 5]; 5];
        values[self.snake.head.row as usize][self.snake.head.col as usize] = head_brightness;
        for t in &self.snake.tail {
            values[t.row as usize][t.col as usize] = tail_brightness
        }
        values[self.food_coords.row as usize][self.food_coords.col as usize] = food_brightness;
        values
    }

    /// Return an array representing the game score, which can be used to display the
    /// score on the microbit's LED matrix (by illuminating the equivalent number of
    /// LEDs, going left->right and top->bottom).
    pub(crate) fn score_matrix(&self) -> [[u8; 5]; 5] {
        let mut values = [[0u8; 5]; 5];
        let full_rows = (self.score as usize) / 5;
        for r in 0..full_rows {
            values[r] = [1; 5];
        }
        for c in 0..(self.score as usize) % 5 {
            values[full_rows][c] = 1;
        }
        values
    }
}
```

## `main`文件

下面是`main.rs`中的代码：

```rust
#![no_main]
#![no_std]

mod game;

use cortex_m_rt::entry;
use microbit::{
   Board,
   hal::{prelude::*, Rng, Timer},
   display::blocking::Display
};
use rtt_target::rtt_init_print;
use panic_rtt_target as _;
use crate::game::{Game, GameStatus, Turn};

#[entry]
fn main() -> ! {
   rtt_init_print!();
   let mut board = Board::take().unwrap();
   let mut timer = Timer::new(board.TIMER0);
   let mut rng = Rng::new(board.RNG);
   let mut game = Game::new(rng.random_u32());
   let mut display = Display::new(board.display_pins);

   loop {
      loop {  // Game loop
         let image = game.game_matrix(9, 9, 9);
         // The brightness values are meaningless at the moment as we haven't yet
         // implemented a display capable of displaying different brightnesses
         display.show(&mut timer, image, game.step_len_ms());
         match game.status {
            GameStatus::Ongoing => game.step(Turn::None), // Placeholder as we
                                                          // haven't implemented
                                                          // controls yet
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

初始化了电路板和它的定时器以及RNG外设后，我们初始化了一个`Game`结构体，以及一个`microbit::display::blocking`中的`Display`结构体。

在我们的“游戏循环”（运行在`main`函数中的“主循环“内部），程序重复执行以下步骤：

1. 获取一个5x5的字节矩阵，它表示网格。
   `Game::get_matrix`方法需要三个整形参数（它应该是0～9，包含上下限），它们分别表示蛇头、蛇尾和食物的亮度。
   我们当前使用的基本`Display`不支持调节亮度，因此当前设为9即可（其他非零值也行）。
2. 显示矩阵，持续时间由`Game::step_len_ms`方法决定。
   在当前的实现中，该方法初始时提供每个步骤间1秒的间隔，玩家每获得5分（吃掉一个食物获得1分）减少200毫秒，下限为200毫秒。
3. 检查游戏状态。
   如果是`Ongoing`（初始值），执行游戏的一个步骤并更新游戏状态（包括其`status`属性）。
   否则，游戏结束，闪烁当前画面三次，然后显示玩家分数（用点亮的LED数表示），最后退出游戏循环。

主循环将重复运行游戏，每次迭代后重置游戏状态。

如果你运行这个程序，你应该会看到两个LED灯在显示屏的中间偏下的位置点亮（蛇的头部在中间，它的尾部在左侧）。你还会看到另一个LED灯在板子上的某个地方点亮，代表蛇的食物。大约每秒钟，蛇会向右移动一格。

下一节，我们将增加控制蛇移动的能力。
