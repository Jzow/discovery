// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded affix "><a href="index.html">介绍</a></li><li class="chapter-item expanded "><a href="01-background/index.html"><strong aria-hidden="true">1.</strong> 背景</a></li><li class="chapter-item expanded "><a href="02-requirements/index.html"><strong aria-hidden="true">2.</strong> 硬件/知识要求</a></li><li class="chapter-item expanded "><a href="03-setup/index.html"><strong aria-hidden="true">3.</strong> 搭建开发环境</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="03-setup/linux.html"><strong aria-hidden="true">3.1.</strong> Linux</a></li><li class="chapter-item expanded "><a href="03-setup/windows.html"><strong aria-hidden="true">3.2.</strong> Windows</a></li><li class="chapter-item expanded "><a href="03-setup/macos.html"><strong aria-hidden="true">3.3.</strong> macOS</a></li><li class="chapter-item expanded "><a href="03-setup/verify.html"><strong aria-hidden="true">3.4.</strong> 验证安装</a></li><li class="chapter-item expanded "><a href="03-setup/IDE.html"><strong aria-hidden="true">3.5.</strong> 设置IDE</a></li></ol></li><li class="chapter-item expanded "><a href="04-meet-your-hardware/index.html"><strong aria-hidden="true">4.</strong> 满足您的硬件</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="04-meet-your-hardware/microbit-v2.html"><strong aria-hidden="true">4.1.</strong> micro:bit v2</a></li><li class="chapter-item expanded "><a href="04-meet-your-hardware/microbit-v1.html"><strong aria-hidden="true">4.2.</strong> micro:bit v1</a></li><li class="chapter-item expanded "><a href="04-meet-your-hardware/terminology.html"><strong aria-hidden="true">4.3.</strong> Rust嵌入式术语</a></li></ol></li><li class="chapter-item expanded "><a href="05-led-roulette/index.html"><strong aria-hidden="true">5.</strong> LED 轮盘</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="05-led-roulette/build-it.html"><strong aria-hidden="true">5.1.</strong> 构建</a></li><li class="chapter-item expanded "><a href="05-led-roulette/flash-it.html"><strong aria-hidden="true">5.2.</strong> 闪存</a></li><li class="chapter-item expanded "><a href="05-led-roulette/debug-it.html"><strong aria-hidden="true">5.3.</strong> 调试</a></li><li class="chapter-item expanded "><a href="05-led-roulette/light-it-up.html"><strong aria-hidden="true">5.4.</strong> 点亮</a></li><li class="chapter-item expanded "><a href="05-led-roulette/it-blinks.html"><strong aria-hidden="true">5.5.</strong> 闪烁</a></li><li class="chapter-item expanded "><a href="05-led-roulette/the-challenge.html"><strong aria-hidden="true">5.6.</strong> 挑战</a></li><li class="chapter-item expanded "><a href="05-led-roulette/my-solution.html"><strong aria-hidden="true">5.7.</strong> 我的解决方案</a></li></ol></li><li class="chapter-item expanded "><a href="06-serial-communication/index.html"><strong aria-hidden="true">6.</strong> 串口通讯</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="06-serial-communication/nix-tooling.html"><strong aria-hidden="true">6.1.</strong> *nix工具</a></li><li class="chapter-item expanded "><a href="06-serial-communication/windows-tooling.html"><strong aria-hidden="true">6.2.</strong> Windows工具</a></li></ol></li><li class="chapter-item expanded "><a href="07-uart/index.html"><strong aria-hidden="true">7.</strong> UART</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="07-uart/send-a-single-byte.html"><strong aria-hidden="true">7.1.</strong> 发送单个字节</a></li><li class="chapter-item expanded "><a href="07-uart/send-a-string.html"><strong aria-hidden="true">7.2.</strong> 发送字符串</a></li><li class="chapter-item expanded "><a href="07-uart/naive-approch-write.html"><strong aria-hidden="true">7.3.</strong> 简单的方法和write!</a></li><li class="chapter-item expanded "><a href="07-uart/receive-a-single-byte.html"><strong aria-hidden="true">7.4.</strong> 接受单个字节</a></li><li class="chapter-item expanded "><a href="07-uart/echo-server.html"><strong aria-hidden="true">7.5.</strong> Echo服务器</a></li><li class="chapter-item expanded "><a href="07-uart/reverse-a-string.html"><strong aria-hidden="true">7.6.</strong> 反转字符串</a></li><li class="chapter-item expanded "><a href="07-uart/my-solution.html"><strong aria-hidden="true">7.7.</strong> 我的解决方案</a></li></ol></li><li class="chapter-item expanded "><a href="08-i2c/index.html"><strong aria-hidden="true">8.</strong> I2C</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="08-i2c/the-general-protocol.html"><strong aria-hidden="true">8.1.</strong> 通用协议</a></li><li class="chapter-item expanded "><a href="08-i2c/lsm303agr.html"><strong aria-hidden="true">8.2.</strong> LSM303AGR</a></li><li class="chapter-item expanded "><a href="08-i2c/read-a-single-register.html"><strong aria-hidden="true">8.3.</strong> 读取单个寄存器</a></li><li class="chapter-item expanded "><a href="08-i2c/using-a-driver.html"><strong aria-hidden="true">8.4.</strong> 使用驱动程序</a></li><li class="chapter-item expanded "><a href="08-i2c/the-challenge.html"><strong aria-hidden="true">8.5.</strong> 挑战</a></li><li class="chapter-item expanded "><a href="08-i2c/my-solution.html"><strong aria-hidden="true">8.6.</strong> 我的解决方案</a></li></ol></li><li class="chapter-item expanded "><a href="09-led-compass/index.html"><strong aria-hidden="true">9.</strong> LED指南针</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="09-led-compass/calibration.html"><strong aria-hidden="true">9.1.</strong> 校准</a></li><li class="chapter-item expanded "><a href="09-led-compass/take-1.html"><strong aria-hidden="true">9.2.</strong> Take 1</a></li><li class="chapter-item expanded "><a href="09-led-compass/solution-1.html"><strong aria-hidden="true">9.3.</strong> 解决方案 1</a></li><li class="chapter-item expanded "><a href="09-led-compass/take-2.html"><strong aria-hidden="true">9.4.</strong> Take 2</a></li><li class="chapter-item expanded "><a href="09-led-compass/solution-2.html"><strong aria-hidden="true">9.5.</strong> 解决方案 2</a></li><li class="chapter-item expanded "><a href="09-led-compass/magnitude.html"><strong aria-hidden="true">9.6.</strong> 大小</a></li></ol></li><li class="chapter-item expanded "><a href="10-punch-o-meter/index.html"><strong aria-hidden="true">10.</strong> 冲压式流量计</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="10-punch-o-meter/gravity-is-up.html"><strong aria-hidden="true">10.1.</strong> 重力上升了？</a></li><li class="chapter-item expanded "><a href="10-punch-o-meter/the-challenge.html"><strong aria-hidden="true">10.2.</strong> 挑战</a></li><li class="chapter-item expanded "><a href="10-punch-o-meter/my-solution.html"><strong aria-hidden="true">10.3.</strong> 我的解决方案</a></li></ol></li><li class="chapter-item expanded "><a href="11-snake-game/index.html"><strong aria-hidden="true">11.</strong> 贪吃蛇游戏</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="11-snake-game/game-logic.html"><strong aria-hidden="true">11.1.</strong> 游戏逻辑</a></li><li class="chapter-item expanded "><a href="11-snake-game/controls.html"><strong aria-hidden="true">11.2.</strong> 控制</a></li><li class="chapter-item expanded "><a href="11-snake-game/nonblocking-display.html"><strong aria-hidden="true">11.3.</strong> 非阻塞显示</a></li></ol></li><li class="chapter-item expanded "><a href="explore.html"><strong aria-hidden="true">12.</strong> 还有什么需要你去探索</a></li><li class="chapter-item expanded affix "><li class="spacer"></li><li class="chapter-item expanded affix "><a href="appendix/1-general-troubleshooting/index.html">一般故障排除</a></li><li class="chapter-item expanded affix "><a href="appendix/2-how-to-use-gdb/index.html">如何使用GDB</a></li><li class="chapter-item expanded affix "><li class="spacer"></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
