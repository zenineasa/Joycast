/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import os from 'os';
import express from 'express';
import { ipcRenderer } from 'electron';
import qrcode from 'qrcode';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let numButtonsPerPlayer = 0;
const buttonIDVsOrder = {
    'N': numButtonsPerPlayer++,
    'E': numButtonsPerPlayer++,
    'W': numButtonsPerPlayer++,
    'S': numButtonsPerPlayer++,
    'A': numButtonsPerPlayer++,
    'B': numButtonsPerPlayer++,
    'C': numButtonsPerPlayer++,
    'D': numButtonsPerPlayer++,
    'X': numButtonsPerPlayer++,
    'Y': numButtonsPerPlayer++,
};

let lastPlayerID = -1;
const playerIPVsID = {};
const availableKeys = [];
for(let i = 'a'.charCodeAt(0); i < 'a'.charCodeAt(0)+26; ++i) {
    availableKeys.push(String.fromCharCode(i));
}
for (let i = 0; i < 9; ++i) {
    availableKeys.push(i.toString());
    availableKeys.push(`numpad_${i}`);
}
for(let i = 1; i < 25; ++i) {
    availableKeys.push(`f${i}`);
}
availableKeys.push(
    'up', 'down', 'right', 'left',
    'numpad_+', 'numpad_-', 'numpad_*', 'numpad_/', 'numpad_.',
    'home', 'end', 'pageup', 'pagedown',
    'backspace', 'delete', 'enter', 'tab', 'escape'
);

function getPlayerID(playerIP) {
    if (playerIPVsID.hasOwnProperty(playerIP)) {
        return playerIPVsID[playerIP];
    }
    const playerID = ++lastPlayerID;
    playerIPVsID[playerIP] = playerID;
    return playerID;
}
function getKeyboardButton(playerIP, buttonNumber) {
    const playerID = getPlayerID(playerIP);
    return availableKeys[playerID * numButtonsPerPlayer + buttonNumber];
}

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}


const app = express();
const PORT = 7171;
const url = `http://${getLocalIPAddress()}:${PORT}`;

app.use(express.json());
app.use(express.static(__dirname + '/JoystickWebApp'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/JoystickWebApp/index.html');
});

app.post('/keyEvent', (req, res) => {
    const data = req.body;
    const playerIP =
        req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    for (let i = 0; i < data.buttonID.length; ++i) {
        // Communicating joystick event to main, which can handle robotJS
        const action = {
            button: getKeyboardButton(
                playerIP, buttonIDVsOrder[data.buttonID[i]]
            ),
            upOrDown: data.startOrEnd === 'start' ? 'down' : 'up'
        };
        ipcRenderer.invoke('robotKeyPressAction', action);
    }
    res.send(true);
});

app.listen(PORT, (error) => {
    if(!error) {
        const maxPlayers = Math.floor(availableKeys.length/numButtonsPerPlayer);
        console.log(`Joystick running at ${url}`);
        console.log(`Max players: ${maxPlayers}`)
    } else {
        console.log("Error: ", error);
    }
});

// Wait for the DOM elements to be available
window.addEventListener('DOMContentLoaded', () => {
    // Callback for maximize button
    let isMaximized = true;
    document.getElementById('maximize').addEventListener('click', () => {
        console.log('maximizing');
        if (isMaximized) {
            window.resizeTo(screen.availWidth/2, screen.availHeight/2);
        } else {
            window.resizeTo(screen.availWidth, screen.availHeight);
        }
        window.moveTo(0, 0);
        isMaximized = !isMaximized;
    });

    // Callback for close button
    document.getElementById('close').addEventListener('click', () => {
        console.log('closing');
        window.close();
    });

    // Render the QR code in the UI
    qrcode.toDataURL(url, (err, qrCodeInBase64URLFormat) => {
        document.getElementById('qrCode').innerHTML =
            `<img src="${qrCodeInBase64URLFormat}">`;
    });
});
