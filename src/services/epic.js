// Epic Games Store: currently free games (already returned in Arabic by the API).
const axios = require('axios');
const crypto = require('crypto');
const log = require('../utils/logger');

const URL = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions';
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');

async function fetchEpicFree() {
  try {
    const { data } = await axios.get(URL, {
      params: { locale: 'ar', country: 'SA', allowCountries: 'SA' },
      timeout: 15000,
    });
    const elements = data?.data?.Catalog?.searchStore?.elements || [];
    return elements
      .filter(
        (e) =>
          e.promotions?.promotionalOffers?.[0]?.promotionalOffers?.length &&
          e.price?.totalPrice?.discountPrice === 0
      )
      .map((e) => {
        const p = e.promotions.promotionalOffers[0].promotionalOffers[0];
        const slug = e.productSlug || e.urlSlug || e.catalogNs?.mappings?.[0]?.pageSlug;
        const img = (e.keyImages || []).find((i) => i.type === 'OfferImageWide') || e.keyImages?.[0];
        return {
          id: sha(`epic:${e.id}:${p.endDate}`),
          title: e.title,
          summary: (e.description || '').slice(0, 400),
          link: `https://store.epicgames.com/en-US/p/${slug}`,
          image: img?.url,
          source: 'Epic Games Store',
          date: new Date(p.startDate),
          ends: new Date(p.endDate),
          tag: 'free',
          arabic: true, // skip translation
        };
      });
  } catch (e) {
    log.warn('Epic free games fetch failed:', e.message);
    return [];
  }
}

module.exports = { fetchEpicFree };
