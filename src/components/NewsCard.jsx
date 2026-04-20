import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag } from 'lucide-react';
import ShareButtons from './ShareButtons';

const stripHtml = (html) => {
    if (!html) return '';
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || "";
    return text.replace(/\s+/g, ' ').trim();
};

const SMART_THUMBNAILS = {
    'teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    'ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
    'dünya': 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&q=80&w=800',
    'spor': 'https://images.unsplash.com/photo-1461896836934-bd45ba8aa120?auto=format&fit=crop&q=80&w=800',
    'bilim': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800',
    'donanım': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800',
    'kripto': 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=800',
};

const extractImage = (item) => {
    const isPlaceholder = (url) => {
        if (!url) return true;
        const lowUrl = url.toLowerCase();
        // Donanım Haber specific placeholders and generic patterns
        return lowUrl.includes('placeholder') || 
               lowUrl.includes('default') || 
               lowUrl.includes('no-image') || 
               lowUrl.includes('pixel') ||
               lowUrl.includes('1x1') ||
               lowUrl.includes('logo-dh') ||
               lowUrl.includes('avatar') ||
               lowUrl.includes('donanimhaber.com/images/haber/') === false && lowUrl.includes('donanimhaber.com');
    };

    const getKeywordImage = (title) => {
        const t = (title || '').toLowerCase();
        // Hardware & Components
        if (t.includes('ekran kartı') || t.includes('gpu') || t.includes('nvidia') || t.includes('rtx') || t.includes('gtx'))
            return 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800';
        if (t.includes('işlemci') || t.includes('cpu') || t.includes('intel') || t.includes('amd') || t.includes('ryzen'))
            return 'https://images.unsplash.com/photo-1555617766-c94804975da3?auto=format&fit=crop&q=80&w=800';
        if (t.includes('anakart') || t.includes('motherboard'))
            return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800';
        if (t.includes('ram') || t.includes('bellek'))
            return 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&q=80&w=800';
        
        // Devices
        if (t.includes('telefon') || t.includes('iphone') || t.includes('samsung') || t.includes('xiaomi') || t.includes('mobil')) 
            return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800';
        if (t.includes('laptop') || t.includes('bilgisayar') || t.includes('macbook'))
            return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800';
        
        // Games & Software
        if (t.includes('oyun') || t.includes('gaming') || t.includes('ps5') || t.includes('xbox') || t.includes('nintendo') || t.includes('steam')) 
            return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800';
        if (t.includes('yapay zeka') || t.includes('ai') || t.includes('chatgpt') || t.includes('yazılım')) 
            return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800';
            
        // Other
        if (t.includes('araba') || t.includes('togg') || t.includes('tesla') || t.includes('elektrikli') || t.includes('otomobil')) 
            return 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800';
        if (t.includes('uzay') || t.includes('nasa') || t.includes('yıldız') || t.includes('gezegen') || t.includes('roket')) 
            return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800';
        if (t.includes('bilim') || t.includes('deney') || t.includes('laboratuvar'))
            return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800';
            
        return null;
    };

    let sourceImg = null;
    if (item.enclosure && item.enclosure.url) sourceImg = item.enclosure.url;
    else if (item.thumbnail) sourceImg = item.thumbnail;
    else {
        const imgRegex = /<img[^>]+src="([^">]+)"/ig;
        const match = imgRegex.exec((item.description || '') + ' ' + (item.content || ''));
        if (match) sourceImg = match[1];
    }

    if (sourceImg && !isPlaceholder(sourceImg)) {
        return sourceImg;
    }

    const keywordImg = getKeywordImage(item.title);
    if (keywordImg) return keywordImg;

    return SMART_THUMBNAILS[item.category] || SMART_THUMBNAILS['dünya'];
};

const formatDate = (dateString) => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    try {
        const date = new Date(dateString.replace(/-/g, '/'));
        return date.toLocaleDateString('tr-TR', options);
    } catch(e) {
        return dateString;
    }
};

const calcReadingTime = (text) => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes < 1 ? 1 : minutes;
};

