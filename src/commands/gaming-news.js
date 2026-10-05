// One command, three names: /g-news, /gaming-news and /عروض-الألعاب
// (Discord has no Arabic locale for localizations, so both are registered.)
const { SlashCommandBuilder } = require('discord.js');
const { fetchAll } = require('../services/news');
const { toArabic } = require('../services/translate');
const { buildNewsEmbed, brandedEmbed } = require('../services/embed');

const build = (name) =>
  new SlashCommandBuilder()
    .setName(name)
    .setDescription('أحدث أخبار وعروض الألعاب بالعربية')
    .addStringOption((o) =>
      o
        .setName('category')
        .setDescription('نوع المحتوى')
        .addChoices(
          { name: 'الكل', value: 'all' },
          { name: 'أخبار', value: 'news' },
          { name: 'ألعاب مجانية', value: 'free' }
        )
    )
    .addIntegerOption((o) =>
      o.setName('count').setDescription('عدد الأخبار (1-5)').setMinValue(1).setMaxValue(5)
    );

module.exports = {
  builders: ['g-news', 'gaming-news', 'عروض-الألعاب'].map(build),
  async execute(interaction) {
    await interaction.deferReply();
    const category = interaction.options.getString('category') || 'all';
    const count = interaction.options.getInteger('count') || 3;

    const items = (await fetchAll(category)).slice(0, count);
    if (!items.length) {
      return interaction.editReply({
        embeds: [brandedEmbed(0xe74c3c).setTitle('لا توجد نتائج').setDescription('تعذّر جلب الأخبار حالياً، حاول لاحقاً.')],
      });
    }
    const translated = await Promise.all(items.map(toArabic));
    await interaction.editReply({ embeds: translated.map(buildNewsEmbed) });
  },
};
