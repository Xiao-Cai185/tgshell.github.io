document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("user-input");
    const outputDiv = document.getElementById("output");
    let currentDir = "/tmp/tg"; // 默认目录
    let isConnected = true; // 是否连接状态

    const prompt = () => (isConnected ? `admin@tkctf:${currentDir}$` : "Press Enter to reconnect...");

    // 显示欢迎语
    const showWelcomeMessage = () => {
        outputDiv.innerHTML = `
TKLinux tkctf-amd64 #2025.1.10 x86_64 GNU/TKLinux

The programs included with the TKLinux GNU/TKLinux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/copyright.\n\n`;
    };

    // 模拟文件系统
    const simulatedFiles = {
        "/usr/share/doc/copyright": "This is a joke",
    };

    // 执行命令
    async function executeCommand(command) {
        try {
            if (command.startsWith("cat ")) {
                const filePath = command.slice(4).trim();
                if (simulatedFiles[filePath]) {
                    return { response: simulatedFiles[filePath], current_dir: currentDir };
                } else {
                    return { response: `cat: ${filePath}: No such file or directory`, current_dir: currentDir };
                }
            }
            const response = await fetch(`https://shellapi.tkctf.top?command=${encodeURIComponent(command)}`);
            return await response.json();
        } catch (error) {
            return { response: `Error: Unable to process command. ${error.message}`, current_dir: currentDir };
        }
    }

    // 监听键盘输入
    inputField.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            const command = inputField.value.trim();
            inputField.value = "";

            // 如果是中断状态
            if (!isConnected) {
                if (command === "") {
                    isConnected = true;
                    outputDiv.innerHTML += `${prompt()}\n`;
                }
                return;
            }

            // 显示命令
            outputDiv.innerHTML += `${prompt()} ${command}\n`;

            // 处理 clear 命令
            if (command === "clear") {
                outputDiv.innerHTML = "";
                return;
            }

            // 处理 exit 命令
            if (command === "exit") {
                outputDiv.innerHTML += "Session closed. Goodbye!\n";
                isConnected = false;
                outputDiv.innerHTML += "Press Enter to reconnect\n";
                return;
            }

            // 处理其他命令
            if (command) {
                const { response, current_dir } = await executeCommand(command);

                // 显示返回结果
                outputDiv.innerHTML += `${response}\n`;

                // 更新目录（如果返回有效）
                if (current_dir) {
                    currentDir = current_dir;
                }
            }

            // 滚动到底部
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }
    });

    // 初始化显示欢迎语
    showWelcomeMessage();
});
