# 贪吃蛇游戏

在本章，我们将实现一个基本的[贪吃蛇](https://en.wikipedia.org/wiki/Snake_(video_game_genre))游戏，它可以在micro:bit v2上游玩。
5x5 LED矩阵作为屏幕，两个按钮作为控制。
为了实现它，我们将基于本书前面章节中的概念进行开发，也会学习一些新的外设和概念。

本章的特别之处，在于我们会使用硬件中断的概念，来实现程序同时和多个外设交互。
在嵌入式环境中，中断是实现并发的常用手段。
在开始之前，我建议您阅读[Embedded Rust Book](https://xxchang.github.io/book/concurrency/index.html)，它对对嵌入式环境下的并发做了很好的介绍。

> **NOTE** 本章是为micro:bit v2编写的，不适用于v1。
> 但也欢迎您将代码移植到v1。

> **NOTE** 在本章中，我们将使用之前章节中使用的库的更新版本。
> 我们将使用 `microbit`库的0.13.0版本（之前的章节使用的是0.12.0）。
> 0.13.0版本修复了一些无阻塞显示的代码中的bug，这些代码是我们会使用的。We are also going to use
> 我们也将使用`heapless`库的0.8.0版本library（之前章节中使用的是0.7.10），
> 以便我们可以使用其中某些实现了Rust的`core::Hash` trait的结构体。
