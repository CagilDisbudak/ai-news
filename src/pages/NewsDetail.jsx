import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Languages, Sparkles, Tag } from 'lucide-react';
import ShareButtons from '../components/ShareButtons';

const SMART_THUMBNAILS = {
    'teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    'ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200',
    'dünya': 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&q=80&w=1200',
    'spor': 'https://images.unsplash.com/photo-1461896836934-bd45ba8aa120?auto=format&fit=crop&q=80&w=1200',
    'bilim': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1200',
    'donanım': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=1200',
    'kripto': 'https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=1200',
};

const extractImage = (item) => {
    // 1. Try enclosure (usually the best quality hero image)
    if (item.enclosure && item.enclosure.link && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
        return item.enclosure.link;
    }
    // 2. Try thumbnail if enclosure fails
    if (item.thumbnail && !item.thumbnail.includes('1x1') && !item.thumbnail.includes('logo')) {
        return item.thumbnail;
    }
    
    // 3. Fallback to extracting from description/content HTML
    const imgRegex = /<img[^>]+src="([^">]+)"/ig;
    let match;
    const searchArea = (item.description || '') + ' ' + (item.content || '');
    
    while ((match = imgRegex.exec(searchArea)) !== null) {
        const url = match[1].toLowerCase();
        // Ignore tiny tracking pixels, common logos, and icons
        if (!url.includes('1x1') && !url.includes('pixel') && !url.includes('logo') && !url.includes('avatar') && !url.includes('icon')) {
            return match[1]; // Return the original case URL
        }
    }

    // 4. Ultimate fallback to smart thumbnails
    return SMART_THUMBNAILS[item.category] || SMART_THUMBNAILS['dünya'];
};

