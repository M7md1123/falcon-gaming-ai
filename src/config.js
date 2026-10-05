require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  newsChannelId: process.env.NEWS_CHANNEL_ID,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  cron: process.env.CRON_SCHEDULE || '*/30 * * * *',
  maxPerRun: Number(process.env.MAX_POSTS_PER_RUN || 3),
  dataDir: process.env.DATA_DIR || './data',
  logoUrl: process.env.LOGO_URL || undefined, // overwritten at startup with the bot's avatar
  botName: 'Falcon Gaming AI',
  // Presence shown as "Playing ..." under the bot's name
  presence: 'أخبار الألعاب الحصرية | تطوير محمد الخثعمي',
  // "About Me" (max 400 chars)
  bio:
    'بوت أخبار ألعاب آلي بالكامل، يوافيك على مدار الساعة بأحدث الأخبار العالمية وإصدارات الألعاب والعروض والألعاب المجانية بصياغة عربية فصحى احترافية، مع تصنيف مستوى الحماس لكل خبر. 🎮 اكتب /g-news لتصلك آخر المستجدات.\n\nتم التطوير بواسطة محمد الخثعمي | AL0 Lab',
  logoPath: require('path').join(__dirname, '..', 'assets', 'logo.png'),
  

  translate: process.env.TRANSLATE_NEWS !== 'false', 
  
  syncProfile: process.env.SYNC_PROFILE === 'true',
  brand: 'Developed by Mohammed Al-Khathami | AL0 Lab', // console logs
  footer: 'تم التطوير بواسطة محمد الخثعمي | AL0 Lab', // every Discord embed
  // Add or remove RSS feeds freely
  feeds: [
    { name: 'IGN', url: 'https://feeds.feedburner.com/ign/games-all' },
    { name: 'GameSpot', url: 'https://www.gamespot.com/feeds/news/' },
    { name: 'PC Gamer', url: 'https://www.pcgamer.com/rss/' },
  ],
};
