/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import { app, BrowserWindow, screen, ipcMain } from 'electron';
import robot from '@meadowsjared/robotjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { updateElectronApp } from 'update-electron-app';
updateElectronApp();

const __dirname = dirname(fileURLToPath(import.meta.url));

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: screen.getPrimaryDisplay().workAreaSize.height,
        frame: false,
        transparent: true,
        title: 'Joystick',
        webPreferences: {
            preload: join(__dirname, 'preload.mjs'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('DesktopApp/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Information regarding joystick event is communicated here
ipcMain.handle('robotKeyToggleAction', (_event, action) => {
    robot.keyToggle(action.button, action.upOrDown);
});
ipcMain.handle('robotKeyTapAction', (_event, button) => {
    robot.keyTap(button);
    try {
        robot.keyTap(button);
        return true;
    } catch (error) {
        return false;
    }
});
