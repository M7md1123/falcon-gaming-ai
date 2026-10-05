// Background auto-posting via cron, with duplicate prevention.
const cron = require('node-cron');
const cfg = require('../config');
const log = require('../utils/logger');
const store = require('../utils/store');
const { fetchAll } = require('./news');
const { toArabic } = require('./translate');
const { buildNewsEmbed } = require('./embed');

let running = false;

async function runCycle(client) {
  if (running) return;
  running = true;
  try {
    const channel = await client.channels.fetch(cfg.newsChannelId).catch(() => null);
    if (!channel?.isTextBased()) return log.error('NEWS_CHANNEL_ID is invalid or inaccessible.');

    const items = await fetchAll('all');
    // newest N unseen items, posted oldest -> newest
    const fresh = items.filter((i) => !store.has(i.id)).slice(0, cfg.maxPerRun).reverse();
    log.info(`Cycle: ${items.length} fetched, ${fresh.length} new.`);

    for (const item of fresh) {
      try {
        const ar = await toArabic(item);
        if (cfg.translate && !ar.arabic && !ar.translated) {
          log.warn(`Skipped (translation failed, will retry next cycle): ${item.title}`);
          continue; // not marked as posted
        }
        await channel.send({ embeds: [buildNewsEmbed(ar)] });
        store.add(item.id);
      } catch (e) {
        log.error(`Failed posting "${item.title}":`, e.message);
      }
    }
  } catch (e) {
    log.error('Cycle failed:', e.message);
  } finally {
    running = false;
  }
}

function start(client) {
  if (!cron.validate(cfg.cron)) return log.error(`Invalid CRON_SCHEDULE: ${cfg.cron}`);
  cron.schedule(cfg.cron, () => runCycle(client));
  log.info(`Scheduler started (${cfg.cron}).`);
  runCycle(client); // first run on boot
}

module.exports = { start, runCycle };
