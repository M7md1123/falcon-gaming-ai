const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchAll } = require('../services/news');
const { toArabic } = require('../services/translate');
const log = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('g-news')
    .setDescription('عرض آخر أخبار الألعاب وعروض الألعاب المجانية مترجمة للعربية')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('اختر القسم')
        .setRequired(false)
        .addChoices(
          { name: 'الكل (أخبار وعروض)', value: 'all' },
          { name: 'الأخبار فقط', value: 'news' },
          { name: 'العروض المجانية فقط', value: 'free' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const category = interaction.options.getString('category') || 'all';
      const items = await fetchAll(category);

      if (!items || items.length === 0) {
        return interaction.editReply('❌ عذراً، لم يتم العثور على أخبار حالياً.');
      }

      // Take top 3 items to avoid Discord limits
      const topItems = items.slice(0, 3);
      const embeds = [];

      for (const item of topItems) {
        // Translate item content
        const translated = await toArabic(item);

        const embed = new EmbedBuilder()
          .setTitle(translated.title || item.title)
          .setURL(item.link)
          .setDescription(translated.summary || item.summary || 'لا يوجد ملخص.')
          .setColor('#00ffcc')
          .setFooter({ text: `${item.source} • AL0 Lab` })
          .setTimestamp(new Date(item.date));

        if (item.image) {
          embed.setImage(item.image);
        }

        embeds.push(embed);
      }

      await interaction.editReply({ embeds });
    } catch (error) {
      log.error('Error executing g-news command:', error);
      await interaction.editReply('❌ حدث خطأ أثناء جلب الأخبار. يجدر المحاولة لاحقاً.');
    }
  },
};