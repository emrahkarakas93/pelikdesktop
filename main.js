const { app, BrowserWindow, session, screen, ipcMain, desktopCapturer } = require("electron");
const path = require("path");
const dotenv = require("dotenv");
const { exec } = require('child_process');
const getmac = require('getmac').default;
const { getRecordingApps } = require('./src/config/recording-apps');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

const envPath = app.isPackaged 
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '.env');

dotenv.config({ path: envPath });

let mainWindow;
let cachedToken = null;
let tokenExpiryTime = null;
let lastProcessCheck = 0;
let lastDetectionResult = { isRecording: false, detectedApp: null };
let consecutiveDetections = 0;
const DETECTION_THRESHOLD = 2; // Kaç kez üst üste tespit edilmesi gerektiği
const CHECK_INTERVAL = 3000; // Kontrol aralığı (ms)

// Güncelleme loglarını yapılandır
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

function getCachedToken() {
  if (!cachedToken || (tokenExpiryTime && Date.now() > tokenExpiryTime)) {
    cachedToken = null;
    tokenExpiryTime = null;
    return mainWindow.webContents
      .executeJavaScript(`localStorage.getItem('token') || sessionStorage.getItem('token')`)
      .then(token => {
        if (token) {
          cachedToken = token;
          tokenExpiryTime = Date.now() + (5 * 60 * 1000); // 5 dakika cache
        }
        return token;
      });
  }
  return Promise.resolve(cachedToken);
}

function isProcessActive(processName, processList) {
  // Process ismini normalize et
  const normalizedName = processName.toLowerCase().replace(/\s+/g, '');
  return processList.some(proc => proc.toLowerCase().replace(/\s+/g, '').includes(normalizedName));
}

async function getRunningProcesses() {
  return new Promise((resolve) => {
    exec('tasklist /FO CSV /NH', (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }
      // CSV formatındaki process listesini parse et
      const processes = stdout
        .split('\n')
        .map(line => {
          const match = line.match(/"([^"]+)"/);
          return match ? match[1].toLowerCase() : '';
        })
        .filter(Boolean);
      resolve(processes);
    });
  });
}

async function checkRunningProcesses() {
  const now = Date.now();
  
  if (now - lastProcessCheck < CHECK_INTERVAL) {
    return lastDetectionResult;
  }
  
  try {
    const processes = await getRunningProcesses();
    
    if (!processes.length) {
      consecutiveDetections = 0;
      lastDetectionResult = { isRecording: false, detectedApp: null };
      return lastDetectionResult;
    }

    const videoRecordingApps = getRecordingApps();
    const detectedApp = videoRecordingApps.find(app => {
      const appName = app.replace('.exe', '');
      const isActive = isProcessActive(appName, processes);
      return isActive;
    });

    lastProcessCheck = now;

    if (detectedApp) {
      consecutiveDetections++;
      
      if (consecutiveDetections >= DETECTION_THRESHOLD) {
        lastDetectionResult = {
          isRecording: true,
          detectedApp: detectedApp.replace('.exe', '')
        };
      }
    } else {
      consecutiveDetections = 0;
      lastDetectionResult = {
        isRecording: false,
        detectedApp: null
      };
    }

    return lastDetectionResult;
  } catch (error) {
    return { isRecording: false, detectedApp: null };
  }
}

async function checkScreenCapture() {
  try {
    const processCheck = await checkRunningProcesses();
    
    if (processCheck.isRecording) {
      mainWindow.webContents.send('screen-capture-status', processCheck);
    } else {
      mainWindow.webContents.send('screen-capture-status', {
        isRecording: false,
        detectedApp: null
      });
    }
  } catch (error) {
    mainWindow.webContents.send('screen-capture-status', {
      isRecording: false,
      detectedApp: null
    });
  }
}

function startScreenCaptureDetection() {
  // İlk kontrolü hemen yap
  checkScreenCapture();
  // Sonraki kontrolleri belirli aralıklarla yap
  setInterval(checkScreenCapture, CHECK_INTERVAL);
}

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    title: 'Pelik',
    icon: path.join(__dirname, 'public', 'icon.png'),
    autoHideMenuBar: true,
    fullscreen: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false,
      devTools: false
    },
  });

  mainWindow.loadFile("./build/index.html");
  startScreenCaptureDetection();

  // Güncelleme kontrolü
  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }

  // Güncelleme olayları
  autoUpdater.on('checking-for-update', () => {
    log.info('Güncellemeler kontrol ediliyor...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Güncelleme mevcut:', info);
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Güncelleme yok');
  });

  autoUpdater.on('error', (err) => {
    log.error('Güncelleme hatası:', err);
    mainWindow.webContents.send('update-error', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('update-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Güncelleme indirildi:', info);
    mainWindow.webContents.send('update-downloaded', info);
  });

  // WebView session ayarları
  const webviewSession = session.fromPartition("persist:session");
  webviewSession.webRequest.onBeforeSendHeaders(
    { urls: ["*://*/*"] },
    (details, callback) => {
      Promise.all([
        getCachedToken(),
        mainWindow.webContents.executeJavaScript('localStorage.getItem("device_mac")')
      ]).then(([token, deviceMac]) => {
        details.requestHeaders["x-api-key"] = process.env.REACT_APP_API_KEY;
        if (token) {
          details.requestHeaders["Authorization"] = `Bearer ${token}`;
        }
        if (deviceMac) {
          const cleanMacAddress = deviceMac.replace(/[^a-fA-F0-9:]/g, '');
          details.requestHeaders["x-device-mac"] = cleanMacAddress;
        }
        callback({ cancel: false, requestHeaders: details.requestHeaders });
      });
    }
  );

  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });
}

ipcMain.on("toggle-fullscreen", () => {
  const isFullscreen = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFullscreen);
});

// MAC adresi için IPC handler
ipcMain.handle('get-mac-address', () => {
  return new Promise((resolve) => {
    try {
      const macAddress = getmac();
      // MAC adresini doğrula
      const isValidMac = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress);
      
      if (!isValidMac) {
        console.error('Geçersiz MAC adresi formatı:', macAddress);
        resolve({ success: false, error: 'Geçersiz MAC adresi formatı' });
        return;
      }

      console.log('MAC Address:', macAddress);
      resolve({ success: true, macAddress });
    } catch (err) {
      console.error('MAC adresi alınamadı:', err);
      resolve({ success: false, error: err.message });
    }
  });
});

// Güncelleme olayları için IPC handlers
ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

app.whenReady().then(createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
}); 