/* eslint-disable no-unused-vars */
const { ipcRenderer, remote } = require('electron');
const Store = require('electron-store');
const config = new Store();
const fixwebm = require('../recorder/fix');
const os = require('os');
const path = require('path');
const fs = require('fs');
const getBlobDuration = require('get-blob-duration');
const autoJoin = require('../features/autoJoin');

let leftIcons;
let pingFPSdiv = null;
let mediaRecorder = null;
let filepath = '';
let starttime;
let pausetime;
let pause;
let totalPause = 0;
let recordedChunks = [];
let recording = false;
let paused = false;
let badgesData;
let chatFocus = false;
const chatState = true;
const chatForce = true;
const logDir = path.join(os.homedir(), '/Documents/KirkaClient');

if (!fs.existsSync(logDir)) fs.promises.mkdir(logDir, { recursive: true });

let oldState;
window.addEventListener('DOMContentLoaded', (event) => {
    setInterval(() => {
        const newState = currentState();
        if (oldState != newState) {
            oldState = newState;
            doOnLoad();
        }
    }, 1000);
});

function doOnLoad() {
    resetVars();
    const html = `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="${config.get('css')}">
    <style>

    #show-clientNotif{
        position: absolute;
        transform: translate(-50%,-50%);
        top: 50%;
        left: 50%;
        background-color: #101020;
        color: #ffffff;
        padding: 20px;
        border-radius: 5px;
        cursor: pointer;
    }
    #clientNotif{
        width: 380px;
        height: 80px;
        padding-left: 20px;
        background-color: #ffffff;
        box-shadow: 0 10px 20px rgba(75, 50, 50, 0.05);
        border-left: 8px solid #47d764;
        border-radius: 7px;
        display: grid;
        grid-template-columns: 1.2fr 6fr 0.5fr;
        transform: translate(-400px);
        transition: 1s;
    }
    .container-1,.container-2{
        align-self: center;
    }
    .container-1 i{
        font-size: 40px;
        color: #47d764;
    }
    .container-2 {
        text-shadow: 0px 0px #000000;
        font-size: 18px;
        border: none;
        text-align: left;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
    }
    .container-2 p:first-child{
        color: #101020;
    }
    .container-2 p:last-child{
        color: #656565;
    }
    #clientNotif button{
        align-self: flex-start;
        background-color: transparent;
        font-size: 25px;
        line-height: 0;
        color: #656565;
        cursor: pointer;
    }
    </style>
    <div class="wrapper" style="width: 420px;
    padding: 30px 20px;
    position: absolute;
    bottom: 50px;
    left: 0;
    overflow: hidden;">
    <div id="clientNotif">
        <div class="container-1">
        </div>
        <div class="container-2">
        </div>
    </div>
    </div>`;
    const state = currentState();
    console.log('DOM Content loaded for:', state);
    let promo;
    const div = document.createElement('div');
    div.className = 'clientNotifDIV';
    div.innerHTML = html;

    function setPromo() {
        promo = document.getElementsByClassName('info')[0];
        if (promo === undefined) {
            setTimeout(setPromo, 1000);
            return;
        }
        promo.appendChild(div);

        const kirkaChat = document.getElementById('WMNn');
        kirkaChat.addEventListener('focusout', (event) => {
            chatFocus = false;
            // setChatState(chatState, chatForce);
        });

        kirkaChat.addEventListener('focusin', (event) => {
            chatFocus = true;
            // setChatState(chatState, chatForce);
        });
    }

    let settings = document.getElementById('clientSettings');
    switch (state) {
    case 'home':
        promo = document.getElementsByClassName('left-interface')[0];
        promo.appendChild(div);
        if (settings === null || settings === undefined) {
            let canvas = document.getElementsByClassName('left-icons')[0];
            canvas = canvas.children[0];
            if (canvas === undefined) return;
            canvas.insertAdjacentHTML('beforeend', '<div data-v-4f66c13e="" data-v-6be9607e="" id="clientSettings" class="icon-btn text-1" style="--i:3;"><div data-v-4f66c13e="" class="wrapper"><img data-v-b8de1e14="" data-v-4f66c13e="" src="https://media.discordapp.net/attachments/868890525871247450/875360498701447248/Pngtreelaptop_setting_gear_icon_vector_3664021.png" width="100%" height="auto"><div data-v-4f66c13e="" class="text-icon">CLIENT</div></div></div>');
            settings = document.getElementById('clientSettings');
            settings.onclick = () => {
                ipcRenderer.send('show-settings');
            };
        }

        break;
    case 'game':
        setPromo();
        break;
    }


    if (state != 'game') return;
    if (config.get('showPingFPS', true)) refreshLoop();

    setInterval(() => {
        const ele = document.querySelector('#app > div.interface.text-2 > div.team-section > div.player > div > div.head-right > div.nickname');
        if (ele === null) return;
        config.set('user', ele.innerText);
    }, 3500);

    const url = config.get('customScope', '');
    if (url != '') {
        setInterval(function() {
            const x = document.getElementsByClassName('sniper-mwNMW')[0];
            if (x) {
                if (x.src != url) {
                    x.src = url;
                    x.width = config.get('scopeSize', 200);
                    x.height = config.get('scopeSize', 200);
                    x.removeAttribute('class');
                }
            }
        }, 1000);
    }
}

