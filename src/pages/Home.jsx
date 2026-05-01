import React, { useState, useEffect, useRef, useCallback } from 'react';
import NewsCard from '../components/NewsCard';
import SearchBar from '../components/SearchBar';

const ITEMS_PER_PAGE = 12;

const Home = ({ news, loading, error }) => {
    const [currentCategory, setCurrentCategory] = useState('all');
    const [currentSource, setCurrentSource] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const observerRef = useRef(null);
    const loadMoreRef = useRef(null);
    
    useEffect(() => {
        const handleFilter = (e) => {
            setCurrentCategory(e.detail);
            setVisibleCount(ITEMS_PER_PAGE);
        };
        window.addEventListener('filter-category', handleFilter);
        return () => window.removeEventListener('filter-category', handleFilter);
    }, []);

    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [searchQuery, currentSource]);

    const uniqueSources = [...new Set(news.map(item => item.sourceName))].filter(Boolean).sort();

    let filteredNews = currentCategory === 'all' 
        ? news 
        : news.filter(item => item.category === currentCategory);

    if (currentSource !== 'all') {
        filteredNews = filteredNews.filter(item => item.sourceName === currentSource);
    }

    // Filter by search query (client-side)
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredNews = filteredNews.filter(item => 
            item.title?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q)
        );
    }

    const visibleNews = filteredNews.slice(0, visibleCount);
    const hasMore = visibleCount < filteredNews.length;

    // Infinite scroll with IntersectionObserver
    const lastItemRef = useCallback(node => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setVisibleCount(prev => prev + ITEMS_PER_PAGE);
            }
        }, { threshold: 0.1 });

        if (node) observerRef.current.observe(node);
    }, [loading, hasMore]);

    // Get today's date for editorial header
    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            {/* Editorial Header */}
            <div className="mb-8 border-b-4 border-black dark:border-white pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-black dark:text-white uppercase tracking-tight">Manşetler</h2>
                    <p className="text-gray-600 dark:text-gray-400 font-editorial italic mt-2">Öne çıkan gelişmeler ve derinlemesine analizler.</p>
                </div>
                <div className="text-sm font-bold uppercase tracking-widest border-t border-b border-black dark:border-white py-1 md:border-none md:py-0 text-black dark:text-white">
                    {today}
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-10 items-center justify-center">
                <div className="flex-grow w-full md:w-auto">
                    <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                </div>
                <div className="w-full md:w-64 flex-shrink-0">
                    <select
                        value={currentSource}
                        onChange={(e) => setCurrentSource(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-black dark:border-white bg-transparent text-black dark:text-white font-editorial text-sm focus:outline-none appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
                    >
                        <option value="all" className="bg-white dark:bg-gray-800 text-black dark:text-white">Tüm Kaynaklar</option>
                        {uniqueSources.map(source => (
                            <option key={source} value={source} className="bg-white dark:bg-gray-800 text-black dark:text-white">
                                {source}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="py-32 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-black dark:border-gray-800 dark:border-t-white rounded-full animate-spin"></div>
                    <p className="mt-6 text-black dark:text-white font-serif italic text-lg animate-pulse">Baskı hazırlanıyor...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-black dark:border-white p-10 max-w-2xl mx-auto">
                    <h3 className="text-2xl font-serif font-bold mb-4 text-black dark:text-white uppercase">Teknik Bir Aksaklık</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-editorial">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredNews.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                    <h3 className="text-2xl font-serif font-bold mb-2 text-black dark:text-white">Haber Bulunamadı</h3>
                    <p className="text-gray-600 dark:text-gray-400 font-editorial">
                        {searchQuery ? `"${searchQuery}" ile eşleşen haber bulunamadı.` : 'Bu kategori için yayına hazırlanan bir içerik bulunmuyor.'}
                    </p>
                </div>
            )}

            {/* News Grid */}
            {!loading && !error && visibleNews.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                        {visibleNews.map((item, index) => (
                            <div 
                                key={item.id} 
                                ref={index === visibleNews.length - 1 ? lastItemRef : null}
                                className={`${index === 0 && !searchQuery ? 'md:col-span-2 lg:col-span-3 border-b-4 border-black dark:border-white pb-8 mb-4' : ''}`}
                            >
                                <NewsCard item={item} />
                            </div>
                        ))}
                    </div>

                    {/* Loading More Indicator */}
                    {hasMore && (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white rounded-full animate-spin"></div>
                            <p className="mt-3 text-xs font-mono uppercase tracking-widest text-gray-500">Daha fazla yükleniyor...</p>
                        </div>
                    )}

                    {/* End of feed */}
                    {!hasMore && filteredNews.length > ITEMS_PER_PAGE && (
                        <div className="py-8 text-center border-t-2 border-black dark:border-white mt-8">
                            <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mt-4">
                                — Tüm haberler gösterildi ({filteredNews.length} haber) —
                            </p>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default Home;
