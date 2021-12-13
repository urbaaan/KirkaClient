const { startTwitch, closeTwitch } = require('./twitchIntegration');
const { autoUpdate } = require('./autoUpdate');
const { checkBadge, initBadges, sendBadges } = require('./badges');
const { initRPC, sendMatches, closeRPC } = require('./discordRPC');

module.exports = {
    startTwitch,
    autoUpdate,
    checkBadge,
    initBadges,
    sendMatches,
    sendBadges,
    initRPC,
    closeTwitch,
    closeRPC
};
