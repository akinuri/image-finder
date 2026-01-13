const fs = require("node:fs");
const path = require("node:path");

async function getImageFormat(filePath) {
    try {
        const buffer = Buffer.alloc(12);
        const fileHandle = await fs.promises.open(filePath, "r");
        await fileHandle.read(buffer, 0, 12, 0);
        await fileHandle.close();

        const hex = buffer.toString("hex").toLowerCase();

        if (hex.startsWith("ffd8ff")) return "jpeg";
        if (hex.startsWith("89504e470d0a1a0a")) return "png";
        if (hex.startsWith("47494638")) return "gif";
        if (hex.startsWith("424d")) return "bmp";
        if (hex.startsWith("52494646") && hex.includes("57454250")) return "webp";
        if (hex.startsWith("49492a00") || hex.startsWith("4d4d002a")) return "tiff";

        return null;
    } catch (error) {
        return null;
    }
}

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
                    let isImage = imageExtensions.includes(fileExt);
                    if (!isImage && fileExt === "") {
                        isImage = (await getImageFormat(fullPath)) !== null;
                    }
                    if (isImage) {
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

module.exports = { scanDirectory, getImageFormat };
