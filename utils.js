const fs = require("node:fs");
const path = require("node:path");

async function scanDirectory(dirPath) {
    const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".webp",
        ".svg",
        ".tiff",
        ".tif",
        ".ico",
        ".heic",
        ".heif",
    ];
    const files = [];
    async function scan(currentPath) {
        try {
            const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else if (entry.isFile()) {
                    const fileExt = path.extname(entry.name).toLowerCase();
                    if (imageExtensions.includes(fileExt)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            console.error(`Error reading ${currentPath}:`, error.message);
        }
    }
    await scan(dirPath);
    return files;
}

module.exports = { scanDirectory };
