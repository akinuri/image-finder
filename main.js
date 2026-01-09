const { app, BrowserWindow, ipcMain, dialog } = require("electron/main");
const { scanDirectory } = require("./utils");

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: require("path").join(__dirname, "preload.js"),
        },
    });
    mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
    // IPC handler for folder selection
    ipcMain.handle("select-folder", async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory"],
            title: "Select Folder to Scan",
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0];
        }
        return null;
    });

    // IPC handler for scanning files
    ipcMain.handle("scan-files", async (event, folderPath) => {
        try {
            const files = await scanDirectory(folderPath);
            return { success: true, files };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    createWindow();

    // macOS: Re-create window when dock icon is clicked and no other windows are open
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// macOS: Apps stay open even when all windows are closed
// Other platforms: Quit the app when all windows are closed
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
