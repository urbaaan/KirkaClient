const { startTwitch, closeTwitch } = require('./twitchIntegration');
const { autoUpdate } = require('./autoUpdate');
const { checkBadge, initBadges, sendBadges } = require('./badges');
const { initRPC, updateRPC, closeRPC } = require('./discordRPC');

module.exports = {
    startTwitch,
    autoUpdate,
    checkBadge,
    initBadges,
    updateRPC,
    sendBadges,
    initRPC,
    closeTwitch,
    closeRPC
};
