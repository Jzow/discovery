# (mis)优化

寄存器的读/写非常特殊。我甚至敢说它们是副作用的体现。在前面的示例中，我们将四个不同的值写入同一个寄存器。
如果您不知道地址是一个寄存器，那么您可能已经简化了逻辑，只将最终值`1 << (11 + 16)`写入寄存器。

实际上，编译器的后端/优化器LLVM不知道我们正在处理寄存器，并将合并写入，从而改变程序的行为。让我们快速检查一下。

``` console
$ cargo run --release
(..)
Breakpoint 1, registers::__cortex_m_rt_main_trampoline () at src/07-registers/src/main.rs:7
7       #[entry]

(gdb) step
registers::__cortex_m_rt_main () at src/07-registers/src/main.rs:9
9           aux7::init();

(gdb) next
25              *(GPIOE_BSRR as *mut u32) = 1 << (11 + 16);

(gdb) disassemble /m
Dump of assembler code for function _ZN9registers18__cortex_m_rt_main17h45b1ef53e18aa8d0E:
8       fn main() -> ! {
   0x08000248 <+0>:     push    {r7, lr}
   0x0800024a <+2>:     mov     r7, sp

9           aux7::init();
   0x0800024c <+4>:     bl      0x8000260 <aux7::init>
   0x08000250 <+8>:     movw    r0, #4120       ; 0x1018
   0x08000254 <+12>:    mov.w   r1, #134217728  ; 0x8000000
   0x08000258 <+16>:    movt    r0, #18432      ; 0x4800

10
11          unsafe {
12              // A magic address!
13              const GPIOE_BSRR: u32 = 0x48001018;
14
15              // Turn on the "North" LED (red)
16              *(GPIOE_BSRR as *mut u32) = 1 << 9;
17
18              // Turn on the "East" LED (green)
19              *(GPIOE_BSRR as *mut u32) = 1 << 11;
20
21              // Turn off the "North" LED
22              *(GPIOE_BSRR as *mut u32) = 1 << (9 + 16);
23
24              // Turn off the "East" LED
25              *(GPIOE_BSRR as *mut u32) = 1 << (11 + 16);
=> 0x0800025c <+20>:    str     r1, [r0, #0]
   0x0800025e <+22>:    b.n     0x800025e <registers::__cortex_m_rt_main+22>

End of assembler dump.
```

这次LED的状态没有改变！`str`指令是将值写入寄存器的指令。我们的*debug*（未优化）程序有四个，每
个写入寄存器一个，但*release*（优化）程序只有一个。

我们可以使用`objdump`检查并将输出捕获到`out.asm`：

``` console
# same as cargo objdump -- -d --no-show-raw-insn --print-imm-hex --source target/thumbv7em-none-eabihf/debug/registers
cargo objdump --bin registers -- -d --no-show-raw-insn --print-imm-hex --source > debug.txt
```

然后检查`debug.txt`查找`main`我们看到4个`str`指令：
```
080001ec <main>:
; #[entry]
 80001ec:       push    {r7, lr}
 80001ee:       mov     r7, sp
 80001f0:       bl      #0x2
 80001f4:       trap

080001f6 <registers::__cortex_m_rt_main::hc2e3436fa38cd6f2>:
; fn main() -> ! {
 80001f6:       push    {r7, lr}
 80001f8:       mov     r7, sp
;     aux7::init();
 80001fa:       bl      #0x3e
 80001fe:       b       #-0x2 <registers::__cortex_m_rt_main::hc2e3436fa38cd6f2+0xa>
;         *(GPIOE_BSRR as *mut u32) = 1 << 9;
 8000200:       movw    r0, #0x2640
 8000204:       movt    r0, #0x800
 8000208:       ldr     r0, [r0]
 800020a:       movw    r1, #0x1018
 800020e:       movt    r1, #0x4800
 8000212:       str     r0, [r1]
;         *(GPIOE_BSRR as *mut u32) = 1 << 11;
 8000214:       movw    r0, #0x2648
 8000218:       movt    r0, #0x800
 800021c:       ldr     r0, [r0]
 800021e:       str     r0, [r1]
;         *(GPIOE_BSRR as *mut u32) = 1 << (9 + 16);
 8000220:       movw    r0, #0x2650
 8000224:       movt    r0, #0x800
 8000228:       ldr     r0, [r0]
 800022a:       str     r0, [r1]
;         *(GPIOE_BSRR as *mut u32) = 1 << (11 + 16);
 800022c:       movw    r0, #0x2638
 8000230:       movt    r0, #0x800
 8000234:       ldr     r0, [r0]
 8000236:       str     r0, [r1]
;     loop {}
 8000238:       b       #-0x2 <registers::__cortex_m_rt_main::hc2e3436fa38cd6f2+0x44>
 800023a:       b       #-0x4 <registers::__cortex_m_rt_main::hc2e3436fa38cd6f2+0x44>
 (..)
```

