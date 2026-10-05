// Applies the bot's identity at startup: avatar-based branding, presence, optional profile sync.
const fs = require('fs');
const { ActivityType } = require('discord.js');
const cfg = require('../config');
const log = require('../utils/logger');

function applyPresence(client) {
  client.user.setPresence({
    status: 'online',
    activities: [{ name: cfg.presence, type: ActivityType.Playing }],
  });
}

// One-time sync of avatar / username / "About Me". Discord rate-limits these,
// so it only runs when SYNC_PROFILE=true.
async function syncProfile(client) {
  try {
    if (client.user.username !== cfg.botName) await client.user.setUsername(cfg.botName);
    if (fs.existsSync(cfg.logoPath)) await client.user.setAvatar(fs.readFileSync(cfg.logoPath));
    await client.application.edit({ description: cfg.bio });
    log.info('Profile synced (name, avatar, About Me). Set SYNC_PROFILE=false now.');
  } catch (e) {
    log.warn('Profile sync failed (likely rate limit):', e.message);
  }
}

async function applyIdentity(client) {
  if (cfg.syncProfile) await syncProfile(client);
  // Footer/thumbnail icon = the bot's current avatar (the Falcon logo)
  cfg.logoUrl = client.user.displayAvatarURL({ extension: 'png', size: 256 });
  applyPresence(client);
  log.info(`Identity applied: "${cfg.botName}" | status: ${cfg.presence}`);
}

module.exports = { applyIdentity };
