const { Events } = require('discord.js');
const log = require('../utils/logger');
const identity = require('../services/identity');
const scheduler = require('../services/scheduler');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    log.banner();
    log.info(`Logged in as ${client.user.tag}`);
    await identity.applyIdentity(client); // must run before the first embed is sent
    scheduler.start(client);
  },
};
