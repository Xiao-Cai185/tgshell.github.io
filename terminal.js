document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("user-input");
    const outputDiv = document.getElementById("output");
    const terminalDiv = document.getElementById("terminal");
    let currentDir = "/tmp/tg";
    let isConnected = true;
    let currentPing = null; // 用于跟踪当前 ping 命令状态

    const prompt = () => (isConnected ? `admin@tkctf:${currentDir}$` : "Press Enter to reconnect...");

    const scrollToBottom = () => {
        setTimeout(() => {
            const scrollOptions = {
                top: terminalDiv.scrollHeight,
                behavior: 'smooth'
            };
            terminalDiv.scrollTo(scrollOptions);
        }, 0);
    };

    const showWelcomeMessage = () => {
        outputDiv.innerHTML = `
TKLinux tkctf-amd64 #2025.1.11 x86_64 GNU/TKLinux

The programs included with the TKLinux GNU/TKLinux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/copyright.\n\n`;
        scrollToBottom();
    };

    async function executeCommand(command) {
        try {
            const response = await fetch(`https://shellapi.tkctf.top?command=${encodeURIComponent(command)}`);
            return await response.json();
        } catch (error) {
            return { response: `Error: Unable to process command. ${error.message}`, current_dir: currentDir };
        }
    }

    const startPing = (ip) => {
        outputDiv.innerHTML += `PING ${ip} (${ip}) 56(84) bytes of data.\n`;
        scrollToBottom();

        currentPing = new EventSource(`https://shellapi.tkctf.top/ping?ip=${encodeURIComponent(ip)}`);

        currentPing.onmessage = (event) => {
            if (event.data === "END") {
                currentPing.close();
                currentPing = null;
                outputDiv.innerHTML += `--- ${ip} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss\nrtt min/avg/max/mdev = 0.924/1.032/1.115/0.077 ms\n`;
                outputDiv.innerHTML += `${prompt()}`;
                scrollToBottom();
            } else {
                outputDiv.innerHTML += `${event.data}\n`;
                scrollToBottom();
            }
        };

        currentPing.onerror = () => {
            currentPing.close();
            currentPing = null;
            outputDiv.innerHTML += "Error: Ping interrupted.\n";
            outputDiv.innerHTML += `${prompt()}`;
            scrollToBottom();
        };
    };

    const stopPing = async () => {
        if (currentPing) {
            currentPing.close();
            currentPing = null;
            await fetch("https://shellapi.tkctf.top/ping/stop");
            outputDiv.innerHTML += `^C\n`;
            scrollToBottom();
        }
    };

    inputField.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            const command = inputField.value.trim();
            inputField.value = "";

            if (!isConnected) {
                if (command === "") {
                    isConnected = true;
                    outputDiv.innerHTML += `${prompt()}\n`;
                    scrollToBottom();
                    inputField.focus();
                }
                return;
            }

            // Always add prompt and newline for any Enter press
            outputDiv.innerHTML += `${prompt()} ${command}\n`;
            scrollToBottom();

            if (currentPing && command === "^C") {
                await stopPing();
                outputDiv.innerHTML += `${prompt()}`;
                scrollToBottom();
                return;
            }

            // Handle actual commands only if there is input
            if (command === "clear") {
                outputDiv.innerHTML = "";
                scrollToBottom();
                return;
            }

            if (command === "exit") {
                outputDiv.innerHTML += "Session closed. Goodbye!\n";
                isConnected = false;
                outputDiv.innerHTML += "Press Enter to reconnect\n";
                scrollToBottom();
                inputField.focus();
                return;
            }

            const [cmd, ...args] = command.split(" ");
            if (cmd === "ping" && args.length === 1) {
                startPing(args[0]);
                return;
            }

            if (command) {
                const observer = new MutationObserver(() => {
                    scrollToBottom();
                });

                observer.observe(outputDiv, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });

                const { response, current_dir } = await executeCommand(command);
                outputDiv.innerHTML += `${response}\n`;

                if (current_dir) {
                    currentDir = current_dir;
                }

                observer.disconnect();
                scrollToBottom();
            }

            inputField.focus();
        }
    });

    showWelcomeMessage();

    const resizeObserver = new ResizeObserver(() => {
        scrollToBottom();
    });
    resizeObserver.observe(terminalDiv);
});
