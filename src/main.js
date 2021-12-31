require('v8-compile-cache');
const path = require('path');
const { app, BrowserWindow, clipboard, dialog, ipcMain } = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const Store = require('electron-store');
const config = new Store();
const { autoUpdate, sendBadges, updateRPC, startTwitch, initBadges, initRPC, closeTwitch, closeRPC } = require('./features');
const { io } = require('socket.io-client');
const socket = io('https://kirkaclient.herokuapp.com/');

const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fs = require('fs');
const easylist = fs.readFileSync(path.join(__dirname, 'easylist.txt'), 'utf-8');
const blocker = ElectronBlocker.parse(easylist);

const gamePreload = path.join(__dirname, 'preload', 'global.js');
const splashPreload = path.join(__dirname, 'preload', 'splash.js');
const settingsPreload = path.join(__dirname, 'preload', 'settings.js');
const changeLogsPreload = path.join(__dirname, 'preload', 'changelogs.js');

let win;
let splash;
let setwin;
let canDestroy = false;
let updateContent;
let errTries = 0;
let changeLogs;
let icon = process.platform === 'linux' ? path.join(__dirname, 'media', 'icon.png') :  path.join(__dirname, 'media', 'icon.ico')

socket.on('connect', () => {
    console.log('WebSocket Connected!');
    const engine = socket.io.engine;
    engine.once('upgrade', () => {
        console.log(engine.transport.name);
    });
    const channel = config.get('betaTester', false) ? 'beta' : 'stable';
    socket.send({ type: 5, channel: channel, version: app.getVersion() });
});

socket.on('disconnect', () => {
    console.log('WebSocket Disconnected!');
});

socket.on('message', (data) => {
    switch (data.type) {
    case 1:
        socket.send({ type: 1, data: 'pong' });
        break;
    case 3:
        updateRPC(data.data);
        break;
    case 4:
        sendBadges(data.data);
        if (win)
            win.webContents.send('badges', data.data);
        break;
    case 5:
        updateContent = data.data.updates;
        changeLogs = data.data.changelogs;
        break;
    }
});

if (require('electron-squirrel-startup'))
    app.quit();

if (config.get('unlimitedFPS', true))
    app.commandLine.appendSwitch('disable-frame-rate-limit');


app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-print-preview');
app.commandLine.appendSwitch('disable-metrics');
app.commandLine.appendSwitch('disable-metrics-repo');
app.commandLine.appendSwitch('enable-javascript-harmony');
app.commandLine.appendSwitch('no-referrers');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('high-dpi-support', 1);
app.commandLine.appendSwitch('disable-2d-canvas-clip-aa');
app.commandLine.appendSwitch('disable-bundled-ppapi-flash');
app.commandLine.appendSwitch('disable-logging');
app.commandLine.appendSwitch('disable-web-security');

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        backgroundColor: '#000000',
        titleBarStyle: 'hidden',
        show: false,
        title: `KirkaClient v${app.getVersion()}`,
        acceptFirstMouse: true,
        icon: icon,
        webPreferences: {
            preload: gamePreload,
            enableRemoteModule: true,
            contextIsolation: false,
            nodeIntegration: true
        },
    });
    win.removeMenu();
    createShortcutKeys();

    win.loadURL('https://kirka.io/');


    win.webContents.on('new-window', function(event, url) {
        event.preventDefault();
        win.loadURL(url);
    });

    const contents = win.webContents;

    win.once('ready-to-show', () => {
        blocker.enableBlockingInSession(win.webContents.session);
        showWin();
        initRPC(socket, contents);
        initBadges(socket);
        startTwitch(contents);
        ensureDirs();
    });

    ipcMain.on('getContents', (event) => {
        console.log('asking contents');
        event.returnValue = win.id;
    });

    ipcMain.on('toggleRPC', () => {
        const state = config.get('discordRPC');
        if (state)
            initRPC(socket, contents);
        else
            closeRPC();
    });

    function showWin() {
        if (!canDestroy) {
            setTimeout(showWin, 500);
            return;
        }
        splash.destroy();
        if (config.get('fullScreenStart', true))
            win.setFullScreen(true);

        win.show();
        if (config.get('update', true))
            showChangeLogs();
    }
}

function ensureDirs() {
    const documents = app.getPath('documents');
    const appPath = path.join(documents, 'KirkaClient');
    const recorderPath = path.join(appPath, 'videos');

    if (!fs.existsSync(appPath))
        fs.mkdirSync(appPath);
    if (!fs.existsSync(recorderPath))
        fs.mkdirSync(recorderPath);
    win.webContents.send('logDir', appPath);
}

