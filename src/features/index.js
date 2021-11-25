const { startTwitch, closeTwitch } = require('./twitchIntegration');
const { autoUpdate } = require('./autoUpdate');
const { badge_checker, initBadges, sendBadges } = require('./badges');
const { initRPC, sendMatches, closeRPC } = require('./discordRPC');

module.exports = {
    startTwitch,
    autoUpdate,
    badge_checker,
    initBadges,
    sendMatches,
    sendBadges,
    initRPC,
    closeTwitch,
    closeRPC
};
