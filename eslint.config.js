/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import google from 'eslint-config-google'

export default [{
    'files': ['**/*.js', '**/*.mjs'],
    'plugins': {
        'google': google
    },
    'languageOptions': {
        'ecmaVersion': 2022,
        'sourceType': 'module',
    },
    'rules': {
        'max-len': ["error", { "code": 80 }],
        'indent': ['error', 4],
        'linebreak-style': 0,
        'no-unused-vars': [
            "error",
            {
                'args': 'none',
                'caughtErrors': 'none'
            }
        ]
    }
}];
