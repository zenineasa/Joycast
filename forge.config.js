/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import path from 'node:path';

export default {
    "packagerConfig": {},
    "rebuildConfig": {},
    "makers": [
        {
            "name": "@electron-forge/maker-zip",
            "platforms": [
                "darwin",
                "linux",
                "windows"
            ],
            "config": {}
        },
        {
            "name": "@electron-forge/maker-squirrel",
            "config": {
                // eslint-disable-next-line max-len
                "iconUrl": "https://raw.githubusercontent.com/zenineasa/joycast/master/DesktopApp/images/joycast.png",
                "setupIcon": path.join(
                    process.cwd(), "DesktopApp/images/joycast.ico"
                )
            }
        },
        {
            "name": "@electron-forge/maker-dmg",
            "config": {
                "icon": path.join(
                    process.cwd(), "DesktopApp/images/joycast.icns"
                )
            }
        },
        {
            "name": "@electron-forge/maker-deb",
            "config": {
                "options": {
                    "icon": path.join(
                        process.cwd(), "DesktopApp/images/joycast.png"
                    )
                }
            }
        },
        {
            "name": "@electron-forge/maker-rpm",
            "config": {
                "options": {
                    "icon": path.join(
                        process.cwd(), "DesktopApp/images/joycast.png"
                    )
                }
            }
        }
    ],
    "publishers": [
        {
            "name": "@electron-forge/publisher-github",
            "config": {
                "repository": {
                    "owner": "zenineasa",
                    "name": "joycast"
                },
                "prerelease": true
            }
        }
    ]
};
