# 发送单个字节

我们的第一个任务是通过串行连接将单个字节从微控制器发送到计算机。

这次，我将为您提供一个已经初始化的USART外围设备。您只需要使用负责发送和接收数据的寄存器。

进入`11-usart`目录，让我们在其中运行启动程序代码。确保打开了minicom/PuTTY。

``` rust
{{#include src/main.rs}}
```

该程序写入`TDR`寄存器。这导致`USART`外围设备通过串行接口发送一个字节的信息。

在接收端，您的计算机上，您应该看到字符`X`出现在minicom/PuTTY的终端上。
