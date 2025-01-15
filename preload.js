const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
    toggleFullscreen: () => ipcRenderer.send("toggle-fullscreen"),
    onScreenCaptureStatus: (callback) => {
        ipcRenderer.on('screen-capture-status', (_, status) => {
            callback(status);
        });
    },
    getMacAddress: () => ipcRenderer.invoke('get-mac-address'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    restartApp: () => ipcRenderer.send('restart-app'),
}); 