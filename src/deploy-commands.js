// Registers slash commands. Runs automatically before the bot starts (npm start).
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const cfg = require('./config');
const log = require('./utils/logger');

(async () => {
  if (!cfg.token || !cfg.clientId) {
    log.error('DISCORD_TOKEN and CLIENT_ID are required.');
    process.exit(1);
  }
  const body = [];
  for (const f of fs.readdirSync(path.join(__dirname, 'commands')).filter((f) => f.endsWith('.js'))) {
    for (const b of require(`./commands/${f}`).builders) body.push(b.toJSON());
  }
  const rest = new REST({ version: '10' }).setToken(cfg.token);
  const route = cfg.guildId
    ? Routes.applicationGuildCommands(cfg.clientId, cfg.guildId)
    : Routes.applicationCommands(cfg.clientId);
  await rest.put(route, { body });
  log.info(`Registered ${body.length} slash commands (${cfg.guildId ? 'guild' : 'global'}).`);
})().catch((e) => {
  log.error('Command registration failed:', e.message);
  process.exit(1);
});
