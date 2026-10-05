// Fetches RSS + Epic deals, classifies each item with a Hype tag.
const Parser = require('rss-parser');
const crypto = require('crypto');
const cfg = require('../config');
const log = require('../utils/logger');
const { fetchEpicFree } = require('./epic');

const parser = new Parser({
  timeout: 15000,
  customFields: { item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail']] },
});

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');
const strip = (h = '') =>
  h.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

function extractImage(it) {
  const direct = it.mediaContent?.$?.url \vert{}\vert{} it.mediaThumbnail?.$?.url || it.enclosure?.url;
  if (direct) return direct;
  const m = (it['content:encoded'] || it.content || '').match(/<img[^>]+src=["']([^"']+)/i);
  return m ? m[1] : null;
}

// Hype / category tags. Order matters: first match wins.
const RULES = [
  ['rumor', /rumou?r|leak|allegedly|reportedly|insider|speculat/i],
  ['free', /\bfree\b|giveaway|100% off/i],
  ['hype', /gta (6|vi)|announce|reveal|trailer|confirmed|nintendo direct|state of play|switch 2|ps6|game of the year/i],
  ['release', /release date|launch|out now|available now|review|patch|update/i],
];
const classify = (it) => (RULES.find(([, re]) => re.test(`${it.title} ${it.summary}`)) || ['news'])[0];

async function fetchRss() {
  const out = [];
  await Promise.all(
    cfg.feeds.map(async (f) => {
      try {
        const feed = await parser.parseURL(f.url);
        for (const it of feed.items.slice(0, 10)) {
          if (!it.link) continue;
          out.push({
            id: sha(it.link),
            title: strip(it.title),
            summary: strip(it.contentSnippet || it.content || '').slice(0, 900),
            link: it.link,
            image: extractImage(it),
            source: f.name,
            date: new Date(it.isoDate || it.pubDate || Date.now()),
          });
        }
      } catch (e) {
        log.warn(`Feed failed (${f.name}): ${e.message}`);
      }
    })
  );
  return out;
}

/** category: 'all' | 'news' | 'free' — returns items sorted newest-first */
async function fetchAll(category = 'all') {
  const [rss, epic] = await Promise.all([
    category === 'free' ? [] : fetchRss(),
    category === 'news' ? [] : fetchEpicFree(),
  ]);
  return [...epic, ...rss]
    .map((it) => ({ ...it, tag: it.tag || classify(it) }))
    .sort((a, b) => b.date - a.date);
}

module.exports = { fetchAll };