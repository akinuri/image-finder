let selectedFolderPath = null;

// Add event listeners when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    const dirInput = document.getElementById('dirInput');
    const scanBtn = document.getElementById('scanBtn');
    
    document.getElementById('selectBtn').addEventListener('click', selectFolder);
    document.getElementById('scanBtn').addEventListener('click', scanFiles);
    
    // Enable scan button when text is entered
    dirInput.addEventListener('input', () => {
        scanBtn.disabled = dirInput.value.trim() === '';
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
            document.getElementById('dirInput').value = folderPath;
            document.getElementById('scanBtn').disabled = false;
            document.getElementById('status').textContent = '';
            document.getElementById('files').innerHTML = '';
        }
    } catch (error) {
        document.getElementById('status').textContent = `Error selecting folder: ${error.message}`;
    }
}

async function scanFiles() {
    const dirInput = document.getElementById('dirInput');
    const currentPath = dirInput.value.trim();
    
    if (!currentPath) {
        document.getElementById('status').textContent = 'Please enter or select a folder path';
        return;
    }

    const statusDiv = document.getElementById("status");
    const filesDiv = document.getElementById("files");
    const scanBtn = document.getElementById('scanBtn');

    statusDiv.textContent = `Scanning ${currentPath}...`;
    filesDiv.innerHTML = "";
    scanBtn.disabled = true;

    try {
        const result = await window.api.scanFiles(currentPath);

        if (result.success) {
            statusDiv.textContent = `Found ${result.files.length} files:`;

            result.files.forEach((file) => {
                const fileDiv = document.createElement("li");
                fileDiv.className = "file";
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
