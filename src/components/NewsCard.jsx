import React from 'react';
import { Link } from 'react-router-dom';

const stripHtml = (html) => {
    if (!html) return '';
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || "";
    return text.replace(/\s+/g, ' ').trim();
};

const extractImage = (item) => {
    if (item.enclosure && item.enclosure.link) return item.enclosure.link;
    if (item.thumbnail) return item.thumbnail;
    
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = item.description?.match(imgRegex) || item.content?.match(imgRegex);
    if (match && match[1]) return match[1];

    const placeholders = {
        'teknoloji': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
        'ekonomi': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
        'dünya': 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&q=80&w=800'
    };
    
    return placeholders[item.category] || placeholders['dünya'];
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

const NewsCard = ({ item }) => {
    const categoryLabel = item.category ? item.category.toUpperCase() : 'GENEL';
    const dateStr = formatDate(item.pubDate);
    const imageUrl = extractImage(item);
    
    const cleanDescription = stripHtml(item.description);
    const summary = cleanDescription.length > 150 ? cleanDescription.substring(0, 150) + '...' : cleanDescription;

    return (
        <article className="news-card flex flex-col h-full group">
            <Link to={`/haber/${item.id}`} className="block flex-grow flex flex-col">
                {/* Source & Date Header */}
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-black dark:text-white border-b border-black dark:border-white pb-2 mb-4">
                    <span>KAYNAK: {item.sourceName?.toUpperCase()}</span>
                    <span className="text-gray-500 font-medium">{dateStr}</span>
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-black dark:text-white mb-3 leading-tight group-hover:underline decoration-2 underline-offset-4">
                    {item.title}
                </h2>

                {/* Summary */}
                <p className="text-sm font-editorial text-gray-700 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed flex-grow">
                    {summary}
                </p>

                {/* Image */}
                <div className="relative w-full h-48 md:h-64 mt-auto overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img 
                        src={imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                        loading="lazy" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800'; }}
                    />
                    {/* Category Label overlay */}
                    <div className="absolute bottom-0 left-0 bg-black text-white dark:bg-white dark:text-black px-3 py-1 text-xs font-bold uppercase tracking-widest">
                        {categoryLabel}
                    </div>
                </div>
            </Link>
        </article>
    );
};

export default NewsCard;