function resetVars() {
    pingFPSdiv = null;
}

ipcRenderer.on('chat', (event, state, force) => {
    setChatState(state, force);
});

function setChatState(state, force) {
    const chat = document.getElementsByClassName('chat chat-position')[0];
    if (chat === undefined) {
        if (force) setTimeout(() => { setChatState(state, force); }, 1000);
        return;
    }
    if (state)
        chat.style = 'display: flex;';
    else
        chat.style = 'display: none;';
}

function showNotification() {
    let x = document.getElementById('clientNotif');
    clearTimeout(x);
    const toast = document.getElementById('clientNotif');
    toast.style.transform = 'translateX(0)';
    x = setTimeout(() => {
        toast.style.transform = 'translateX(-400px)';
    }, 3000);
}

function createBalloon(text, error = false) {
    let border = '';
    let style = '';
    if (error) {
        border = '<i class="fas fa-times-circle" style="color: #ff355b;"></i>';
        style = 'border-left: 8px solid #ff355b;';
    } else {
        border = '<i class="fas fa-check-square"></i>';
        style = 'border-left: 8px solid #47D764;';
    }

    const d1 = document.getElementsByClassName('container-1')[0];
    d1.innerHTML = border;
    const toast = document.getElementById('clientNotif');
    toast.style = style;
    const d2 = document.getElementsByClassName('container-2')[0];
    d2.innerHTML = `<p>${text}</p>`;
    showNotification();
}

window.addEventListener('keydown', function(event) {
    const autoJoinKey = config.get('AJ_keybind', 'F7');
    switch (event.key) {
    case 'F1':
        startRecording();
        break;
    case 'F2':
        stopRecording(true);
        break;
    case 'F3':
        stopRecording(false);
        break;
    case autoJoinKey:
        autoJoin.launch().then(res => {
            if (!res.success || res.found == 0) {
                createBalloon('No Match Found!', true);
                return;
            }

            const url = `https://kirka.io/games/${res.code}`;
            setTimeout(() => {
                console.log('Loading', url);
                window.location.replace(url);
            }, 0);
        });
        break;
    }
});

const times = [];
let fps = 0;

function refreshLoop() {
    updatePingFPS(fps);

    window.requestAnimationFrame(() => {
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000)
            times.shift();

        times.push(now);
        fps = times.length;

        refreshLoop();
    });
}

function updatePingFPS(_fps) {
    leftIcons = document.querySelector('.state-cont');
    if (leftIcons === null) return;
    if (pingFPSdiv === null) {
        pingFPSdiv = document.createElement('div');
        leftIcons.appendChild(pingFPSdiv);
    }
    if (!config.get('showPingFPS', true))
        pingFPSdiv.innerText = '';
    else
        pingFPSdiv.innerText = `FPS: ${_fps}`;
}

window.addEventListener('mouseup', (e) => {
    if (e.button === 3 || e.button === 4)
        e.preventDefault();
});

