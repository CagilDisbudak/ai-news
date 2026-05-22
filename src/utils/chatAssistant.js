// TODO: replace getReply with API proxy when a real LLM backend is available

export const QUICK_SUGGESTIONS = [
  { label: 'Son haberler', query: 'Son haberler' },
  { label: 'Teknoloji', query: 'Teknoloji haberleri' },
  { label: 'Finans', query: 'Finans' },
  { label: 'İstatistik', query: 'Kaç haber var' },
];

const CATEGORIES = {
  teknoloji: ['teknoloji', 'tech', 'webrazzi'],
  ekonomi: ['ekonomi', 'bloomberg', 'piyasa'],
  dünya: ['dünya', 'dunya', 'bbc', 'uluslararasi', 'uluslararası'],
  spor: ['futbol', 'lig'],
  bilim: ['bilim', 'nasa', 'uzay', 'bilimsel'],
  donanım: ['donanım', 'donanim', 'hardware'],
  kripto: ['kripto', 'crypto', 'uzmancoin'],
};

const CATEGORY_LABELS = {
  teknoloji: 'Teknoloji',
  ekonomi: 'Ekonomi',
  dünya: 'Dünya',
  spor: 'Spor',
  bilim: 'Bilim',
  donanım: 'Donanım',
  kripto: 'Kripto',
};

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matches(q, keywords) {
  return keywords.some((kw) => q.includes(normalize(kw)));
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const CATEGORY_FALLBACK_IMAGES = {
  teknoloji: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200',
  ekonomi: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=200',
  dünya: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&q=80&w=200',
  spor: 'https://images.unsplash.com/photo-1461896836934-bd45ba8aa120?auto=format&fit=crop&q=80&w=200',
  bilim: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=200',
  donanım: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=200',
  kripto: 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=200',
};

function extractItemImage(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.thumbnail) return item.thumbnail;
  const match = /<img[^>]+src="([^">]+)"/i.exec((item.description || '') + ' ' + (item.content || ''));
  if (match?.[1]) return match[1];
  return CATEGORY_FALLBACK_IMAGES[item.category] || CATEGORY_FALLBACK_IMAGES['dünya'];
}

function detectCategory(q) {
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some((kw) => q.includes(normalize(kw)))) {
      return category;
    }
  }
  if (q.includes('spor') && !q.includes('spor sayfa')) return 'spor';
  return null;
}

function wantsNewsList(q) {
  return matches(q, ['haber', 'haberleri', 'gundem', 'güncel', 'son', 'listele', 'goster', 'göster']);
}

function extractSearchTerm(q) {
  const patterns = [
    /(.+?)\s+hakkinda/,
    /(.+?)\s+hakkında/,
    /haber\s+ara\s+(.+)/,
    /(.+?)\s+haber/,
    /(.+?)\s+ile\s+ilgili/,
    /(.+?)\s+nedir/,
  ];
  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match?.[1]) {
      const term = match[1].trim();
      const skip = ['son', 'gundem', 'bugun', 'bu', 'bu haber', 'finans', 'spor'];
      if (term.length >= 2 && !skip.includes(term)) {
        return term;
      }
    }
  }
  return null;
}

function formatNewsItem(item) {
  return {
    label: item.title,
    href: `/haber/${item.id}`,
    meta: `${item.sourceName || 'Kaynak'} · ${CATEGORY_LABELS[item.category] || item.category || 'genel'}`,
    image: extractItemImage(item),
    category: CATEGORY_LABELS[item.category] || item.category || 'genel',
  };
}

function searchInNews(news, term) {
  const normalizedTerm = normalize(term);
  return news
    .filter((item) => {
      const title = normalize(item.title || '');
      const desc = normalize(stripHtml(item.description || ''));
      const source = normalize(item.sourceName || '');
      return (
        title.includes(normalizedTerm) ||
        desc.includes(normalizedTerm) ||
        source.includes(normalizedTerm)
      );
    })
    .slice(0, 3);
}

function greeting() {
  return {
    text: 'Merhaba! Ben THE AI NEWS asistanıyım. Haber arayabilir, özet alabilir veya site özelliklerini sorabilirsiniz.',
    links: [],
    suggestions: ['Son haberler', 'Teknoloji haberleri', 'Finans', 'Özellikler'],
  };
}

function thanks() {
  return {
    text: 'Rica ederim! Başka bir konuda yardımcı olmamı isterseniz buradayım.',
    links: [],
  };
}

function latestNews(news) {
  const items = news.slice(0, 5);
  if (items.length === 0) {
    return {
      text: 'Şu an listelenecek haber bulunamadı. Lütfen biraz sonra tekrar deneyin.',
      links: [],
    };
  }
  return {
    text: 'İşte gündemden son 5 haber:',
    links: items.map(formatNewsItem),
  };
}

