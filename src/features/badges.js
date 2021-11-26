const Store = require('electron-store');
const config = new Store();

let badgesData;

function initBadges(socket) {
    if (config.get('clientBadges', true)) {
        socket.send({ type: 4 });
        setInterval(() => {
            socket.send({ type: 4 });
        }, 120000);
    }
}

function sendBadges(data) {
    badgesData = data;
}

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

module.exports.badge_checker = checkbadge;
module.exports.sendBadges = sendBadges;
module.exports.initBadges = initBadges;
