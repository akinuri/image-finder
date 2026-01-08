const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    selectFolder: () => ipcRenderer.invoke("select-folder"),
    scanFiles: (folderPath) => ipcRenderer.invoke("scan-files", folderPath),
});