const getSentiment = (title, content) => {
    const text = (title + ' ' + content).toLowerCase();
    const positiveWords = ['rekor', 'yükseldi', 'arttı', 'başarı', 'kazandı', 'zirve', 'büyüme', 'müjde', 'onaylandı', 'şampiyon', 'galibiyet', 'keşfedildi'];
    const negativeWords = ['düştü', 'kayıp', 'kaza', 'savaş', 'ölüm', 'yaralı', 'yangın', 'düşüş', 'kriz', 'tehlike', 'hata', 'yasak', 'iflas', 'saldırı'];
    let score = 0;
    positiveWords.forEach(w => { if (text.includes(w)) score++; });
    negativeWords.forEach(w => { if (text.includes(w)) score--; });
    if (score > 0) return { label: 'POZİTİF', color: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' };
    if (score < 0) return { label: 'NEGATİF', color: 'text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' };
    return { label: 'NÖTR', color: 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700' };
};

const extractSmartTags = (title, content) => {
    const text = (title + ' ' + content).toLowerCase();
    const entities = ['Apple', 'Nvidia', 'Tesla', 'Bitcoin', 'Ethereum', 'NASA', 'SpaceX', 'Dolar', 'Euro', 'TCMB', 'Fed', 'Altın', 'Borsa', 'Google', 'Microsoft', 'Samsung', 'Fenerbahçe', 'Galatasaray', 'Beşiktaş', 'Arda Güler', 'Elon Musk', 'Yapay Zeka', 'ChatGPT', 'TOGG'];
    return entities.filter(e => text.includes(e.toLowerCase())).slice(0, 3);
};

const cleanTitle = (title) => {
    let cleaned = title;
    const clickbaitPhrases = ['İnanamayacaksınız', 'Şok Şok', 'Belli Oldu', 'Olay Gelişme', 'Dikkat', 'Flaş Flaş', 'Az Önce Açıklandı', 'Resmen Duyuruldu', 'Büyük Sürpriz', 'Gündeme Bomba Gibi Düştü', 'Tüm Detaylar'];
    clickbaitPhrases.forEach(p => {
        const regex = new RegExp(p, 'gi');
        cleaned = cleaned.replace(regex, '').replace(/!+/g, '.');
    });
    return cleaned.trim().charAt(0).toUpperCase() + cleaned.trim().slice(1);
};

const NewsCard = ({ item }) => {
    const [isShieldActive, setIsShieldActive] = useState(localStorage.getItem('clickbait-shield') === 'active');
    
    useEffect(() => {
        const handleShieldToggle = (e) => setIsShieldActive(e.detail);
        window.addEventListener('clickbait-shield-toggle', handleShieldToggle);
        return () => window.removeEventListener('clickbait-shield-toggle', handleShieldToggle);
    }, []);

    const categoryLabel = item.category ? item.category.toUpperCase() : 'GENEL';
    const dateStr = formatDate(item.pubDate);
    const imageUrl = extractImage(item);
    const cleanDescription = stripHtml(item.description);
    const summary = cleanDescription.length > 150 ? cleanDescription.substring(0, 150) + '...' : cleanDescription;
    const fullText = stripHtml(item.content || item.description || '');
    const readingTime = calcReadingTime(fullText);
    const sentiment = getSentiment(item.title, fullText);
    const tags = extractSmartTags(item.title, fullText);
    const displayTitle = isShieldActive ? cleanTitle(item.title) : item.title;
    const shareUrl = item.link || window.location.href;

    return (
        <article className="news-card flex flex-col h-full group">
            <Link to={`/haber/${item.id}`} className="block flex-grow flex flex-col">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-black dark:text-white border-b border-black dark:border-white pb-2 mb-4">
                    <span>KAYNAK: {item.sourceName?.toUpperCase()}</span>
                    <span className="text-gray-500 font-medium normal-case tracking-normal">{dateStr}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${sentiment.color}`}>
                        {sentiment.label}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        <Clock size={12} />
                        <span>{readingTime} dk okuma</span>
                    </div>
                </div>

                <h2 className="text-xl md:text-2xl font-serif font-bold text-black dark:text-white mb-2 leading-tight group-hover:underline decoration-2 underline-offset-4">
                    {displayTitle}
                </h2>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400 px-2 py-0.5 rounded-full">
                                <Tag size={8} /> {tag}
                            </span>
                        ))}
                    </div>
                )}

                <p className="text-sm font-editorial text-gray-700 dark:text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-grow">
                    {summary}
                </p>

                <div className="relative w-full h-48 md:h-56 mt-auto overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-all duration-700" 
                        loading="lazy" 
                        onError={(e) => { e.target.src = SMART_THUMBNAILS[item.category] || SMART_THUMBNAILS['dünya']; }}
                    />
                    <div className="absolute bottom-0 left-0 bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-xs font-bold uppercase tracking-widest">
                        {categoryLabel}
                    </div>
                </div>
            </Link>

            <div className="mt-4">
                <ShareButtons title={displayTitle} url={shareUrl} />
            </div>
        </article>
    );
};

export default NewsCard;