function showChangeLogs() {
    const changeLogsWin = new BrowserWindow({
        width: 700,
        height: 700,
        center: true,
        frame: true,
        show: false,
        icon: icon,
        title: 'KirkaClient ChangeLogs',
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            preload: changeLogsPreload
        }
    });
    changeLogsWin.removeMenu();
    // <button data-v-02c36fca="" data-v-b427fee8="" class="button right-btn rectangle" style="background-color: var(--secondary-5); --hover-color:#5C688F; --top:#5C688F; --bottom:#252E4B;"><div data-v-02c36fca="" class="triangle"></div><div data-v-02c36fca="" class="text"><svg data-v-b8de1e14="" data-v-b427fee8="" xmlns="http://www.w3.org/2000/svg" class="icon-settings svg-icon svg-icon--settings" data-v-02c36fca=""><!----><use data-v-b8de1e14="" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/img/icons.3c1a58be.svg#settings"></use></svg></div><div data-v-02c36fca="" class="borders"><div data-v-02c36fca="" class="border-top border"></div><div data-v-02c36fca="" class="border-bottom border"></div></div></button>

    let html = '';
    const versions = Object.keys(changeLogs);
    for (let i = 0; i < versions.length; i++) {
        const version = versions[i];
        const data = changeLogs[version];
        const changes = data.changes;
        const releaseDate = data.releaseDate;
        html += `<h5 class="mt-4"> <span class="p-2 bg-light shadow rounded text-success"> Version ${version}</span> - ${releaseDate}</h5>
        <ul class="list-unstyled mt-3">`;
        changes.forEach(line => {
            html += `<li class="text-muted ml-3"><i class="mdi mdi-circle-medium mr-2"></i>${line}</li>`;
        });
        html += '</ul>';
    }

    changeLogsWin.loadFile(`${__dirname}/changelogs/index.html`);

    changeLogsWin.on('ready-to-show', () => {
        console.log('cl ready to show');
        changeLogsWin.show();
    });

    ipcMain.on('get-html', () => {
        changeLogsWin.webContents.send('html', html);
    });
    config.set('update', false);
}

function createShortcutKeys() {
    const contents = win.webContents;

    electronLocalshortcut.register(win, 'Escape', () => contents.executeJavaScript('document.exitPointerLock()', true));
    electronLocalshortcut.register(win, 'F4', () => clipboard.writeText(contents.getURL()));
    electronLocalshortcut.register(win, 'F5', () => contents.reload());
    electronLocalshortcut.register(win, 'Shift+F5', () => contents.reloadIgnoringCache());
    electronLocalshortcut.register(win, 'F6', () => checkkirka());
    electronLocalshortcut.register(win, 'F11', () => win.setFullScreen(!win.isFullScreen()));
    electronLocalshortcut.register(win, 'F12', () => win.webContents.openDevTools());
    if (config.get('controlW', true))
        electronLocalshortcut.register('Control+W', () => { return false; });
}

function checkkirka() {
    const urld = clipboard.readText();
    if (urld.includes('https://kirka.io/games/'))
        win.loadURL(urld);
}

app.whenReady().then(() => createSplashWindow());

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        socket.disconnect();
        closeRPC();
        closeTwitch();
        app.quit();
    }
});

function createSplashWindow() {
    splash = new BrowserWindow({
        width: 600,
        height: 350,
        center: true,
        resizable: false,
        frame: false,
        show: true,
        icon: icon,
        title: 'Loading Client',
        transparent: true,
        webPreferences: {
            preload: splashPreload,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    splash.loadFile(`${__dirname}/splash/splash.html`);
    splash.webContents.on('dom-ready', () => initAutoUpdater(splash.webContents));
}

async function initAutoUpdater(webContents) {
    if (updateContent === undefined) {
        setTimeout(() => {
            if (!socket.connected)
                errTries = errTries + 1;
            if (errTries >= 40) {
                dialog.showErrorBox('Websocket Error', 'Client is experiencing issues connecting to the WebSocket. ' +
                'Please report this issue to the support server ASAP!');
                app.quit();
                return;
            }
            initAutoUpdater(webContents);
        }, 500);
        return;
    }

    const didUpdate = await autoUpdate(webContents, updateContent);
    if (didUpdate) {
        config.set('update', true);
        const options = {
            buttons: ['Ok'],
            message: 'Update Complete! Please relaunch the client.'
        };
        await dialog.showMessageBox(options);
        app.quit();
    } else {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        createWindow();
        await wait(5000);
        canDestroy = true;
    }
}

ipcMain.on('show-settings', () => {
    if (setwin) {
        setwin.focus();
        return;
    }
    createSettings();
});

function createSettings() {
    setwin = new BrowserWindow({
        width: 1000,
        height: 600,
        show: false,
        frame: true,
        icon: icon,
        title: 'KirkaClient Settings',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            preload: settingsPreload
        }
    });
    setwin.removeMenu();
    setwin.loadFile(path.join(__dirname, '/settings/settings.html'));
    // setwin.setResizable(false)

    setwin.once('ready-to-show', () => {
        setwin.show();
        // setwin.webContents.openDevTools();
    });

    setwin.on('close', () => {
        setwin = null;
    });
}