window.addEventListener('load', () => {
    setInterval(() => {
        const allpossible = [];
        const all_nickname = document.getElementsByClassName('nickname');
        allpossible.push(...all_nickname);

        for (const key in allpossible) {
            const nickname = allpossible[key];
            if (nickname.innerText === undefined) continue;
            let user = nickname.innerText.toString();
            if (user.slice(-1) === ' ')
                user = user.slice(0, -1);

            const badges = checkbadge(user);
            if (badges[0].start)
                nickname.innerText = user + ' ';


            for (const badge_ in badges) {
                const badge = badges[badge_];
                if (badge == undefined) return;
                if (badge.start)
                    nickname.insertAdjacentHTML('beforeend', `<img src="${badge.url}" class="KirkaHomeBadge" width="25px" height=auto title=${badge.role}>`);
            }
        }
    }, 750);
});

async function configMR() {
    const clientWindow = remote.getCurrentWindow().getMediaSourceId();
    const constraints = {
        audio: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: clientWindow,
            }
        },
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: clientWindow,
                minWidth: 1280,
                maxWidth: 1920,
                minHeight: 720,
                maxHeight: 1080,
                minFrameRate: 60
            }
        }
    };
    const options = {
        videoBitsPerSecond: 3000000,
        mimeType: 'video/webm; codecs=vp9'
    };
    let mediaRecorder;
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream, options);
                console.log('mR', mediaRecorder);
                mediaRecorder.ondataavailable = handleDataAvailable;
                mediaRecorder.onstop = handleStop;
                mediaRecorder.onstart = () => {
                    console.log('started recording');
                    recording = true;
                };
                mediaRecorder.onpause = () => { paused = true; };
                mediaRecorder.onresume = () => { paused = false; };
                resolve(mediaRecorder);
            })
            .catch(err => {
                console.error('getUserMedia failed with error: ', err);
                reject(err);
            });
    });
}

function handleDataAvailable(e) {
    recordedChunks.push(e.data);
}

async function handleStop(e) {
    recording = false;
    if (starttime === undefined) return;
    const blob = new Blob(recordedChunks, {
        type: 'video/mp4;'
    });
    console.log('handeling stop. starttime:', starttime, 'Date.now():', Date.now(), 'pause:', totalPause, 'duration', Date.now() - starttime - totalPause);
    fixwebm(blob, Date.now() - starttime - totalPause, saveRecording);
}

function startRecording() {
    if (mediaRecorder === null) {
        console.log('First Time: Configuring mR');
        configMR()
            .then((rs) => {
                console.log('Configurated!', rs);
                mediaRecorder = rs;
                startrec();
            })
            .catch((err) => {
                console.error(err);
            });
    } else if (recording) {
        if (paused)
            resumeRecording();
        else
            pauseRecording();
    } else
        startrec();
}

function pauseRecording() {
    console.log('mR is paused!');
    pausetime = Date.now() - starttime - totalPause;
    try {
        mediaRecorder.pause();
        createBalloon('Recording Paused!');
    } catch (e) {
        console.error(e);
    }
    pause = Date.now();
}

function resumeRecording() {
    console.log('mR is resumed!');
    try {
        mediaRecorder.resume();
        createBalloon('Recording Resumed!');
    } catch (e) {
        console.error(e);
    }
    totalPause += Date.now() - pause;
}

let shouldSave = false;

function stopRecording(save) {
    if (!recording) {
        createBalloon('No recording in progress!', true);
        return;
    }
    if (mediaRecorder === undefined || mediaRecorder === null) return;
    if (save) {
        const folderPath = path.join(logDir, 'videos');
        console.log(folderPath);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
        filepath = path.join(folderPath, `kirka-${Date.now()}.mp4`);
    }
    shouldSave = save;
    try {
        if (paused)
            mediaRecorder.resume();

        mediaRecorder.stop();
    } catch (e) {
        console.error(e);
    }
}

async function startrec() {
    console.log('mR state:', mediaRecorder.state);
    recordedChunks = [];
    try {
        mediaRecorder.start(500);
    } catch (e) {
        console.error(e);
    }
    createBalloon('Recording started!');
    starttime = Date.now();
    pause = 0;
    totalPause = 0;
    console.log('New mR state:', mediaRecorder.state);
}

