const recordingAppsConfig = require('./recording-apps.json');

function getRecordingApps() {
    try {
        // Tüm process listelerini düz bir array'e çevir
        return recordingAppsConfig.recordingApps.reduce((allProcesses, category) => {
            return [...allProcesses, ...category.processes];
        }, []);
    } catch (error) {
        return [];
    }
}

module.exports = {
    getRecordingApps
}; 