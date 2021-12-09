const { gameLoaded, version } = require('./const');
const DiscordRPC = require('discord-rpc');
const ClientID = '871730144836976650';
const starttime = Date.now();
const { badge_checker } = require('./badges');
const Store = require('electron-store');
const config = new Store();

let userBadges = { type: 'anything', role: 'KirkaClient User' };
let matches;
let discordOpen = false;

DiscordRPC.register(ClientID);
const client = new DiscordRPC.Client({ transport: 'ipc' });
client.login({ clientId: ClientID }).catch((error) => {
    console.log(error);
});


client.on('ready', () => {
    console.log(`RPC Ready! Username: ${client.user.username}#${client.user.discriminator}`);
    discordOpen = true;
});

function initRPC(socket, webContents) {
    if (config.get('discordRPC', true)) {
        setInterval(() => {
            if (!discordOpen) return;

            socket.send({ type: 3 });
            let user = config.get('user', '').toString();

            if (user.slice(-1) === ' ') user = user.slice(0, -1);
            if (user !== '') {
                userBadges = badge_checker(user);
                userBadges = userBadges[0];
                const gameURL = webContents.getURL();
                if (!gameLoaded(gameURL))
                    notPlaying();
                else
                    updateRPC(gameURL);
            }
        }, 2500);
    }
}

function notPlaying() {
    client.setActivity({
        state: 'Home Page',
        smallImageKey: userBadges.type,
        smallImageText: userBadges.role,
        largeImageKey: 'client_logo',
        largeImageText: `KirkaClient ${version}`,
        instance: true,
        startTimestamp: starttime,
        buttons: [
            { label: 'Get KirkaClient', url: 'https://discord.gg/bD9JNv6GFS' }
        ]
    });
}

function sendMatches(data) {
    matches = data;
}

async function updateRPC(gameurl) {
    let final_data;

    const gamecode = gameurl.replace('https://kirka.io/games/', '');
    const data = await getMatches(gamecode);
    let category;
    if (data.mode == 'Editor') {
        final_data = {
            mode: 'Editing a map'
        };
        category = 'map';
    } else {
        final_data = {
            'mode': data.mode,
            'map': data.map_name,
            'cap': data.cap,
            'code': gamecode
        };
        category = 'game';
    }
    updateClient(final_data, category);
}

async function getMatches(gamecode) {
    let finaldata = null;
    ['ffa', 'tdm', 'knife only', 'parkour'].forEach((mode) => {
        const modeData = matches[mode];
        for (const key in modeData) {
            const value = modeData[key];
            const roomId = value.roomId;
            if (roomId == gamecode) {
                finaldata = {
                    map_name: value.metadata.mapName,
                    cap: `${value.clients}/${value.maxClients}`,
                    mode: mode.toUpperCase()
                };
                break;
            }
        }
    });

    return finaldata || { mode: 'Editor' };
}

function updateClient(data, type) {
    if (data === undefined) return;
    const updateData = {
        smallImageKey: userBadges.type,
        smallImageText: userBadges.role,
        largeImageKey: 'client_logo',
        largeImageText: `KirkaClient ${version}`,
        instance: true,
        startTimestamp: starttime,
    };
    switch (type) {
    case 'game':
        updateData['buttons'] = [
            { label: 'Join Game', url: `https://kirka.io/games/${data.code}` },
            { label: 'Get KirkaClient', url: 'https://discord.gg/bD9JNv6GFS' }
        ];
        updateData['details'] = `Playing ${data.mode}`;
        updateData['state'] = `${data.map} (${data.cap})`;
        break;
    case 'map':
        updateData['buttons'] = [
            { label: 'Get KirkaClient', url: 'https://discord.gg/bD9JNv6GFS' }
        ];
        updateData['details'] = 'Editing a map';
        break;
    }
    client.setActivity(updateData);
}

function closeRPC() {
    if (discordOpen)
        client.clearActivity();
}

module.exports.initRPC = initRPC;
module.exports.closeRPC = closeRPC;
module.exports.sendMatches = sendMatches;
