// All embeds go through brandedEmbed() so the footer + timestamp are never missing.
const { EmbedBuilder } = require('discord.js');
const cfg = require('../config');

const TAGS = {
  hype: { label: '🔥 حماس عالٍ', meter: '🔥🔥🔥', color: 0xff4500 },
  release: { label: '🎮 إصدار جديد', meter: '🔥🔥', color: 0x2ecc71 },
  free: { label: '🎁 عرض مجاني', meter: '🔥🔥', color: 0x9b59b6 },
  rumor: { label: '⚠️ إشاعة', meter: '🔥', color: 0xf1c40f },
  news: { label: '📰 خبر', meter: '🔥', color: 0x3498db },
};

function brandedEmbed(color = 0x1abc9c) {
  const e = new EmbedBuilder()
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: cfg.footer, iconURL: cfg.logoUrl });
  if (cfg.logoUrl) e.setThumbnail(cfg.logoUrl); // Falcon avatar on every embed
  return e;
}

function buildNewsEmbed(item) {
  const t = TAGS[item.tag] || TAGS.news;
  const e = brandedEmbed(t.color)
    .setAuthor({ name: `${item.source} • ${cfg.botName}`, iconURL: cfg.logoUrl }) // bot avatar
    .setTitle(item.title.slice(0, 256))
    .setURL(item.link)
    .setDescription((item.summary || '').slice(0, 1000) || 'اضغط على العنوان لقراءة التفاصيل.')
    .addFields(
      { name: 'التصنيف', value: t.label, inline: true },
      { name: 'مستوى الحماس', value: t.meter, inline: true },
      { name: 'المصدر', value: `[${item.source}](${item.link})`, inline: true }
    );
  if (item.ends) {
    e.addFields({ name: 'ينتهي العرض', value: `<t:${Math.floor(item.ends / 1000)}:R>`, inline: true });
  }
  if (item.image) e.setImage(item.image);
  return e;
}

module.exports = { brandedEmbed, buildNewsEmbed };
