async function executeCommand(command) {
    const response = await fetch(`https://shellapi.tkctf.top?command=${encodeURIComponent(command)}`);
    const data = await response.json();
    return data;
}
