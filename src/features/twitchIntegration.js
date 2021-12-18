const Store = require('electron-store');
const config = new Store();

let client;
let webContents;
let twitchRunning = false;

function startTwitch(web) {
    if (config.get('botUsername', null) &&
    config.get('botOAuth', null) &&
    config.get('twitchChannel', null) &&
    config.get('twitchInt', false)
    ) {
        const tmi = require('tmi.js');
        const opts = {
            identity: {
                username: config.get('botUsername'),
                password: config.get('botOAuth')
            },
            channels: [
                config.get('twitchChannel')
            ]
        };
        client = new tmi.client(opts);
        client.on('chat', onMessageHandler);
        client.on('connected', onConnectedHandler);
        webContents = web;
        client.connect().catch((err) => console.log(err));
    } else
        console.log('Twitch Integration not running');
}

function closeTwitch() {
    if (twitchRunning)
        client.disconnect();
}

function onMessageHandler(channel, user, msg) {
    msg = msg.toLowerCase();
    if (config.get('twitchChatSwap', false)) {
        const userName = user['display-name'];
        const userColor = user['color'] || '#ff69b4';
        webContents.send('twitch-msg', userName, userColor, msg);
    }

    const commandName = msg.trim();
    let response;
    if (commandName === config.get('linkCommand', '!link'))
        response = `${config.get('linkMessage', '{link}').replace('{link}', webContents.getURL())}`;
    else if (commandName === '!client')
        response = 'Download KirkaClient here: https://kirkaclient.herokuapp.com/';
    else
        return;

    client.say(channel, response);
}

function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
    twitchRunning = true;
}

module.exports.startTwitch = startTwitch;
module.exports.closeTwitch = closeTwitch;
