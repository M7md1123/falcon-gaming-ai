// Rewrites English news into professional Modern Standard Arabic (الفصحى).
// Primary: Claude (best quality). Fallback: free Google translate endpoint.
const axios = require('axios');
const cfg = require('../config');
const log = require('../utils/logger');

const cache = new Map();

const SYSTEM = `أنت محرر أخبار ألعاب فيديو محترف. أعد صياغة الخبر الإنجليزي باللغة العربية الفصحى المعاصرة بأسلوب صحفي رصين وواضح ومشوّق دون مبالغة.
- أبقِ أسماء الألعاب والاستوديوهات والمنصات بالإنجليزية عند الحاجة.
- لا تضف معلومات غير موجودة في النص.
- أعد JSON فقط بالشكل: {"title":"...","summary":"..."} وبدون أي نص آخر.`;

async function viaClaude(title, summary) {
  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
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
  return JSON.parse(text);
}

async function googleTranslate(text) {
  if (!text) return '';
  const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
    params: { client: 'gtx', sl: 'en', tl: 'ar', dt: 't', q: text },
    timeout: 15000,
  });
  return data[0].map((s) => s[0]).join('');
}

async function toArabic(item) {
  if (item.arabic) return item;
  if (cache.has(item.id)) return { ...item, ...cache.get(item.id) };

  let ar;
  try {
    if (cfg.anthropicKey) ar = await viaClaude(item.title, item.summary);
  } catch (e) {
    log.warn('Claude rewrite failed, using fallback:', e.message);
  }
  if (!ar) {
    try {
      ar = { title: await googleTranslate(item.title), summary: await googleTranslate(item.summary) };
    } catch (e) {
      log.warn('Fallback translation failed, keeping English:', e.message);
      ar = { title: item.title, summary: item.summary };
    }
  }
  cache.set(item.id, ar);
  return { ...item, ...ar };
}

module.exports = { toArabic };
