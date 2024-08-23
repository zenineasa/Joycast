/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

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
    initialize() {
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

        this.availableKeys = [];
        // Alphabets
        for(let i = 'a'.charCodeAt(0); i < 'a'.charCodeAt(0)+26; ++i) {
            this.availableKeys.push(String.fromCharCode(i));
        }
        // Numbers
        for (let i = 0; i < 9; ++i) {
            this.availableKeys.push(i.toString());
            this.availableKeys.push(`numpad_${i}`);
        }
        // F1 to F20; although most machines can go beyond, some machines set this limit
        // to the number of F-keys
        for(let i = 1; i <= 20; ++i) {
            this.availableKeys.push(`f${i}`);
        }
        // Other keys
        this.availableKeys.push(
            'up', 'down', 'right', 'left',
            'numpad_+', 'numpad_-', 'numpad_*', 'numpad_/', 'numpad_.',
            'home', 'end', 'pageup', 'pagedown',
            'backspace', 'delete', 'enter', 'tab', 'escape'
        );

        this.playerIPVsID = {};
        this.lastPlayerID = -1;
    }

    getPlayerID(playerIP) {
        if (this.playerIPVsID.hasOwnProperty(playerIP)) {
            return this.playerIPVsID[playerIP];
        }
        const playerID = ++this.lastPlayerID;
        this.playerIPVsID[playerIP] = playerID;
        return playerID;
    }

    getKeyboardButton(playerIP, buttonID) {
        const playerID = this.getPlayerID(playerIP);
        const buttonNumber = this.buttonIDVsOrder[buttonID];
        return this.availableKeys[playerID * this.numButtonsPerPlayer + buttonNumber];
    }
};

export default new JoystickKeyboardMapper();
