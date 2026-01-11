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

    const scannedPathEl = document.querySelector("#scannedPath");
    scannedPathEl.textContent = currentPath;

    const filesCountEl = document.querySelector("#filesCount");

    if (!currentPath) {
        document.querySelector("#status").textContent = "Please enter or select a folder path";
        return;
    }

    // TODO: handle status
    // const statusDiv = document.querySelector("#status");
    const filesDiv = document.querySelector("#files");
    const scanBtn = document.querySelector("#scanBtn");

    // statusDiv.textContent = `Scanning ${currentPath}...`;
    filesDiv.innerHTML = "";
    scanBtn.disabled = true;

    try {
        const result = await window.api.scanFiles(currentPath);

        if (result.success) {
            // statusDiv.textContent = `Found ${result.files.length} images:`;
            filesCountEl.textContent = `(${result.files.length} images)`;

            result.files.forEach((filePath) => {
                const imageItem = document.createElement("div");
                imageItem.className =
                    "flex flex-col items-center border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-colors user-select-none cursor-pointer";
                imageItem.title = filePath;

                const img = document.createElement("img");
                img.className = "w-28 h-28 object-cover rounded";
                img.src = `file://${filePath}`;

                const filename = filePath.split(/[\\/]/).pop();
                img.alt = filename;

                function showImageError() {
                    img.style.display = "none";
                    const errorDiv = document.createElement("div");
                    errorDiv.className =
                        "w-28 h-28 flex items-center justify-center bg-red-100 text-red-500 rounded text-xs";
                    errorDiv.textContent = "Load Error";
                    imageItem.insertBefore(errorDiv, img);
                }
                img.onerror = showImageError;

                imageItem.addEventListener("dblclick", async () => {
                    try {
                        await window.api.showItemInFolder(filePath);
                    } catch (error) {
                        console.error("Failed to open folder:", error);
                    }
                });

                const filenameDiv = document.createElement("div");
                filenameDiv.className =
                    "text-xs text-center text-gray-600 break-words max-w-full mt-2 whitespace-nowrap overflow-hidden text-ellipsis";
                filenameDiv.textContent = filename;

                imageItem.appendChild(img);
                imageItem.appendChild(filenameDiv);
                filesDiv.appendChild(imageItem);
            });
        } else {
            // statusDiv.textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        // statusDiv.textContent = `Error: ${error.message}`;
    } finally {
        scanBtn.disabled = false;
    }
}
