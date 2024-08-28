/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import os from 'os';
import express from 'express';
import { ipcRenderer } from 'electron';

import JoystickKeyboardMapper from './JoystickKeyboardMapper.mjs';

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * This class helps in creating a server to load the joystick and to receive
 * inputs from the joystick
 */
class ExpressServer {
    /** This is the constructor (note the singleton implementation) */
    constructor() {
        if (ExpressServer._instance) {
            return ExpressServer._instance;
        }
        ExpressServer._instance = this;

        this.port = 7172;
        this.baseURL = `http://${this.getLocalIPAddress()}:${this.port}`;
        this.securityKey = crypto.randomUUID().split('-')[0];
    }

    /**
     * start the server
     */
    start() {
        this.app = express();

        this.app.set('views', join(__dirname, 'JoystickWebApp'));
        this.app.set('view engine', 'ejs');
        this.app.use(express.json());
        this.app.use(express.static(__dirname + '/JoystickWebApp'));

        this.app.get(`/:securityKey`, (req, res) => {
            if (req.params.securityKey !== this.securityKey) {
                res.send('Virtual Joystick; please scan the QR code');
                return;
            }
            const playerIP =
                req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            res.render(
                'index.ejs',
                {
                    playerID : JoystickKeyboardMapper.getPlayerID(playerIP) + 1
                }
            );
        });

        this.app.post('/keyEvent/:securityKey', (req, res) => {
            if (req.params.securityKey !== this.securityKey) {
                res.send(false);
                return;
            }
            const data = req.body;
            const playerIP =
                req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            for (let i = 0; i < data.buttonID.length; ++i) {
                // Communicating joystick event to main that handles robotJS
                const action = {
                    button: JoystickKeyboardMapper.getKeyboardButton(
                        playerIP, data.buttonID[i]
                    ),
                    upOrDown: data.startOrEnd === 'start' ? 'down' : 'up'
                };
                ipcRenderer.invoke('robotKeyToggleAction', action);
            }
            res.send(true);
        });

        this.app.listen(this.port, (error) => {
            if(error) {
                console.log("Error: ", error);
                window.alert("Error: ", error);
            } else {
                console.log(`Open the joystick at: ${this.getJoystickURL()}`)
            }
        });
    }

    /**
     * Get the URL to load the joystick
     */
    getJoystickURL() {
        return `${this.baseURL}/${this.securityKey}`;
    }

    /**
     * Get the IP address of the computer using network interfaces
     * @returns {string} ip address or 'localhost'
     */
    getLocalIPAddress() {
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
};

export default new ExpressServer();
