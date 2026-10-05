const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const cfg = require('./src/config');
const log = require('./src/utils/logger');

if (!cfg.token || !cfg.newsChannelId) {
  log.error('Missing DISCORD_TOKEN or NEWS_CHANNEL_ID in environment.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load commands (each file may expose several builders / names)
const cmdDir = path.join(__dirname, 'src/commands');
for (const f of fs.readdirSync(cmdDir).filter((f) => f.endsWith('.js'))) {
  const mod = require(path.join(cmdDir, f));
  for (const b of mod.builders) client.commands.set(b.name, mod);
}

// Load events
const evDir = path.join(__dirname, 'src/events');
for (const f of fs.readdirSync(evDir).filter((f) => f.endsWith('.js'))) {
  const ev = require(path.join(evDir, f));
  client[ev.once ? 'once' : 'on'](ev.name, (...args) => ev.execute(...args, client));
}

// Tiny health endpoint so web-type hosts (Render free, Railway) keep the service alive
http
  .createServer((_, res) => res.end(`${cfg.botName} is running | ${cfg.brand}`))
  .listen(process.env.PORT || 3000);

process.on('unhandledRejection', (e) => log.error('Unhandled rejection:', e));
client.login(cfg.token);
