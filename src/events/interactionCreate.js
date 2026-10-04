const { Events, MessageFlags } = require('discord.js');
const log = require('../utils/logger');
const { brandedEmbed } = require('../services/embed');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (e) {
      log.error(`Command ${interaction.commandName} failed:`, e);
      const payload = {
        embeds: [brandedEmbed(0xe74c3c).setTitle('حدث خطأ').setDescription('تعذّر تنفيذ الأمر، حاول مرة أخرى.')],
      };
      if (interaction.deferred || interaction.replied) await interaction.editReply(payload).catch(() => {});
      else await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  },
};
