require('v8-compile-cache');
const path = require('path');
const { app, BrowserWindow, clipboard, dialog, ipcMain } = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const Store = require('electron-store');
const config = new Store();
const { autoUpdate, sendBadges, sendMatches, startTwitch, initBadges, initRPC, closeTwitch, closeRPC } = require('./features');
const { io } = require('socket.io-client');
const socket = io('https://kirkaclient.herokuapp.com/');

const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fs = require('fs');
const easylist = fs.readFileSync(path.join(__dirname, 'easylist.txt'), 'utf-8');
const blocker = ElectronBlocker.parse(easylist);

const gamePreload = path.join(__dirname, 'preload', 'global.js');
const splashPreload = path.join(__dirname, 'preload', 'splash.js');
const settingsPreload = path.join(__dirname, 'preload', 'settings.js');

let win;
let splash;
let setwin;
let canDestroy = false;
let CtrlW = false;
let updateContent;
let errTries = 0;

socket.on('connect', () => {
    console.log('WebSocket Connected!');
    const channel = config.get('betaTester', false) ? 'beta' : 'stable';
    socket.send({ type: 5, channel: channel });
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
        sendMatches(data.data);
        break;
    case 4:
        sendBadges(data.data);
        if (win)
            win.webContents.send('badges', data.data);
        break;
    case 5:
        updateContent = data.data;
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
        acceptFirstMouse: true,
        icon: icon,
        webPreferences: {
            nodeIntergation: true,
            preload: gamePreload,
            enableRemoteModule: true,
            contextIsolation: false
        },
    });
    win.removeMenu();
    createShortcutKeys();

    win.loadURL('https://kirka.io/');

    win.on('close', function(e) {
        if (CtrlW) {
            e.preventDefault();
            CtrlW = false;
            return;
        }
        app.exit();
    });

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
        if (config.get('chatType', 'Show') !== 'Show')
            win.webContents.send('chat', false, true);
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

function showChangeLogs() {
    return;
    // eslint-disable-next-line no-unreachable
    const changeLogsWin = new BrowserWindow({
        width: 500,
        height: 1200,
        center: true,
        resizable: false,
        frame: false,
        show: true,
        icon: icon,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    // WIP
}

function createShortcutKeys() {
    const contents = win.webContents;

    electronLocalshortcut.register(win, 'Escape', () => contents.executeJavaScript('document.exitPointerLock()', true));
    electronLocalshortcut.register(win, 'F4', () => clipboard.writeText(contents.getURL()));
    electronLocalshortcut.register(win, 'F5', () => contents.reload());
    electronLocalshortcut.register(win, 'Shift+F5', () => contents.reloadIgnoringCache());
    electronLocalshortcut.register(win, 'F6', () => checkkirka());
    electronLocalshortcut.register(win, 'F11', () => win.setSimpleFullScreen(!win.isSimpleFullScreen()));
    electronLocalshortcut.register(win, 'Enter', () => chatShowHide());
    if (config.get('controlW', true))
        electronLocalshortcut.register(win, 'Control+W', () => { CtrlW = true; });
}

let chatState = false;

function chatShowHide() {
    const chatType = config.get('chatType', 'Show');
    return;
    // eslint-disable-next-line no-unreachable
    switch (chatType) {
    case 'Show':
        break;
    case 'Hide':
        win.webContents.send('chat', false, false);
        break;
    case 'On-Focus':
        break;
        win.webContents.send('chat', chatState, false);
        if (chatState)
            chatState = false;
        else
            chatState = true;

    }
}

function checkkirka() {
    const urld = clipboard.readText();
    if (urld.includes('https://kirka.io/games/'))
        win.loadURL(urld);
}

app.allowRendererProcessReuse = true;

let icon;

if (process.platform === 'linux')
    icon = path.join(__dirname, 'media', 'icon.png');
else
    icon = path.join(__dirname, 'media', 'icon.ico');

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
            errTries = errTries + 1;
            if (errTries >= 20) {
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
