const { startTwitch } = require('./twitchIntegration');
const { autoUpdate } = require('./autoUpdate');
const { badge_checker, initBadges, sendBadges } = require('./badges');
const { InitRPC, sendMatches } = require('./discordRPC');

module.exports = { startTwitch, autoUpdate, badge_checker, initBadges, sendMatches, sendBadges, InitRPC };
