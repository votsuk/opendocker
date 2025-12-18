import { watch } from 'fs';
import { join } from 'path';

const __dirname = import.meta.dir;
const srcDir = join(__dirname, 'src');

let child = null;
let restartTimer = null;

function startApp() {
    if (child) {
        child.kill('SIGTERM');
        child = null;
    }

    child = Bun.spawn(['bun', '--conditions=browser', './src/index.tsx'], {
        stdio: ['inherit', 'inherit', 'inherit'],
        cwd: __dirname,
    });

    child.exited.then((code) => {
        if (code !== 0 && code !== null) {
        }
    });
}

function scheduleRestart() {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(() => {
        startApp();
    }, 100);
}

const watcher = watch(srcDir, { recursive: true }, (_, filename) => {
    if (filename && /\.(ts|tsx)$/.test(filename)) {
        scheduleRestart(filename);
    }
});

startApp();

process.on('SIGINT', () => {
    if (child) child.kill('SIGTERM');
    watcher.close();
    process.exit(0);
});
