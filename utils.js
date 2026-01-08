const fs = require("node:fs");
const path = require("node:path");

async function scanDirectory(dirPath) {
    const files = [];

    async function scan(currentPath) {
        try {
            const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);

                if (entry.isDirectory()) {
                    await scan(fullPath); // Recursively scan subdirectories
                } else if (entry.isFile()) {
                    files.push(fullPath);
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
