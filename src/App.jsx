import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';
const FEEDS = [
    { url: 'https://webrazzi.com/feed', category: 'teknoloji', sourceName: 'Webrazzi' },
    { url: 'https://www.bloomberght.com/rss', category: 'ekonomi', sourceName: 'Bloomberg HT' },
    { url: 'https://tr.euronews.com/rss?level=vertical&type=all', category: 'dünya', sourceName: 'Euronews' }
];

function App() {
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Init Theme
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fetch Live RSS Data
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const fetchPromises = FEEDS.map(feed => 
            fetch(RSS2JSON_API + encodeURIComponent(feed.url))
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'ok') {
                        return data.items.map((item, index) => ({
                            ...item,
                            id: `${feed.category}-${index}-${Date.now()}`, // Create unique ID for routing
                            category: feed.category,
                            sourceName: feed.sourceName
                        }));
                    }
                    return [];
                })
                .catch(err => {
                    console.error(`Error fetching ${feed.sourceName}:`, err);
                    return [];
                })
        );

        const results = await Promise.all(fetchPromises);
        const mergedNews = results.flat().sort((a, b) => {
            return new Date(b.pubDate.replace(/-/g, '/')) - new Date(a.pubDate.replace(/-/g, '/'));
        });

        if (mergedNews.length === 0) {
            setError("Haber kaynaklarına şu an ulaşılamıyor.");
        }

        setAllNews(mergedNews);
      } catch (err) {
        setError("Bağlantı hatası oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Routes>
          <Route path="/" element={<Home news={allNews} loading={loading} error={error} />} />
          <Route path="/haber/:id" element={<NewsDetail news={allNews} loading={loading} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-bg border-t border-gray-300 dark:border-dark-border mt-auto py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-serif">
              <p className="text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center justify-center gap-2">
                  <span className="font-bold text-lg text-black dark:text-white">THE AI NEWS</span>
                  <span>&copy; {new Date().getFullYear()} Tüm hakları saklıdır.</span>
              </p>
          </div>
      </footer>
    </>
  )
}

export default App;