function saveRecording(blob) {
    console.log('In saveRecording');
    getBlobDuration.default(blob).then(function(duration) {
        console.log(duration + ' seconds');
        if (isNaN(parseFloat(duration))) {
            console.error('Broken duration detected, attempting fix...');
            fixwebm(blob, 300000, saveRecording);
        } else {
            blob.arrayBuffer().then(buf => {
                const buffer = Buffer.from(buf);
                console.log('Filepath:', filepath);
                if (filepath !== '') fs.writeFileSync(filepath, buffer);
                if (shouldSave) createBalloon('Recording Saved!');
                else createBalloon('Recording Cancelled', true);
                console.log('Saved!');
            });
        }
    });
}

function genChatMsg(text) {
    console.log(text);
    const chatHolder = document.getElementsByClassName('messages messages-cont')[0];
    if (chatHolder === undefined) return;

    const chatItem = document.createElement('div');
    const chatUser = document.createElement('span');
    const chatMsg = document.createElement('span');

    chatItem.className = 'message';
    chatMsg.className = 'chatMsg_client';
    chatMsg.innerText = text;
    chatUser.className = 'name';
    chatUser.innerText = '[KirkaClient]';

    chatItem.appendChild(chatUser);
    chatItem.appendChild(chatMsg);
    chatHolder.appendChild(chatItem);

    console.log('generated message');
    return chatMsg;
}

function currentState() {
    const gameUrl = window.location.href;
    if (gameUrl.includes('games'))
        return 'game';
    else
        return 'home';
}

ipcRenderer.on('badges', (event, data) => {
    badgesData = data;
});

function checkbadge(user) {
    if (badgesData === undefined)
        return [{ start: false }];

    const tosend = [];
    if (badgesData.dev.includes(user)) {
        const data = { start: true, type: 'dev', url: 'https://media.discordapp.net/attachments/863805591008706607/874611064606699560/contributor.png', name: user, role: 'Developer' };
        tosend.push(data);
    }
    if (badgesData.staff.includes(user)) {
        const data = { start: true, type: 'staff', url: 'https://media.discordapp.net/attachments/863805591008706607/874611070478745600/staff.png', name: user, role: 'Staff Team' };
        tosend.push(data);
    }
    if (badgesData.patreon.includes(user)) {
        const data = { start: true, type: 'patreon', url: 'https://media.discordapp.net/attachments/856723935357173780/874673648143855646/patreon.PNG', name: user, role: 'Patreon Supporter' };
        tosend.push(data);
    }
    if (badgesData.gfx.includes(user)) {
        const data = { start: true, type: 'gfx', url: 'https://media.discordapp.net/attachments/863805591008706607/874611068570333234/gfx.PNG', name: user, role: 'GFX Artist' };
        tosend.push(data);
    }
    if (badgesData.con.includes(user)) {
        const data = { start: true, type: 'contributor', url: 'https://media.discordapp.net/attachments/863805591008706607/874611066909380618/dev.png', name: user, role: 'Contributor' };
        tosend.push(data);
    }
    if (badgesData.kdev.includes(user)) {
        const data = { start: true, type: 'kdev', url: 'https://media.discordapp.net/attachments/874979720683470859/888703118118907924/kirkadev.PNG', name: user, role: 'Kirka Developer' };
        tosend.push(data);
    }
    if (badgesData.vip.includes(user)) {
        const data = { start: true, type: 'vip', url: 'https://media.discordapp.net/attachments/874979720683470859/888703150628941834/vip.PNG', name: user, role: 'VIP' };
        tosend.push(data);
    }

    const customBadges = badgesData.custom;
    for (let i = 0; i < customBadges.length; i++) {
        const badgeData = customBadges[i];
        if (badgeData.name === user) {
            const data = { start: true, type: badgeData.type, url: badgeData.url, name: user, role: badgeData.role };
            tosend.push(data);
        }
    }

    if (tosend.length == 0)
        tosend.push({ start: false });

    return tosend;
}
