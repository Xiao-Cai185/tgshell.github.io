document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("user-input");
    const outputDiv = document.getElementById("output");
    const terminalDiv = document.getElementById("terminal");
    let currentDir = "/tmp/tg";
    let isConnected = true;
    let history = [];
    let historyIndex = -1;

    const prompt = () => (isConnected ? `admin@tkctf:${currentDir}$` : "Press Enter to reconnect...");

    const scrollToBottom = () => {
        setTimeout(() => {
            terminalDiv.scrollTo({
                top: terminalDiv.scrollHeight,
                behavior: 'smooth'
            });
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

    const loadHistoryFromCookie = () => {
        const cookieHistory = document.cookie.split("; ").find(row => row.startsWith("commandHistory="));
        if (cookieHistory) {
            try {
                history = JSON.parse(decodeURIComponent(cookieHistory.split("=")[1])) || [];
            } catch (e) {
                console.error("Failed to load command history:", e);
                history = [];
            }
        }
    };

    const saveHistoryToCookie = () => {
        document.cookie = `commandHistory=${encodeURIComponent(JSON.stringify(history))}; path=/; max-age=31536000`;
    };

    const updateHistory = (command) => {
        if (command && (history.length === 0 || history[history.length - 1] !== command)) {
            history.push(command);
            saveHistoryToCookie();
        }
        historyIndex = history.length;
    };

    async function executeCommand(command) {
        try {
            const response = await fetch(`https://shellapi.tkctf.top?command=${encodeURIComponent(command)}`);
            return await response.json();
        } catch (error) {
            return { response: `Error: Unable to process command. ${error.message}`, current_dir: currentDir };
        }
    }

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

            outputDiv.innerHTML += `${prompt()} ${command}\n`;
            scrollToBottom();

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

            if (command) {
                updateHistory(command);

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

        if (event.key === "ArrowUp") {
            if (historyIndex > 0) {
                historyIndex--;
                inputField.value = history[historyIndex];
            }
        }

        if (event.key === "ArrowDown") {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                inputField.value = history[historyIndex];
            } else {
                historyIndex = history.length;
                inputField.value = "";
            }
        }
    });

    showWelcomeMessage();
    loadHistoryFromCookie();

    const resizeObserver = new ResizeObserver(() => {
        scrollToBottom();
    });
    resizeObserver.observe(terminalDiv);
});
