#!/usr/bin/env node
/* Copyright (c) 2024 Zenin Easa Panthakkalakath */

import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * This script helps in launching the software using the 'npx' command.
 */
spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
}).on('exit', (code, _signal) => {
    process.exit(code);
});
