import React, { useState, useEffect } from 'react';
import NewsCard from '../components/NewsCard';

const Home = ({ news, loading, error }) => {
    const [currentCategory, setCurrentCategory] = useState('all');
    
    useEffect(() => {
        const handleFilter = (e) => {
            setCurrentCategory(e.detail);
        };
        window.addEventListener('filter-category', handleFilter);
        return () => window.removeEventListener('filter-category', handleFilter);
    }, []);

    const filteredNews = currentCategory === 'all' 
        ? news 
        : news.filter(item => item.category === currentCategory);

    // Get today's date for editorial header
    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            {/* Editorial Header */}
            <div className="mb-12 border-b-4 border-black dark:border-white pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-black dark:text-white uppercase tracking-tight">Manşetler</h2>
                    <p className="text-gray-600 dark:text-gray-400 font-editorial italic mt-2">Öne çıkan gelişmeler ve derinlemesine analizler.</p>
                </div>
                <div className="text-sm font-bold uppercase tracking-widest border-t border-b border-black dark:border-white py-1 md:border-none md:py-0 text-black dark:text-white">
                    {today}
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
                    <p className="text-gray-600 dark:text-gray-400 font-editorial">Bu kategori için yayına hazırlanan bir içerik bulunmuyor.</p>
                </div>
            )}

            {/* News Grid */}
            {!loading && !error && filteredNews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {filteredNews.map((item, index) => (
                        <div key={item.id} className={`${index === 0 ? 'md:col-span-2 lg:col-span-3 border-b-4 border-black dark:border-white pb-8 mb-4' : ''}`}>
                            <NewsCard item={item} />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default Home;
