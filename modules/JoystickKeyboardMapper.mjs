/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import { ipcRenderer } from 'electron';
import fs from 'node:fs';
import { platform } from 'node:os';

/**
 * This class helps in mapping joystick buttons with keyboard keys
 */
class JoystickKeyboardMapper {
    /** This is the constructor (note the singleton implementation) */
    constructor() {
        if (JoystickKeyboardMapper._instance) {
            return JoystickKeyboardMapper._instance;
        }
        JoystickKeyboardMapper._instance = this;
        JoystickKeyboardMapper._instance.initialize();
    }

    /**
     * Initialize
     */
    async initialize() {
        this.playerIPVsID = {};
        this.lastPlayerID = -1;

        this.numButtonsPerPlayer = 0;
        this.buttonIDVsOrder = {
            'N': this.numButtonsPerPlayer++,
            'E': this.numButtonsPerPlayer++,
            'W': this.numButtonsPerPlayer++,
            'S': this.numButtonsPerPlayer++,
            'A': this.numButtonsPerPlayer++,
            'B': this.numButtonsPerPlayer++,
            'C': this.numButtonsPerPlayer++,
            'D': this.numButtonsPerPlayer++,
            'X': this.numButtonsPerPlayer++,
            'Y': this.numButtonsPerPlayer++,
        };

        if (window.localStorage.getItem('keyCodeVsName') === null) {
            // Load from the JSON files
            const jsonFilePath =
                `modules/defaults/${platform}.keyCodeVsName.json`;
            if (fs.existsSync(jsonFilePath)) {
                this.keyCodeVsName = JSON.parse(
                    fs.readFileSync(jsonFilePath, 'utf8')
                );
            } else {
                await this.generateDefaultMapping(jsonFilePath);
            }
        } else {
            // Load from local storage; this captures user edits
            this.keyCodeVsName = JSON.parse(
                window.localStorage.getItem('keyCodeVsName')
            );
        }

        if (document.readyState === "loading") {
            window.addEventListener(
                'DOMContentLoaded', this.displayMapping.bind(this)
            );
        } else {
            this.displayMapping();
        }
    }

    /**
     * Get the list of potentially available keys
     */
    potentiallyAvailableKeys() {
        const keyList = [];
        // Alphabets
        for(let i = 'a'.charCodeAt(0); i < 'a'.charCodeAt(0)+26; ++i) {
            keyList.push(String.fromCharCode(i));
        }
        // Numbers; both numpad and otherwise
        for (let i = 0; i < 9; ++i) {
            keyList.push(i.toString());
            keyList.push(`numpad_${i}`);
        }
        // F1 to F24; different operating systems have different limits;
        // some can go till F35
        for(let i = 1; i <= 35; ++i) {
            keyList.push(`f${i}`);
        }
        // Other keys
        keyList.push(
            'up', 'down', 'right', 'left',
            'numpad_+', 'numpad_-', 'numpad_*', 'numpad_/', 'numpad_.',
            'home', 'end', 'pageup', 'pagedown',
            'backspace', 'delete', 'enter', 'tab', 'escape'
        );

        return keyList;
    }

    /**
     * Validte keys and create a mapping between JavaScript event key codes and
     * RobotJS key codes.
     * @param {string} jsonFilePath where to save the generated mapping
     */
    async generateDefaultMapping(jsonFilePath) {
        window.alert(
            'Initializing: Scanning available keyboard keys.' +
            'After pressing "OK", do not use your keyboard until further' +
            'notice. This might take a few seconds.'
        );

        let eventCode;
        const waitForKeyPress = () => {
            return new Promise((resolve) => {
                const onKeyHandler = (e) => {
                    eventCode = e.code;
                    document.removeEventListener('keydown', onKeyHandler);
                    resolve();
                };
                document.addEventListener('keydown', onKeyHandler);
            });
        };
        const triggerKeyPress = async (key) => {
            return await ipcRenderer.invoke('robotKeyTapAction', key);
        };
        const keysToEvaluate = this.potentiallyAvailableKeys();

        this.keyCodeVsName = {};
        for(let i = 0; i < keysToEvaluate.length; ++i) {
            try {
                // Trigger the key twice; defensive measure
                await triggerKeyPress(keysToEvaluate[i]);
                await triggerKeyPress(keysToEvaluate[i]);
                // Now wait for the key press and trigger the key again
                const promise = waitForKeyPress();
                const success = await triggerKeyPress(keysToEvaluate[i]);
                if (!success) {
                    await triggerKeyPress('-');
                }
                await promise;
                // If valuated succesfully, add it to the lists/maps
                if(success) {
                    this.keyCodeVsName[eventCode] = keysToEvaluate[i];
                }
            } catch (error) {
                console.log(`${keysToEvaluate[i]} was not found`);
                await triggerKeyPress('-');
            }
        }

        window.localStorage.setItem(
            'keyCodeVsName', JSON.stringify(this.keyCodeVsName)
        )
        window.alert(
            'Initialization complete! You are free to use your keyboard.'
        );

        fs.writeFileSync(
            jsonFilePath,
            JSON.stringify(this.keyCodeVsName, null, 4),
            'utf8'
        );
    }