const stripHtml = (html) => {
    if (!html) return '';
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, ' ').trim();
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
    if (score > 0) return { label: 'POZİTİF HABER', color: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' };
    if (score < 0) return { label: 'NEGATİF HABER', color: 'text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' };
    return { label: 'NÖTR HABER', color: 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700' };
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

const NewsDetail = ({ news, loading }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [translatedTitle, setTranslatedTitle] = useState(null);
    const [translatedContent, setTranslatedContent] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isShieldActive, setIsShieldActive] = useState(localStorage.getItem('clickbait-shield') === 'active');

    useEffect(() => {
        const handleShieldToggle = (e) => setIsShieldActive(e.detail);
        window.addEventListener('clickbait-shield-toggle', handleShieldToggle);
        return () => window.removeEventListener('clickbait-shield-toggle', handleShieldToggle);
    }, []);

    const newsItem = news.find(item => item.id === id);

    if (loading) {
        return (
            <div className="py-32 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!newsItem) {
        return (
            <div className="py-20 text-center">
                <h2 className="text-2xl font-serif font-bold mb-4 text-black dark:text-white uppercase">Haber bulunamadı</h2>
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white underline underline-offset-4">Ana sayfaya dön</Link>
            </div>
        );
    }

    const dateStr = new Date(newsItem.pubDate.replace(/-/g, '/')).toLocaleDateString('tr-TR', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const imageUrl = extractImage(newsItem);
    
    const rawContent = newsItem.content || newsItem.description || '';
    const contentHtml = rawContent.replace(/<img[^>]*>/g, "");

    const fullText = stripHtml(rawContent);
    const readingTime = calcReadingTime(fullText);
    const sentiment = getSentiment(newsItem.title, fullText);
    const tags = extractSmartTags(newsItem.title, fullText);
    const displayTitle = isShieldActive ? cleanTitle(newsItem.title) : (translatedTitle || newsItem.title);
    const shareUrl = newsItem.link || window.location.href;

    const isShortContent = fullText.length < 300;

    const handleTranslate = async () => {
        setIsTranslating(true);
        try {
            const titleRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(newsItem.title)}&langpair=en|tr`);
            const titleData = await titleRes.json();
            if(titleData.responseData.translatedText) {
                setTranslatedTitle(titleData.responseData.translatedText);
            }

            const textToTranslate = fullText.substring(0, 499);
            const contentRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|tr`);
            const contentData = await contentRes.json();
            
            if(contentData.responseData.translatedText) {
                setTranslatedContent(contentData.responseData.translatedText + (fullText.length > 500 ? "..." : ""));
            }
        } catch (err) {
            console.error("Translation failed", err);
            setTranslatedContent("Çeviri başarısız oldu. Lütfen daha sonra tekrar deneyin.");
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <article className="max-w-3xl mx-auto mt-4">
            
            <div className="flex items-center justify-between mb-8 border-b border-black dark:border-white pb-1">
                <button 
                    onClick={() => navigate(-1)} 
                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black dark:text-white hover:opacity-70 transition-opacity"
                >
                    <ArrowLeft size={16} />
                    Geri
                </button>

                {!translatedContent ? (
                    <button 
                        onClick={handleTranslate}
                        disabled={isTranslating}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {isTranslating ? (
                            <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div> ÇEVRİLİYOR...</span>
                        ) : (
                            <span className="flex items-center gap-2"><Languages size={14} /> AI İLE TÜRKÇE'YE ÇEVİR</span>
                        )}
                    </button>
                ) : (
                    <button 
                        onClick={() => { setTranslatedTitle(null); setTranslatedContent(null); }}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white px-4 py-2 hover:opacity-80 transition-opacity"
                    >
                        <ArrowLeft size={14} /> ORİJİNAL HALİNE DÖN
                    </button>
                )}
            </div>

            <header className="mb-10 text-center border-b-2 border-black dark:border-white pb-8">
                <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex flex-col items-center justify-center gap-3">
                    <span className={`text-[10px] font-bold px-3 py-1 border ${sentiment.color}`}>
                        {sentiment.label}
                    </span>
                    <span>KAYNAK: <span className="text-black dark:text-white">{newsItem.sourceName}</span></span>
                    {translatedTitle && (
                        <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-sm border border-yellow-200 dark:border-yellow-800">
                            <Sparkles size={10} /> AI Çevirisi Aktif
                        </span>
                    )}
                </div>
                
                <h1 className="text-3xl md:text-5xl font-serif font-black text-black dark:text-white leading-tight mb-6">
                    {displayTitle}
                </h1>

                {tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400 px-3 py-1 rounded-full">
                                <Tag size={8} /> {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-center gap-4 text-sm font-editorial italic text-gray-600 dark:text-gray-400 flex-wrap">
                    <time>{dateStr}</time>
                    <span>|</span>
                    <span className="uppercase font-sans font-bold not-italic">{newsItem.category}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1 not-italic font-mono text-xs">
                        <Clock size={12} /> {readingTime} dk okuma
                    </span>
                </div>
            </header>

            <figure className="mb-12">
                <img 
                    src={imageUrl} 
                    alt={newsItem.title} 
                    className="w-full h-[40vh] md:h-[50vh] object-cover"
                    onError={(e) => { e.target.src = SMART_THUMBNAILS[newsItem.category] || SMART_THUMBNAILS['dünya']; }}
                />
                <figcaption className="text-right text-xs font-serif italic text-gray-500 mt-2">
                    Kaynak: {newsItem.sourceName}
                </figcaption>
            </figure>

            <div className="drop-cap">
                {translatedContent ? (
                    <div className="prose prose-lg dark:prose-invert max-w-none font-editorial text-gray-800 dark:text-gray-200 leading-loose">
                        <p className="text-lg md:text-xl mb-8 p-6 bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-400 dark:border-gray-500 italic">
                            {translatedContent}
                        </p>
                    </div>
                ) : (
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none 
                                   font-editorial text-gray-800 dark:text-gray-200 leading-loose
                                   prose-p:mb-6 prose-p:text-base md:prose-p:text-lg
                                   prose-a:text-black dark:prose-a:text-white hover:prose-a:underline
                                   prose-headings:font-serif prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white
                                   prose-strong:font-bold prose-strong:text-black dark:prose-strong:text-white"
                        dangerouslySetInnerHTML={{ __html: contentHtml }} 
                    />
                )}
            </div>

            {isShortContent && (
                <div className="mt-12 p-6 bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 text-center">
                    <h3 className="text-lg font-serif font-bold text-black dark:text-white mb-2 uppercase">Haberin Devamı</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-editorial mb-4">
                        Yayıncı kuruluş, bu haberin yalnızca bir özetini akışta paylaşıyor. Haberin tüm detaylarını ve görsellerini orijinal kaynağında okuyabilirsiniz.
                    </p>
                    <a href={newsItem.link} target="_blank" rel="noopener noreferrer" 
                       className="inline-block px-6 py-2 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest text-xs hover:opacity-80 transition-opacity">
                        Orijinal Kaynağa Git
                    </a>
                </div>
            )}

            <div className="mt-16 pt-8 border-t-2 border-black dark:border-white flex flex-col sm:flex-row items-center justify-between gap-6">
                <ShareButtons title={displayTitle} url={shareUrl} />
                {!isShortContent && (
                    <a href={newsItem.link} target="_blank" rel="noopener noreferrer" 
                       className="inline-block px-8 py-3 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity">
                        Haberin Orijinaline Git
                    </a>
                )}
            </div>
        </article>
    );
};

export default NewsDetail;
