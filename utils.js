const fs = require("node:fs");
const path = require("node:path");

async function getImageData(filePath) {
    let data = {
        path: filePath,
        name: path.basename(filePath),
        ext: path.extname(filePath).toLowerCase(),
        format: null,
        width: null,
        height: null,
    };
    try {
        const buffer = Buffer.alloc(30);
        const fileHandle = await fs.promises.open(filePath, "r");
        await fileHandle.read(buffer, 0, 30, 0);
        await fileHandle.close();

        const hex = buffer.toString("hex").toLowerCase();

        if (hex.startsWith("ffd8ff")) {
            data.format = "jpeg";
            const jpegDims = await getJPEGDimensions(filePath);
            data.width = jpegDims.width;
            data.height = jpegDims.height;
        } else if (hex.startsWith("89504e470d0a1a0a")) {
            data.format = "png";
            data.width = buffer.readUInt32BE(16);
            data.height = buffer.readUInt32BE(20);
        } else if (hex.startsWith("47494638")) {
            data.format = "gif";
            data.width = buffer.readUInt16LE(6);
            data.height = buffer.readUInt16LE(8);
        } else if (hex.startsWith("424d")) {
            data.format = "bmp";
            data.width = buffer.readUInt32LE(18);
            data.height = Math.abs(buffer.readUInt32LE(22));
        } else if (hex.startsWith("52494646") && buffer.toString("ascii", 8, 12) === "WEBP") {
            data.format = "webp";
            const webpDims = await getWebPDimensions(filePath);
            data.width = webpDims.width;
            data.height = webpDims.height;
        } else if (hex.startsWith("49492a00") || hex.startsWith("4d4d002a")) {
            data.format = "tiff";
            // TODO: implement TIFF dimension extraction
        }
        // TODO: detect svg & extract dimensions
        // TODO: detect ico & extract dimensions
    } catch (error) {}
    return data;
}

async function getJPEGDimensions(filePath) {
    let dimensions = { width: null, height: null };
    try {
        const fileHandle = await fs.promises.open(filePath, "r");
        const buffer = Buffer.alloc(1024); // Read in chunks
        let offset = 2; // Skip initial FF D8
        outerLoop: while (offset < 1024) {
            await fileHandle.read(buffer, 0, Math.min(1024, offset + 512), offset);
            for (let i = 0; i < buffer.length - 9; i++) {
                // Look for SOF markers (FF C0-C3, FF C5-C7, FF C9-CB, FF CD-CF)
                if (
                    buffer[i] === 0xff &&
                    ((buffer[i + 1] >= 0xc0 && buffer[i + 1] <= 0xc3) ||
                        (buffer[i + 1] >= 0xc5 && buffer[i + 1] <= 0xc7) ||
                        (buffer[i + 1] >= 0xc9 && buffer[i + 1] <= 0xcb) ||
                        (buffer[i + 1] >= 0xcd && buffer[i + 1] <= 0xcf))
                ) {
                    dimensions.height = buffer.readUInt16BE(i + 5);
                    dimensions.width = buffer.readUInt16BE(i + 7);
                    break outerLoop;
                }
            }
            offset += 512;
        }
        await fileHandle.close();
    } catch (error) {}
    return dimensions;
}

async function getWebPDimensions(filePath) {
    let dimensions = { width: null, height: null };
    try {
        const buffer = Buffer.alloc(30);
        const fileHandle = await fs.promises.open(filePath, "r");
        await fileHandle.read(buffer, 0, 30, 0);
        await fileHandle.close();
        const chunkType = buffer.toString("ascii", 12, 16);
        if (chunkType === "VP8 ") {
            // VP8 format
            dimensions.width = buffer.readUInt16LE(26) & 0x3fff;
            dimensions.height = buffer.readUInt16LE(28) & 0x3fff;
        } else if (chunkType === "VP8L") {
            // VP8L format
            const bits = buffer.readUInt32LE(21);
            dimensions.width = (bits & 0x3fff) + 1;
            dimensions.height = ((bits >> 14) & 0x3fff) + 1;
        } else if (chunkType === "VP8X") {
            // VP8X format
            dimensions.width = buffer.readUIntLE(24, 3) + 1;
            dimensions.height = buffer.readUIntLE(27, 3) + 1;
        }
    } catch (error) {}
    return dimensions;
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
                    let imageData = null;
                    if (!isImage && fileExt === "") {
                        imageData = await getImageData(fullPath);
                        isImage = imageData.format !== null;
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

module.exports = { scanDirectory, getImageData };
