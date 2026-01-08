const { app, BrowserWindow } = require("electron/main");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
    });
    win.loadFile("index.html");
};

app.whenReady().then(() => {
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
