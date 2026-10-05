// Translates headline + content into Modern Standard Arabic (الفصحى) BEFORE posting.
// Pipeline: Claude rewrite (best) -> retry once -> free Google fallback -> validate output is Arabic.
const axios = require('axios');
const cfg = require('../config');
const log = require('../utils/logger');

const cache = new Map();

const SYSTEM = `أنت محرر أخبار ألعاب فيديو محترف. أعد صياغة الخبر الإنجليزي باللغة العربية الفصحى المعاصرة بأسلوب صحفي رصين وواضح ومشوّق دون مبالغة.
- أبقِ أسماء الألعاب والاستوديوهات والمنصات بالإنجليزية عند الحاجة.
- لا تضف معلومات غير موجودة في النص.
- أعد JSON فقط بالشكل: {"title":"...","summary":"..."} وبدون أي نص آخر.`;

// ---- helpers ----------------------------------------------------------------
const ARABIC = /[\u0600-\u06FF]/g;
const LETTERS = /[A-Za-z\u0600-\u06FF]/g;

/** True if the text is mostly Arabic (game names in English are tolerated). */
function isArabic(text) {
  if (!text) return true;
  const letters = (text.match(LETTERS) || []).length;
  if (!letters) return true;
  return (text.match(ARABIC) || []).length / letters >= 0.4;
}

/** Splits long text on sentence boundaries so each request stays small. */
function chunk(text, max = 800) {
  const parts = text.split(/(?<=[.!?])\s+/);
  const out = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).length > max && cur) {
      out.push(cur);
      cur = p;
    } else cur = cur ? `${cur} ${p}` : p;
  }
  if (cur) out.push(cur);
  return out;
}

// ---- engines ----------------------------------------------------------------
async function viaClaude(title, summary) {
  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify({ title, summary }) }],
    },
    {
      headers: {
        'x-api-key': cfg.anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 30000,
    }
  );
  const text = data.content.map((c) => c.text || '').join('').replace(/```json|```/g, '').trim();
  const out = JSON.parse(text);
  return { title: String(out.title || ''), summary: String(out.summary || '') };
}

async function googleTranslate(text) {
  if (!text) return '';
  const pieces = [];
  for (const part of chunk(text)) {
    const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: { client: 'gtx', sl: 'auto', tl: 'ar', dt: 't', q: part },
      timeout: 15000,
    });
    pieces.push(data[0].map((s) => s[0]).join(''));
  }
  return pieces.join(' ');
}

const valid = (r) => r && r.title && isArabic(r.title) && isArabic(r.summary);

// ---- public API -------------------------------------------------------------
/** Returns the item with Arabic title/summary and translated:true, or translated:false on failure. */
async function toArabic(item) {
  if (!cfg.translate || item.arabic) return item; // Epic items already arrive in Arabic
  if (cache.has(item.id)) return { ...item, ...cache.get(item.id), translated: true };

  let result = null;

  if (cfg.anthropicKey) {
    for (let attempt = 1; attempt <= 2 && !result; attempt++) {
      try {
        const r = await viaClaude(item.title, item.summary);
        if (valid(r)) result = r;
        else log.warn(`Claude output not Arabic (attempt ${attempt}) for "${item.title}"`);
      } catch (e) {
        log.warn(`Claude rewrite failed (attempt ${attempt}):`, e.message);
      }
    }
  }

  if (!result) {
    try {
      const r = { title: await googleTranslate(item.title), summary: await googleTranslate(item.summary) };
      if (valid(r)) result = r;
    } catch (e) {
      log.warn('Fallback translation failed:', e.message);
    }
  }

  if (!result) return { ...item, translated: false };
  cache.set(item.id, result);
  return { ...item, ...result, translated: true };
}

module.exports = { toArabic, isArabic };
