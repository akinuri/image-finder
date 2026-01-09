let selectedFolderPath = null;

window.addEventListener("DOMContentLoaded", () => {
    const dirInput = document.querySelector("#dirInput");
    const scanBtn = document.querySelector("#scanBtn");

    document.querySelector("#selectBtn").addEventListener("click", selectFolder);
    document.querySelector("#scanBtn").addEventListener("click", scanFiles);

    dirInput.addEventListener("input", () => {
        scanBtn.disabled = dirInput.value.trim() === "";
        if (dirInput.value.trim()) {
            selectedFolderPath = dirInput.value.trim();
        }
    });
});

async function selectFolder() {
    try {
        const folderPath = await window.api.selectFolder();
        if (folderPath) {
            selectedFolderPath = folderPath;
            document.querySelector("#dirInput").value = folderPath;
            document.querySelector("#scanBtn").disabled = false;
            document.querySelector("#status").textContent = "";
            document.querySelector("#files").innerHTML = "";
        }
    } catch (error) {
        document.querySelector("#status").textContent = `Error selecting folder: ${error.message}`;
    }
}

async function scanFiles() {
    const dirInput = document.querySelector("#dirInput");
    const currentPath = dirInput.value.trim();

    if (!currentPath) {
        document.querySelector("#status").textContent = "Please enter or select a folder path";
        return;
    }

    const statusDiv = document.querySelector("#status");
    const filesDiv = document.querySelector("#files");
    const scanBtn = document.querySelector("#scanBtn");

    statusDiv.textContent = `Scanning ${currentPath}...`;
    filesDiv.innerHTML = "";
    scanBtn.disabled = true;

    try {
        const result = await window.api.scanFiles(currentPath);

        if (result.success) {
            statusDiv.textContent = `Found ${result.files.length} files:`;

            result.files.forEach((file) => {
                const fileDiv = document.createElement("li");
                fileDiv.className = "font-mono leading-7 text-sm";
                fileDiv.textContent = file;
                filesDiv.appendChild(fileDiv);
            });
        } else {
            statusDiv.textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
    } finally {
        scanBtn.disabled = false;
    }
}