我们如何防止LLVM错误优化我们的程序？我们使用*易失性*操作而不是简单的读/写：

``` rust
#![no_main]
#![no_std]

use core::ptr;

#[allow(unused_imports)]
use aux7::entry;

#[entry]
fn main() -> ! {
    aux7::init();

    unsafe {
        // A magic address!
        const GPIOE_BSRR: u32 = 0x48001018;

        // Turn on the "North" LED (red)
        ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << 9);

        // Turn on the "East" LED (green)
        ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << 11);

        // Turn off the "North" LED
        ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << (9 + 16));

        // Turn off the "East" LED
        ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << (11 + 16));
    }

    loop {}
}

```

生成`release.txt`使用`--release`模式。

``` console
cargo objdump --release --bin registers -- -d --no-show-raw-insn --print-imm-hex --source > release.txt
```

现在在`release.txt`中找到`main`程序，我们看到了4个`str`指令。
```
0800023e <main>:
; #[entry]
 800023e:       push    {r7, lr}
 8000240:       mov     r7, sp
 8000242:       bl      #0x2
 8000246:       trap

08000248 <registers::__cortex_m_rt_main::h45b1ef53e18aa8d0>:
; fn main() -> ! {
 8000248:       push    {r7, lr}
 800024a:       mov     r7, sp
;     aux7::init();
 800024c:       bl      #0x22
 8000250:       movw    r0, #0x1018
 8000254:       mov.w   r1, #0x200
 8000258:       movt    r0, #0x4800
;         intrinsics::volatile_store(dst, src);
 800025c:       str     r1, [r0]
 800025e:       mov.w   r1, #0x800
 8000262:       str     r1, [r0]
 8000264:       mov.w   r1, #0x2000000
 8000268:       str     r1, [r0]
 800026a:       mov.w   r1, #0x8000000
 800026e:       str     r1, [r0]
 8000270:       b       #-0x4 <registers::__cortex_m_rt_main::h45b1ef53e18aa8d0+0x28>
 (..)
 ```

我们看到四个写入 (`str`指令)被保留。如果您使用`gdb`运行它，您还会看到我们得到了预期的行为。
> 注意：下一个`next`将无休止地执行`loop {}`，使用`Ctrl-c`返回`(gdb)`提示符。
```
$ cargo run --release
(..)

Breakpoint 1, registers::__cortex_m_rt_main_trampoline () at src/07-registers/src/main.rs:9
9       #[entry]

(gdb) step
registers::__cortex_m_rt_main () at src/07-registers/src/main.rs:11
11          aux7::init();

(gdb) next
18              ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << 9);

(gdb) next
21              ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << 11);

(gdb) next
24              ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << (9 + 16));

(gdb) next
27              ptr::write_volatile(GPIOE_BSRR as *mut u32, 1 << (11 + 16));

(gdb) next
^C
Program received signal SIGINT, Interrupt.
0x08000270 in registers::__cortex_m_rt_main ()
    at ~/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/lib/rustlib/src/rust/library/core/src/ptr/mod.rs:1124
1124            intrinsics::volatile_store(dst, src);
(gdb) 
```
