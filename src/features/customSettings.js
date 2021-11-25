const Store = require('electron-store');
const config = new Store();

module.exports = [
    {
        name: 'Mute Startup Video',
        id: 'muteVideo',
        category: 'Startup',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('muteVideo', false),
    },
    {
        name: 'Start as Fullscreen',
        id: 'fullScreenStart',
        category: 'Startup',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('fullScreenStart', true),
    },
    {
        name: 'Unlimited FPS',
        id: 'disableFrameRateLimit',
        category: 'Performance',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('disableFrameRateLimit', false),
    },
    {
        name: 'Discord Rich Presence',
        id: 'discordRPC',
        category: 'Performance',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('discordRPC', true),
    },
    {
        name: 'Client Badges',
        id: 'clientBadges',
        category: 'Performance',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('clientBadges', true),
    },
    {
        name: 'Show Ping & FPS',
        id: 'showPingFPS',
        category: 'Game',
        type: 'checkbox',
        needsRestart: false,
        val: config.get('showPingFPS', true),
    },
    {
        name: 'In-game Chat Mode',
        id: 'chatType',
        category: 'Game',
        type: 'list',
        values: ['Show', 'Hide'],
        needsRestart: true,
        val: config.get('chatType', 'Show'),
    },
    {
        name: 'Custom Sniper Scope',
        id: 'customScope',
        category: 'Game',
        type: 'input',
        needsRestart: false,
        val: config.get('customScope', ''),
        placeholder: 'Scope url'
    },
    {
        name: 'Scope Size',
        id: 'scopeSize',
        category: 'Game',
        type: 'slider',
        needsRestart: false,
        min: 10,
        max: 1000,
        val: config.get('scopeSize', 400)
    },
    {
        name: 'Twitch Integration',
        id: 'twitchInt',
        category: 'Twitch',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('twitchInt', false),
    },
    {
        name: 'Bot Username',
        id: 'botUsername',
        category: 'Twitch',
        type: 'input',
        needsRestart: true,
        placeholder: 'Twitch Bot Username',
        val: config.get('botUsername', '')
    },
    {
        name: 'Bot OAuth',
        id: 'botOAuth',
        category: 'Twitch',
        type: 'input',
        password: true,
        needsRestart: true,
        placeholder: 'Twitch Bot OAuth Token',
        val: config.get('botOAuth', '')
    },
    {
        name: 'Twitch Channel',
        id: 'twitchChannel',
        category: 'Twitch',
        type: 'input',
        needsRestart: true,
        placeholder: 'Your Twitch channel name.',
        val: config.get('twitchChannel', '')
    },
    {
        name: 'Link Command',
        id: 'linkCommand',
        category: 'Twitch',
        type: 'input',
        placeholder: 'Command to get the link of your game',
        needsRestart: false,
        val: config.get('linkCommand', '!link')
    },
    {
        name: 'Link Message',
        id: 'linkMessage',
        category: 'Twitch',
        type: 'input',
        placeholder: '{link} = Gamelink. Client will auto-replace that.',
        needsRestart: false,
        val: config.get('linkMessage', 'Join here: {link}')
    },
    {
        name: 'Updates Behaviour',
        id: 'updateType',
        category: 'Updates',
        type: 'list',
        values: ['Ask for download', 'Auto download'],
        needsRestart: false,
        val: config.get('updateType', 'Auto download')
    },
    {
        name: 'Receive Beta Updates',
        id: 'betaTester',
        category: 'Updates',
        type: 'checkbox',
        needsRestart: true,
        val: config.get('betaTester', false)
    }
];
