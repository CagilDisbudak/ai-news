import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const extractImage = (item) => {
    if (item.enclosure && item.enclosure.link) return item.enclosure.link;
    if (item.thumbnail) return item.thumbnail;
    const imgRegex = /<img[^>]+src="([^">]+)"/i;
    const match = item.description?.match(imgRegex) || item.content?.match(imgRegex);
    if (match && match[1]) return match[1];
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200';
};

const NewsDetail = ({ news, loading }) => {
    const { id } = useParams();
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
    
    // We use content if available, else fallback to description
    const rawContent = newsItem.content || newsItem.description || '';
    // Optional: strip images from HTML so we don't have duplicates if we already show the header image
    const contentHtml = rawContent.replace(/<img[^>]*>/g, "");

    return (
        <article className="max-w-3xl mx-auto mt-4">
            
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black dark:text-white hover:opacity-70 transition-opacity mb-8 border-b border-black dark:border-white pb-1">
                <ArrowLeft size={16} />
                Ana Sayfa
            </Link>

            {/* Editorial Header */}
            <header className="mb-10 text-center border-b-2 border-black dark:border-white pb-8">
                <div className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
                    KAYNAK: <span className="text-black dark:text-white">{newsItem.sourceName}</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-serif font-black text-black dark:text-white leading-tight mb-8">
                    {newsItem.title}
                </h1>

                <div className="flex items-center justify-center gap-4 text-sm font-editorial italic text-gray-600 dark:text-gray-400">
                    <time>{dateStr}</time>
                    <span>|</span>
                    <span className="uppercase font-sans font-bold not-italic">{newsItem.category}</span>
                </div>
            </header>

            {/* Featured Image */}
            <figure className="mb-12">
                <img 
                    src={imageUrl} 
                    alt={newsItem.title} 
                    className="w-full h-[50vh] object-cover grayscale"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200'; }}
                />
                <figcaption className="text-right text-xs font-serif italic text-gray-500 mt-2">
                    Fotoğraf: AI News Portal
                </figcaption>
            </figure>

            {/* Content Body */}
            <div className="drop-cap">
                <div 
                    className="prose prose-lg dark:prose-invert max-w-none 
                               font-editorial text-gray-800 dark:text-gray-200 leading-loose
                               prose-p:mb-8 prose-p:text-lg md:prose-p:text-xl
                               prose-a:text-black dark:prose-a:text-white hover:prose-a:underline
                               prose-headings:font-serif prose-headings:font-bold prose-headings:text-black dark:prose-headings:text-white
                               prose-strong:font-bold prose-strong:text-black dark:prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: contentHtml }} 
                />
            </div>
            
            {/* Original Link */}
            <div className="mt-16 pt-8 border-t border-gray-300 dark:border-dark-border text-center">
                <a href={newsItem.link} target="_blank" rel="noopener noreferrer" 
                   className="inline-block px-8 py-3 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity">
                    Haberin Orijinaline Git
                </a>
            </div>
        </article>
    );
};

export default NewsDetail;