    /**
     * Display the key order on the UI
     */
    displayMapping() {
        const entriesInKeyEventVsName = Object.entries(this.keyCodeVsName);
        const maxNumPlayers = Math.floor(
            entriesInKeyEventVsName.length / this.numButtonsPerPlayer
        );

        const waitForKeyInput = document.getElementById('waitForKeyInput');
        const grid = document.querySelector('.grid');
        let configs = grid.querySelectorAll('.config');
        // If there is scope for more number of players than the number of
        // configs layed out in the grid, let's display more grids!
        for(let i = 0; i < maxNumPlayers - configs.length; ++i) {
            const div = document.createElement('div');
            const playerID = document.createElement('div');
            playerID.className = 'playerID';
            div.appendChild(playerID);
            const config = document.createElement('div');
            config.className = 'config';
            div.appendChild(config);
            grid.appendChild(div);
        }
        configs = grid.querySelectorAll('.config');

        // Now, display the different joystick keys versus their keyboard
        // counterpart
        this.playerIDVsButtonOrderVsKeyboardValue = {};
        let keyNumber = 0;
        for(let playerID = 0; playerID < maxNumPlayers; ++playerID) {
            this.playerIDVsButtonOrderVsKeyboardValue[playerID] = {};
            for(
                let [buttonID, buttonOrder] of
                Object.entries(this.buttonIDVsOrder)
            ) {
                const keyboardValue = entriesInKeyEventVsName[keyNumber++][1];

                this.playerIDVsButtonOrderVsKeyboardValue
                    [playerID][buttonOrder] = keyboardValue;

                const div = document.createElement('div');
                const key = document.createElement('div');
                const val = document.createElement('div');

                div.className = 'keyVal';
                key.className = 'key';
                val.className = 'val';

                key.innerHTML = buttonID;
                val.innerHTML = keyboardValue;

                div.appendChild(key);
                div.appendChild(val);
                configs[playerID].appendChild(div);

                div.onclick = (_clickEvent) => {
                    waitForKeyInput.style.display = 'table';
                    const onKeyHandler = (e) => {
                        waitForKeyInput.style.display = 'none';
                        const keyCodeOther = entriesInKeyEventVsName.find(
                            (elem) => elem[1] == keyboardValue
                        )[0];

                        // Exchange the values
                        [
                            this.keyCodeVsName[e.code],
                            this.keyCodeVsName[keyCodeOther]
                        ] = [
                            this.keyCodeVsName[keyCodeOther],
                            this.keyCodeVsName[e.code]
                        ]

                        // Update local storage and then reload
                        window.localStorage.setItem(
                            'keyCodeVsName', JSON.stringify(this.keyCodeVsName)
                        )
                        window.location.reload();
                    };
                    document.addEventListener('keydown', onKeyHandler);
                };
            }

            configs[playerID].parentElement.querySelector('.playerID')
                .innerHTML = "Player " + (playerID + 1);
        }
    }

    /**
     * Mapping between the IP address of the virtual joystick and player order
     * @param {string} playerIP
     * @returns {Number} numerical ID/order for the player
     */
    getPlayerID(playerIP) {
        if (this.playerIPVsID.hasOwnProperty(playerIP)) {
            return this.playerIPVsID[playerIP];
        }
        const playerID = ++this.lastPlayerID;
        this.playerIPVsID[playerIP] = playerID;
        return playerID;
    }

    /**
     * Mapping between the virtual joystick button to the keyboard
     * @param {string} playerIP
     * @param {char} buttonID
     * @returns
     */
    getKeyboardButton(playerIP, buttonID) {
        const playerID = this.getPlayerID(playerIP);
        const buttonOrder = this.buttonIDVsOrder[buttonID];
        return this.playerIDVsButtonOrderVsKeyboardValue[playerID][buttonOrder];
    }
};

export default new JoystickKeyboardMapper();
