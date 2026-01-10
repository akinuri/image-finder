const fs = require("node:fs");
const path = require("node:path");

async function isImageFile(filePath) {
    try {
        const buffer = Buffer.alloc(12);
        const fileHandle = await fs.promises.open(filePath, "r");
        await fileHandle.read(buffer, 0, 12, 0);
        await fileHandle.close();

        const hex = buffer.toString("hex").toLowerCase();

        // JPEG: FF D8 FF
        if (hex.startsWith("ffd8ff")) return true;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (hex.startsWith("89504e470d0a1a0a")) return true;

        // GIF: 47 49 46 38 (GIF8)
        if (hex.startsWith("47494638")) return true;

        // BMP: 42 4D
        if (hex.startsWith("424d")) return true;

        // WebP: RIFF....WEBP (52494646....57454250)
        if (hex.startsWith("52494646") && hex.includes("57454250")) return true;

        // TIFF: 49 49 2A 00 (little endian) or 4D 4D 00 2A (big endian)
        if (hex.startsWith("49492a00") || hex.startsWith("4d4d002a")) return true;
    } catch (error) {}
    return false;
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
                        isImage = await isImageFile(fullPath);
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

module.exports = { scanDirectory, isImageFile };
