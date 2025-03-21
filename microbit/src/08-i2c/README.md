# I2C

我们刚刚看到了串行通信协议。它是一种广泛使用的协议，因为它非常简单，而且这种简单性使其易于在蓝牙和 USB 等其他协议之上实现。

然而，它的简单性也是一个缺点。更精细的数据交换，如读取数字传感器，将需要传感器供应商在其之上提出另一种协议。

(Un)幸运的是，嵌入式领域还有*大量*的其他通信协议。其中一些被广泛用于数字传感器。

我们使用的micro:bit板中有两个运动传感器：一个加速度计和一个磁力计。这两个传感器都封装在一个组件中，可以通过I2C总线访问。

I2C代表Inter-Integrated Circuit，是一种*同步串行*通信协议。它使用两条线来交换数据：一条数据线 (SDA) 和一条时钟线 (SCL)。
因为使用时钟线来同步通信，所以这是一个*同步*协议。

<p>
<img class="white_bg" height=360 title="I2C bus" src="https://upload.wikimedia.org/wikipedia/commons/0/04/I2C_controller-target.svg">
</p>

该协议使用*主* *从*模型，其中主设备是*启动*和驱动与从设备通信的设备。多个设备，包括主设备和从设备，
可以同时连接到同一总线。主设备可以通过首先将其*地址*广播到总线来与特定的从设备通信。该地址可以
是7位或10位长。 一旦主设备*开始*与从设备通信，在主设备*停止*通信之前，其他设备都不能使用总线。

时钟线决定了数据交换的速度，它通常以100kHz（标准模式）或400kHz（快速模式）的频率运行。