function searchNews(news, term) {
  const results = searchInNews(news, term);

  if (results.length === 0) {
    return {
      text: `"${term}" ile eşleşen haber bulamadım. Farklı bir anahtar kelime deneyebilir veya "son haberler" yazabilirsiniz.`,
      links: [],
      suggestions: ['Son haberler', 'Teknoloji', 'Ekonomi'],
    };
  }
  return {
    text: `"${term}" için ${results.length} haber buldum:`,
    links: results.map(formatNewsItem),
  };
}

function categoryNews(news, category) {
  const items = news.filter((item) => item.category === category).slice(0, 3);
  const label = CATEGORY_LABELS[category] || category;

  if (items.length === 0) {
    return {
      text: `${label} kategorisinde şu an haber yok. Ana sayfadan diğer kategorilere göz atabilirsiniz.`,
      links: [{ label: 'Ana Sayfa', href: '/' }],
    };
  }
  return {
    text: `${label} kategorisinden öne çıkanlar:`,
    links: items.map(formatNewsItem),
  };
}

function newsStats(news) {
  if (news.length === 0) {
    return { text: 'Henüz yüklenmiş haber yok.', links: [] };
  }

  const counts = {};
  const sources = new Set();
  news.forEach((item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    if (item.sourceName) sources.add(item.sourceName);
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const lines = sorted
    .map(([cat, n]) => `• ${CATEGORY_LABELS[cat] || cat}: ${n} haber`)
    .join('\n');

  return {
    text: `Şu an ${news.length} haber yüklü (${sources.size} kaynak).\n\nKategori dağılımı:\n${lines}`,
    links: [{ label: 'Tüm Haberlere Git', href: '/' }],
  };
}

function articleSummary(article) {
  const raw = stripHtml(article.description || article.content || '');
  const excerpt = raw.length > 300 ? `${raw.slice(0, 300)}...` : raw;

  return {
    text: `📰 ${article.title}\n\n${excerpt || 'Bu haber için kısa açıklama bulunamadı.'}\n\nKaynak: ${article.sourceName || 'Bilinmiyor'} · ${CATEGORY_LABELS[article.category] || article.category || ''}`,
    links: [{ label: 'Haberde Kal', href: `/haber/${article.id}` }],
  };
}

function routeContext(pathname, currentArticle) {
  if (currentArticle && pathname.startsWith('/haber/')) {
    return {
      text: 'Şu an bir haber okuyorsunuz. "Özet" yazarak kısa özet alabilir veya başka konularda soru sorabilirsiniz.',
      links: [],
      suggestions: ['Özet', 'Benzer haberler', 'Ana sayfa'],
    };
  }
  if (pathname === '/finans') {
    return {
      text: 'Finans Merkezindesiniz. Kurlar ve grafikler bu sayfada. Chat\'ten "dolar" veya ana sayfa haberleri için "son haberler" yazın.',
      links: [],
      suggestions: ['Son haberler', 'Ekonomi haberleri'],
    };
  }
  if (pathname === '/spor') {
    return {
      text: 'Spor sayfasındasınız — canlı skorlar ve AI maç tahmini burada. Haber aramak için "spor haberleri" yazabilirsiniz.',
      links: [],
      suggestions: ['Spor haberleri', 'Son haberler'],
    };
  }
  return null;
}

function similarNews(news, article) {
  const related = news
    .filter(
      (item) =>
        item.id !== article.id &&
        (item.category === article.category ||
          normalize(item.title || '').split(' ').some((w) => w.length > 4 && normalize(article.title || '').includes(w)))
    )
    .slice(0, 3);

  if (related.length === 0) {
    return categoryNews(news, article.category);
  }

  return {
    text: `"${article.title}" ile ilgili olabilecek diğer haberler:`,
    links: related.map(formatNewsItem),
  };
}

function financeHelp() {
  return {
    text: 'Finans Merkezi\'nde canlı USD/EUR/altın/bitcoin kurları, interaktif grafikler, AI trend analizi ve para birimi dönüştürücü bulunur.\n\nNot: Tahminler simülasyondur; yatırım tavsiyesi değildir.',
    links: [{ label: 'Finans Merkezine Git', href: '/finans' }],
  };
}

function sportsHelp() {
  return {
    text: 'Spor sayfasında canlı maç skorları (TheSportsDB) ve iki takım seçerek AI maç tahmini yapabilirsiniz. Tahminler eğlence amaçlı simülasyondur.',
    links: [{ label: 'Spor Sayfasına Git', href: '/spor' }],
  };
}

function featuresHelp() {
  return {
    text: 'Site özellikleri:\n\n• Clickbait Shield — Navbar\'daki kalkan ikonu; abartılı başlıkları sadeleştirir.\n• AI Çeviri — Haber detayında yabancı içerikleri Türkçeye çevirir (MyMemory API).\n• Karanlık Tema — Navbar\'daki ay/güneş ikonu ile geçiş yapın.\n• Kategori Filtreleri — Ana sayfada teknoloji, ekonomi, spor vb.',
    links: [],
  };
}

function aboutHelp() {
  return {
    text: 'THE AI NEWS, editoryal tasarımla modern bir haber portalıdır. Webrazzi, Bloomberg HT, BBC Türkçe, NASA ve daha fazla kaynaktan RSS ile haber çeker; Finans ve Spor modülleriyle genişler.',
    links: [{ label: 'Ana Sayfa', href: '/' }],
  };
}

function fallback() {
  return {
    text: 'Tam olarak anlayamadım. Aşağıdaki önerilerden birini deneyebilir veya kendi sorunuzu yazabilirsiniz.',
    links: [],
    suggestions: ['Son haberler', 'Teknoloji', 'Finans', 'Özellikler'],
  };
}

export function getWelcomeMessage(pathname = '/') {
  const base = greeting();
  const ctx = routeContext(pathname, null);
  if (ctx && pathname !== '/') {
    return {
      ...base,
      text: `${base.text}\n\n${ctx.text}`,
      suggestions: ctx.suggestions || base.suggestions,
    };
  }
  return base;
}

export function getReply(
  text,
  { news = [], loading = false, pathname = '/', currentArticle = null } = {}
) {
  if (loading) {
    return {
      text: 'Haberler henüz yükleniyor. Birkaç saniye sonra tekrar sorabilirsiniz.',
      links: [],
    };
  }

  const q = normalize(text);
  if (!q) return fallback();

  if (matches(q, ['tesekkur', 'teşekkür', 'sagol', 'sağol', 'eyvallah', 'thanks'])) {
    return thanks();
  }

  if (matches(q, ['merhaba', 'selam', 'hey', 'gunaydin', 'günaydın', 'hosgeldin', 'hoşgeldin'])) {
    return greeting();
  }

  if (
    currentArticle &&
    matches(q, ['ozet', 'özet', 'bu haber', 'bu nedir', 'ne diyor', 'okudugum', 'okuduğum', 'acikla', 'açıkla'])
  ) {
    return articleSummary(currentArticle);
  }

  if (currentArticle && matches(q, ['benzer', 'ilgili', 'diger', 'diğer', 'buna benzer'])) {
    return similarNews(news, currentArticle);
  }

  if (matches(q, ['neredeyim', 'hangi sayfa', 'burada ne', 'ne yapabilirim', 'yardim et'])) {
    const ctx = routeContext(pathname, currentArticle);
    if (ctx) return ctx;
  }

  if (matches(q, ['kac haber', 'kaç haber', 'istatistik', 'kac tane', 'kaç tane', 'toplam', 'dagilim', 'dağılım'])) {
    return newsStats(news);
  }

  if (matches(q, ['son haber', 'gundem', 'gündem', 'bugun', 'bugün', 'en son', 'guncel', 'güncel'])) {
    return latestNews(news);
  }

  const category = detectCategory(q);
  if (category && (wantsNewsList(q) || matches(q, ['haberleri', 'kategorisi']))) {
    return categoryNews(news, category);
  }

  if (matches(q, ['finans', 'dolar', 'euro', 'eur', 'usd', 'altin', 'altın', 'gumus', 'gümüş', 'kur', 'borsa', 'yatirim', 'yatırım'])) {
    if (q.includes('haber') || q.includes('gundem') || q.includes('güncel')) {
      return searchNews(news, q.includes('bitcoin') ? 'bitcoin' : 'ekonomi');
    }
    return financeHelp();
  }

  if (matches(q, ['bitcoin', 'ethereum', 'kripto']) && !q.includes('sayfa')) {
    if (q.includes('haber') || wantsNewsList(q)) {
      return categoryNews(news, 'kripto');
    }
  }

  if (matches(q, ['spor sayfa', 'mac tahmin', 'maç tahmin', 'canli skor', 'canlı skor'])) {
    return sportsHelp();
  }

  if (matches(q, ['spor', 'mac', 'maç', 'skor', 'tahmin', 'futbol', 'lig', 'galatasaray', 'fenerbahce', 'fenerbahçe'])) {
    if (wantsNewsList(q) || q.includes('haber')) {
      return categoryNews(news, 'spor');
    }
    return sportsHelp();
  }

  if (matches(q, ['clickbait', 'ceviri', 'çeviri', 'karanlik', 'karanlık', 'tema', 'ozellik', 'özellik', 'nasil kullan', 'nasıl kullan', 'yardim', 'yardım', 'ozellikler', 'özellikler'])) {
    return featuresHelp();
  }

  if (matches(q, ['kim sin', 'kimsin', 'ne bu', 'site nedir', 'hakkında site', 'the ai news', 'portal'])) {
    return aboutHelp();
  }

  const searchTerm = extractSearchTerm(q);
  if (searchTerm || matches(q, ['haber ara', 'ara haber', 'bul haber'])) {
    const term = searchTerm || q.replace(/haber|ara|bul|ile|ilgili|nedir/g, '').trim();
    if (term.length >= 2) return searchNews(news, term);
  }

  if (category) {
    const catResult = categoryNews(news, category);
    if (catResult.links.length > 0) return catResult;
  }

  const words = q.split(' ').filter((w) => w.length >= 3);
  for (const word of words) {
    const result = searchNews(news, word);
    if (result.links.length > 0) return result;
  }

  return fallback();
}
