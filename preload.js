const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    selectFolder: () => ipcRenderer.invoke("select-folder"),
    scanFiles: (folderPath) => ipcRenderer.invoke("scan-files", folderPath),
    showItemInFolder: (filePath) => ipcRenderer.invoke("show-item-in-folder", filePath),
});

contextBridge.exposeInMainWorld("thumbnails", {
    generate: generateThumbnail,
    cache: new Map(),
});

function generateThumbnail(imagePath, size) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // TODO: handle fill modes: contain, cover, stretch, center
            // TODO: handle size: fixed, bounding box
            // TODO: remove background?

            const targetSize = size || 256;
            canvas.width = targetSize;
            canvas.height = targetSize;

            const aspectRatio = img.width / img.height;
            let drawWidth = targetSize;
            let drawHeight = targetSize;
            let offsetX = 0;
            let offsetY = 0;

            if (aspectRatio > 1) {
                drawWidth = targetSize;
                drawHeight = targetSize / aspectRatio;
                offsetY = (targetSize - drawHeight) / 2;
            } else {
                drawWidth = targetSize * aspectRatio;
                drawHeight = targetSize;
                offsetX = (targetSize - drawWidth) / 2;
            }

            ctx.fillStyle = "#f5f5f5";
            ctx.fillRect(0, 0, targetSize, targetSize);

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            const dataURL = canvas.toDataURL("image/jpeg", 0.7);
            resolve(dataURL);
        };

        img.onerror = () => reject(new Error(`Failed to load: ${imagePath}`));
        img.src = `file://${imagePath}`;
    });
}
