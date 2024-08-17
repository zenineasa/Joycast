/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import os from 'os';
import express from 'express';
import robot from 'robotjs';
import qrcode from 'qrcode';
import open from 'open';

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
const availableKeys = [
    //'-', '=', '[', ']', ';', '\'', ',', '.', '/', '\\', '`', ' '
];
for(let i = 'a'.charCodeAt(0); i < 'a'.charCodeAt(0)+26; ++i) {
    availableKeys.push(String.fromCharCode(i));
}
for (let i = 0; i < 9; ++i) {
    availableKeys.push(i.toString());
}

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
app.use(express.static(__dirname + '/view'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/view/index.html');
});

app.get('/qr', (req, res) => {
    qrcode.toDataURL(url, function (err, base64URL) {
        res.send(`<html><body><img src="${base64URL}"></body></html>`);
    })
});

app.post('/keyEvent', (req, res) => {
    const data = req.body;
    const playerIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    for (let i = 0; i < data.buttonID.length; ++i) {
        robot.keyToggle(
            getKeyboardButton(playerIP, buttonIDVsOrder[data.buttonID[i]]),
            data.startOrEnd === 'start' ? 'down' : 'up'
        );
    }
    res.send(true);
});

app.listen(PORT, (error) => {
    if(!error) {
        console.log(`Joystick running at ${url}`);
        open(url + '/qr');
    } else {
        console.log("Error: ", error);
    }
});
