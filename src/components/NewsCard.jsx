import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
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

const NewsCard = ({ item }) => {
    const categoryLabel = item.category ? item.category.toUpperCase() : 'GENEL';
    const dateStr = formatDate(item.pubDate);
    const imageUrl = extractImage(item);
    
    const cleanDescription = stripHtml(item.description);
    const summary = cleanDescription.length > 150 ? cleanDescription.substring(0, 150) + '...' : cleanDescription;

    const fullText = stripHtml(item.content || item.description || '');
    const readingTime = calcReadingTime(fullText);

    const shareUrl = item.link || window.location.href;

    return (
        <article className="news-card flex flex-col h-full group">
            <Link to={`/haber/${item.id}`} className="block flex-grow flex flex-col">
                {/* Source & Date Header */}
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-black dark:text-white border-b border-black dark:border-white pb-2 mb-4">
                    <span>KAYNAK: {item.sourceName?.toUpperCase()}</span>
                    <span className="text-gray-500 font-medium normal-case tracking-normal">{dateStr}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-serif font-bold text-black dark:text-white mb-2 leading-tight group-hover:underline decoration-2 underline-offset-4">
                    {item.title}
                </h2>

                {/* Reading Time */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono">
                    <Clock size={12} />
                    <span>{readingTime} dk okuma</span>
                </div>

                {/* Summary */}
                <p className="text-sm font-editorial text-gray-700 dark:text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-grow">
                    {summary}
                </p>

                {/* Image */}
                <div className="relative w-full h-48 md:h-56 mt-auto overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-all duration-700" 
                        loading="lazy" 
                        onError={(e) => { e.target.src = SMART_THUMBNAILS[item.category] || SMART_THUMBNAILS['dünya']; }}
                    />
                    {/* Category Label overlay */}
                    <div className="absolute bottom-0 left-0 bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-xs font-bold uppercase tracking-widest">
                        {categoryLabel}
                    </div>
                </div>
            </Link>

            {/* Share Buttons - Outside the Link */}
            <div className="mt-4">
                <ShareButtons title={item.title} url={shareUrl} />
            </div>
        </article>
    );
};

export default NewsCard;
