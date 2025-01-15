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
    version: require('./package.json').version,
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    onUpdateAvailable: (callback) => {
        ipcRenderer.on('update-available', (_, info) => callback(info));
    },
    onUpdateProgress: (callback) => {
        ipcRenderer.on('update-progress', (_, progress) => callback(progress));
    },
    onUpdateError: (callback) => {
        ipcRenderer.on('update-error', (_, error) => callback(error));
    },
    onUpdateDownloaded: (callback) => {
        ipcRenderer.on('update-downloaded', (_, info) => callback(info));
    },
    installUpdate: () => ipcRenderer.send('install-update')
}); 