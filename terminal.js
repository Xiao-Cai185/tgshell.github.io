document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("user-input");
    const outputDiv = document.getElementById("output");
    let currentDir = "/tmp/tg"; // 默认目录
    let isConnected = true; // 表示是否处于连接状态

    const prompt = () => (isConnected ? `admin@tkctf:${currentDir}$` : "Press Enter to reconnect");

    // 模拟欢迎语
    const showWelcomeMessage = () => {
        outputDiv.innerHTML += `
TKLinux tkctf-amd64 #2025.1.10 x86_64 GNU/TKLinux

The programs included with the TKLinux GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/copyright.\n\n`;
    };

    // 模拟文件系统
    const simulatedFiles = {
        "/usr/share/doc/copyright": "This is a joke",
    };

    // 执行命令函数
    async function executeCommand(command) {
        try {
            // 模拟本地文件读取
            if (command.startsWith("cat ")) {
                const filePath = command.slice(4).trim();
                if (simulatedFiles[filePath]) {
                    return { response: simulatedFiles[filePath], current_dir: currentDir };
                } else {
                    return { response: `cat: ${filePath}: No such file or directory`, current_dir: currentDir };
                }
            }

            // 与后端交互
            const response = await fetch(`https://shellapi.tkctf.top?command=${encodeURIComponent(command)}`);
            return await response.json();
        } catch (error) {
            return { response: `Error: Unable to process command. ${error.message}`, current_dir: currentDir };
        }
    }

    // 键盘事件监听
    inputField.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            const command = inputField.value.trim();
            inputField.value = "";

            // 显示命令
            outputDiv.innerHTML += `${prompt()} ${command}\n`;

            // 如果未连接，处理重连逻辑
            if (!isConnected) {
                if (command === "") {
                    isConnected = true;
                    outputDiv.innerHTML += `${prompt()}\n`;
                }
                return;
            }

            // 处理 `exit` 命令
            if (command === "exit") {
                outputDiv.innerHTML += "Session closed. Goodbye!\n";
                isConnected = false;
                return;
            }

            // 处理 `clear` 命令
            if (command === "clear") {
                outputDiv.innerHTML = "";
                return;
            }

            // 执行其他命令
            if (command) {
                const { response, current_dir } = await executeCommand(command);

                // 显示返回结果
                outputDiv.innerHTML += `${response}\n`;

                // 更新目录信息（如果 API 返回的目录有效）
                if (current_dir) {
                    currentDir = current_dir;
                }
            }

            // 滚动到底部
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }
    });

    // 初始化欢迎语
    showWelcomeMessage();
    outputDiv.innerHTML += `${prompt()}\n`;
});
