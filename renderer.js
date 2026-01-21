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

            result.files.forEach(async (fileData) => {
                const imageItem = document.createElement("div");
                imageItem.className =
                    "flex flex-col items-center border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-colors user-select-none cursor-pointer";
                imageItem.title = fileData.path;
                imageItem._fileData = fileData;

                const img = document.createElement("img");
                img.className = "w-28 h-28 object-cover rounded";

                const filename = fileData.name;
                img.alt = filename;

                // TODO: redesign placeholder
                img.src =
                    "data:image/svg+xml;base64," +
                    btoa(`
                    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
                        <rect width="256" height="256" fill="#f0f0f0"/>
                        <text x="128" y="140" text-anchor="middle" font-size="32" fill="#999">Loading...</text>
                    </svg>
                `);

                // TODO: gen thumb when image is huge
                const cacheKey = fileData.path;
                if (window.thumbnails.cache.has(cacheKey)) {
                    img.src = window.thumbnails.cache.get(cacheKey);
                } else {
                    try {
                        const thumbnailData = await window.thumbnails.generate(fileData.path);
                        window.thumbnails.cache.set(cacheKey, thumbnailData);
                        img.src = thumbnailData;
                    } catch (error) {
                        showImageError();
                    }
                }

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
                        await window.api.showItemInFolder(fileData.path);
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

            populateTypeFilterOptions(result.files);
        } else {
            // statusDiv.textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        // statusDiv.textContent = `Error: ${error.message}`;
    } finally {
        scanBtn.disabled = false;
    }
}

function populateTypeFilterOptions(files) {
    let typeFilterList = document.querySelector("#type-filter-list");
    while (typeFilterList.firstChild) {
        typeFilterList.removeChild(typeFilterList.firstChild);
    }
    let types = {};
    files.forEach((fileData) => {
        types[fileData.extension] = (types[fileData.extension] || 0) + 1;
    });
    let typesSorted = Object.keys(types).sort((a, b) => a.localeCompare(b));
    typesSorted.forEach((extension) => {
        let count = types[extension];
        let li = document.createElement("li");
        li.innerHTML = `
            <label class="flex gap-2 justify-between w-full hover:bg-slate-200 rounded p-[2px] pl-2 select-none">
                <div>
                    <input
                        type="checkbox"
                        value="${extension}"
                    >
                    <span>${extension}</span>
                </div>
                <span class="text-black/30 mr-1">(${count})</span>
            </label>
        `;
        li.querySelector("input").addEventListener("change", filterImages);
        typeFilterList.appendChild(li);
    });
}

function filterImages() {
    let filteredTypes = Array.from(document.querySelectorAll("#type-filter-list input[type='checkbox']:checked")).map(
        (input) => input.value,
    );

    let filesEl = document.querySelector("#files");
    for (let imageItem of filesEl.children) {
        let fileData = imageItem._fileData;
        let show = true;
        if (filteredTypes.length > 0) {
            if (!filteredTypes.includes(fileData.extension)) {
                show = false;
            }
        }
        imageItem.hidden = !show;
    }
}
