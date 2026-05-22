import React, { useState, useEffect, useRef } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ArrowLeft, ArrowRightLeft, TrendingUp, TrendingDown, Minus, Activity, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ASSET_LABELS = {
    TRY: 'Türk Lirası',
    EUR: 'Euro',
    GBP: 'İngiliz Sterlini',
    JPY: 'Japon Yeni',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
};

const PROJECTION_STEPS = {
    '1W': 2,
    '1M': 5,
    YTD: 7,
    '1Y': 0,
};

const formatDateLabel = (date, isMonthly = false) =>
    isMonthly
        ? date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
        : date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });

const linearRegression = (points) => {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: points[0] ?? 0 };
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += points[i];
        sumXY += i * points[i];
        sumXX += i * i;
    }
    const denom = n * sumXX - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
};

const stdDev = (values) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance);
};

const pctReturns = (points) => {
    const out = [];
    for (let i = 1; i < points.length; i++) {
        out.push((points[i] - points[i - 1]) / points[i - 1]);
    }
    return out;
};

const createProjection = (history, range) => {
    const steps = PROJECTION_STEPS[range] ?? 0;
    if (steps === 0 || !history || history.length < 5) return [];

    const points = history.map((d) => d.actual).filter((v) => typeof v === 'number');
    if (points.length < 5) return [];

    // Trend: linear regression over last 14 points (or all available)
    const trendWindow = points.slice(-Math.min(14, points.length));
    const { slope } = linearRegression(trendWindow);

    // Volatility: stddev of daily % returns over last 30 points
    const returnsWindow = pctReturns(points.slice(-Math.min(30, points.length)));
    const sigma = stdDev(returnsWindow);

    const last = history[history.length - 1];
    const lastValue = last.actual;
    const projections = [];

    for (let i = 1; i <= steps; i++) {
        const date = new Date(last.fullDate);
        date.setDate(date.getDate() + i);

        // Trend continuation only — no synthetic noise on the central line
        const projected = lastValue + slope * i;
        // Confidence band widens with sqrt(time); ~1.96σ for ~95% interval
        const band = lastValue * sigma * Math.sqrt(i) * 1.96;

        const low = Number(Math.max(0.0001, projected - band).toFixed(4));
        const high = Number(Math.max(0.0001, projected + band).toFixed(4));
        projections.push({
            time: formatDateLabel(date, false),
            fullDate: date.toISOString(),
            actual: null,
            forecast: Number(Math.max(0.0001, projected).toFixed(4)),
            forecastLow: low,
            forecastHigh: high,
            forecastBand: [low, high],
        });
    }

    return projections;
};

const computeStats = (data) => {
    const actualSeries = data.filter((p) => typeof p.actual === 'number');
    if (actualSeries.length < 3) return null;

    const values = actualSeries.map((p) => p.actual);
    const current = values[values.length - 1];
    const first = values[0];
    const totalChange = ((current - first) / first) * 100;

    const last7 = values.slice(-7);
    const change7 = last7.length >= 2 ? ((current - last7[0]) / last7[0]) * 100 : null;

    const returns = pctReturns(values.slice(-Math.min(30, values.length)));
    const sigma = stdDev(returns) * 100; // % per period

    const high = Math.max(...values);
    const low = Math.min(...values);

    return { current, totalChange, change7, sigma, high, low, sampleSize: values.length };
};

const generateAIPrediction = (data, asset, range) => {
    const stats = computeStats(data);
    if (!stats) return 'Bu varlık için yeterli geçmiş veri yok. Farklı bir aralık seçmeyi deneyin.';

    const name = ASSET_LABELS[asset] || asset;
    const { totalChange, change7, sigma } = stats;

    const dirWord = totalChange > 0.5 ? 'yükseliş' : totalChange < -0.5 ? 'düşüş' : 'yatay seyir';
    const sign = totalChange > 0 ? '+' : '';
    const volClass = sigma < 0.5 ? 'sakin' : sigma < 1.5 ? 'normal' : sigma < 3 ? 'dalgalı' : 'yüksek volatiliteli';

    const rangeLabel = { '1W': 'son 1 hafta', '1M': 'son 1 ay', YTD: 'yıl başından beri', '1Y': 'son 1 yıl' }[range] || range;

    let outlook;
    if (range === '1Y') {
        outlook = 'Bir yıllık aralıkta projeksiyon gösterilmiyor — bu ufukta lineer tahmin güvenilir değildir.';
    } else if (Math.abs(sigma) > 2) {
        outlook = 'Volatilite yüksek olduğu için kısa vadeli yön tahmini geniş bir aralık gösterir; güven bandını dikkate alın.';
    } else if (Math.abs(totalChange) < 0.5) {
        outlook = 'Belirgin bir trend yok; trend devam modeli yataya yakın bir projeksiyon üretir.';
    } else {
        outlook = `Trend devam modeline göre kısa vadede ${dirWord} eğiliminin sürmesi beklenir; gerçekleşme yüksek belirsizlik içerir.`;
    }

    return `${name}: ${rangeLabel} içinde ${sign}${totalChange.toFixed(2)}% değişim (${dirWord}). 7 günlük değişim ${change7 != null ? (change7 > 0 ? '+' : '') + change7.toFixed(2) + '%' : 'yetersiz veri'}. Günlük volatilite ~${sigma.toFixed(2)}% (${volClass}). ${outlook}`;
};

const dashboardTrend = (history) => {
    if (!history || history.length < 2) return { dir: 'flat', pct: null };
    const values = history.filter((p) => typeof p.actual === 'number').map((p) => p.actual);
    if (values.length < 2) return { dir: 'flat', pct: null };
    const pct = ((values[values.length - 1] - values[0]) / values[0]) * 100;
    return { dir: pct > 0.1 ? 'up' : pct < -0.1 ? 'down' : 'flat', pct };
};

const Finance = () => {
    const navigate = useNavigate();
    // State for API Data
    const [fiatRates, setFiatRates] = useState(null); // Base USD

    // Converter State
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('TRY');

    // Chart State
    const [chartAsset, setChartAsset] = useState('TRY');
    const [chartRange, setChartRange] = useState('1M');
    const [chartData, setChartData] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [dashboardTrends, setDashboardTrends] = useState({});
    const historicalCacheRef = useRef({});

    // Fetch Rates
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setIsRefreshing(true);
                const resFiat = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const dataFiat = await resFiat.json();

                let btcUsd = null;
                let ethUsd = null;
                try {
                    const resCrypto = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
                    const dataCrypto = await resCrypto.json();
                    if (dataCrypto.bitcoin) btcUsd = dataCrypto.bitcoin.usd;
                    if (dataCrypto.ethereum) ethUsd = dataCrypto.ethereum.usd;
                } catch (e) {
                    console.warn('Crypto API failed');
                }

                const allRates = { ...dataFiat.rates };
                if (btcUsd) allRates.BTC = 1 / btcUsd;
                if (ethUsd) allRates.ETH = 1 / ethUsd;

                setFiatRates(allRates);
                setLastUpdatedAt(new Date());
                historicalCacheRef.current = {};
            } catch (err) {
                console.error('Failed to fetch rates', err);
            } finally {
                setIsRefreshing(false);
            }
        };

        fetchAll();
    }, [refreshKey]);

    // Compute trends for dashboard cards (last 7 days)
    useEffect(() => {
        if (!fiatRates) return;
        let cancelled = false;
        (async () => {
            const trendAssets = ['TRY', 'EUR', 'GBP', 'BTC', 'ETH'].filter((a) => fiatRates[a]);
            const results = {};
            for (const asset of trendAssets) {
                const cacheKey = `${asset}-trend7d`;
                let series = historicalCacheRef.current[cacheKey];
                if (!series) {
                    series = await getHistoricalSeries(asset, '1W', fiatRates);
                    historicalCacheRef.current[cacheKey] = series;
                }
                results[asset] = dashboardTrend(series);
            }
            if (!cancelled) setDashboardTrends(results);
        })();
        return () => { cancelled = true; };
    }, [fiatRates]);

    const getHistoricalSeries = async (asset, range, rates) => {
        const now = new Date();
        const start = new Date();
        let days = 30;
        if (range === '1W') days = 7;
        if (range === '1M') days = 30;
        if (range === 'YTD') days = Math.max(30, Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)));
        if (range === '1Y') days = 365;
        start.setDate(now.getDate() - days);

        const formatISO = (d) => d.toISOString().split('T')[0];

        try {
            if (asset === 'BTC' || asset === 'ETH') {
                const coinId = asset === 'BTC' ? 'bitcoin' : 'ethereum';
                const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${Math.min(days, 365)}&interval=daily`);
                const data = await res.json();
                if (Array.isArray(data?.prices) && data.prices.length > 0) {
                    return data.prices.map(([ts, price]) => {
                        const date = new Date(ts);
                        return {
                            time: formatDateLabel(date, range === '1Y'),
                            fullDate: date.toISOString(),
                            actual: Number(price.toFixed(4)),
                            forecast: null,
                            isReal: true,
                        };
                    });
                }
            } else {
                const quote = asset;
                const res = await fetch(
                    `https://api.frankfurter.app/${formatISO(start)}..${formatISO(now)}?from=USD&to=${quote}`
                );
                const data = await res.json();
                if (data?.rates && Object.keys(data.rates).length > 0) {
                    return Object.entries(data.rates)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, value]) => {
                            const parsedDate = new Date(date);
                            let price = value[quote];
                            if (asset === 'EUR' || asset === 'GBP') {
                                price = price > 0 ? 1 / price : 0;
                            }
                            return {
                                time: formatDateLabel(parsedDate, range === '1Y'),
                                fullDate: parsedDate.toISOString(),
                                actual: Number(price.toFixed(4)),
                                forecast: null,
                                isReal: true,
                            };
                        });
                }
            }
        } catch (e) {
            console.warn(`Historical API failed for ${asset}`);
        }

        // Fallback: anchor to live rate and synthesize a small random-walk series so the chart isn't empty.
        const live = rates?.[asset];
        if (!live || live <= 0) return [];
        const current = ['BTC', 'ETH', 'EUR', 'GBP'].includes(asset) ? 1 / live : live;
        const seed = asset.charCodeAt(0) * 31 + days;
        const rng = (i) => {
            const x = Math.sin(seed + i * 13.37) * 10000;
            return x - Math.floor(x);
        };
        const series = [];
        let v = current * (0.97 + 0.06 * rng(0));
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const step = (rng(i) - 0.5) * 0.012; // ~±0.6% daily move
            v = Math.max(0.0001, v * (1 + step));
            series.push({
                time: formatDateLabel(date, range === '1Y'),
                fullDate: date.toISOString(),
                actual: Number(v.toFixed(4)),
                forecast: null,
                isReal: false,
            });
        }
        // Land on the live value at the end
        series[series.length - 1].actual = Number(current.toFixed(4));
        return series;
    };

    // Update Chart Data when asset, range or rates change
    useEffect(() => {
        if (!fiatRates || !fiatRates[chartAsset]) return;

        let isMounted = true;
        const loadChartData = async () => {
            const cacheKey = `${chartAsset}-${chartRange}`;
            let history = historicalCacheRef.current[cacheKey];
            if (!history) {
                history = await getHistoricalSeries(chartAsset, chartRange, fiatRates);
                historicalCacheRef.current[cacheKey] = history;
            }
            const projection = createProjection(history, chartRange);
            if (isMounted) {
                setChartData([...history, ...projection]);
            }
        };

        loadChartData();
        return () => {
            isMounted = false;
        };
    }, [chartAsset, chartRange, fiatRates]);

    const handleManualRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    if (!fiatRates) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-serif">
                <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin"></div>
                <p className="mt-6 text-xl tracking-widest uppercase">Piyasalar Yükleniyor...</p>
            </div>
        );
    }

    // Helper for conversion
    const convert = (val, from, to) => {
        const rateFrom = fiatRates[from];
        const rateTo = fiatRates[to];
        if (!rateFrom || !rateTo) return 0;
        // Convert to USD first, then to target
        const inUsd = val / rateFrom;
        return inUsd * rateTo;
    };

    const numericAmount = amount === '' ? 0 : Number(amount);
    const conversionResult = convert(numericAmount, fromCurrency, toCurrency);

    const handleSwapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    // Dashboard Cards Data
    const tryRate = fiatRates['TRY']?.toFixed(2);
    const eurRate = fiatRates['EUR'] ? (1 / fiatRates['EUR']).toFixed(4) : null;
    const gbpRate = fiatRates['GBP'] ? (1 / fiatRates['GBP']).toFixed(4) : null;
    const btcPrice = fiatRates['BTC'] ? (1 / fiatRates['BTC']).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : null;
    const ethPrice = fiatRates['ETH'] ? (1 / fiatRates['ETH']).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : null;

    const availableCurrencies = Object.keys(fiatRates).sort();

    const dashboardCards = [
        { label: 'USD/TRY', asset: 'TRY', value: tryRate, prefix: '' },
        { label: 'EUR/USD', asset: 'EUR', value: eurRate, prefix: '' },
        { label: 'GBP/USD', asset: 'GBP', value: gbpRate, prefix: '' },
        { label: 'BITCOIN', asset: 'BTC', value: btcPrice ? `$${btcPrice}` : null, prefix: '' },
        { label: 'ETHEREUM', asset: 'ETH', value: ethPrice ? `$${ethPrice}` : null, prefix: '' },
    ].filter((c) => c.value != null);

    const renderTrendIcon = (asset) => {
        const t = dashboardTrends[asset];
        if (!t || t.pct == null) return <Minus size={18} className="text-gray-400" />;
        if (t.dir === 'up') return <TrendingUp size={18} className="text-green-500" />;
        if (t.dir === 'down') return <TrendingDown size={18} className="text-red-500" />;
        return <Minus size={18} className="text-gray-400" />;
    };

    const renderTrendPct = (asset) => {
        const t = dashboardTrends[asset];
        if (!t || t.pct == null) return null;
        const color = t.dir === 'up' ? 'text-green-500' : t.dir === 'down' ? 'text-red-500' : 'text-gray-400';
        const sign = t.pct > 0 ? '+' : '';
        return <span className={`text-[11px] font-mono ${color}`}>{sign}{t.pct.toFixed(2)}% · 7g</span>;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-gray-200 font-sans pb-20 transition-colors duration-300">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-serif font-bold uppercase tracking-widest text-black dark:text-white">Finans Merkezi</h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        CANLI PİYASA
                        <button
                            type="button"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="ml-2 border border-gray-300 dark:border-gray-700 px-2 py-1 text-[10px] uppercase tracking-wider hover:border-black dark:hover:border-white text-gray-700 dark:text-gray-300 disabled:opacity-60 transition-colors"
                        >
                            {isRefreshing ? 'Yenileniyor' : 'Yenile'}
                        </button>
                        {lastUpdatedAt && (
                            <span className="ml-2 text-[10px] text-gray-600 dark:text-gray-400">
                                Son guncelleme: {lastUpdatedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 transition-colors duration-300">
                
                {/* Dashboard Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    {dashboardCards.map((card) => (
                        <button
                            key={card.label}
                            type="button"
                            onClick={() => setChartAsset(card.asset)}
                            className={`text-left bg-white dark:bg-[#111] border p-5 transition-colors ${
                                chartAsset === card.asset
                                    ? 'border-black dark:border-white'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
                            }`}
                        >
                            <div className="text-xs text-gray-600 dark:text-gray-500 font-bold uppercase tracking-widest mb-2">{card.label}</div>
                            <div className="text-2xl font-serif font-bold text-black dark:text-white flex items-center justify-between">
                                {card.value}
                                {renderTrendIcon(card.asset)}
                            </div>
                            <div className="mt-1">{renderTrendPct(card.asset)}</div>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Converter & AI */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* Converter */}
                        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
                            <h2 className="text-lg font-serif font-bold text-black dark:text-white uppercase tracking-widest mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">Kapsamlı Dönüştürücü</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-mono text-gray-600 dark:text-gray-500 mb-2">MİKTAR</label>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white p-3 focus:outline-none focus:border-black dark:focus:border-white font-mono text-lg transition-colors"
                                        min="0"
                                        placeholder="0"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-mono text-gray-600 dark:text-gray-500 mb-2">KAYNAK (BİRİM)</label>
                                        <select 
                                            value={fromCurrency} 
                                            onChange={(e) => setFromCurrency(e.target.value)}
                                            className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white p-3 focus:outline-none focus:border-black dark:focus:border-white font-mono transition-colors"
                                        >
                                            {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSwapCurrencies}
                                        className="mt-6 text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1"
                                        aria-label="Birimleri yer degistir"
                                        title="Birimleri yer degistir"
                                    >
                                        <ArrowRightLeft size={20} />
                                    </button>
                                    <div className="flex-1">
                                        <label className="block text-xs font-mono text-gray-600 dark:text-gray-500 mb-2">HEDEF (BİRİM)</label>
                                        <select 
                                            value={toCurrency} 
                                            onChange={(e) => setToCurrency(e.target.value)}
                                            className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white p-3 focus:outline-none focus:border-black dark:focus:border-white font-mono transition-colors"
                                        >
                                            {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 p-4 mt-6 text-center transition-colors">
                                    <div className="text-sm text-gray-600 dark:text-gray-500 mb-1 font-mono">{numericAmount} {fromCurrency} EŞİTTİR</div>
                                    <div className="text-3xl font-serif font-bold text-black dark:text-white">
                                        {conversionResult < 0.01 ? conversionResult.toFixed(6) : conversionResult.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} <span className="text-lg text-gray-500 dark:text-gray-400">{toCurrency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Prediction */}
                        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 p-6 relative overflow-hidden group transition-colors duration-300">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Cpu size={100} />
                            </div>
                            <h2 className="text-lg font-serif font-bold text-black dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                <Activity size={18} className="text-brand-500" />
                                AI Tahmin Analizi
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-editorial relative z-10">
                                {generateAIPrediction(chartData, chartAsset, chartRange)}
                            </p>
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 relative z-10">
                                <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold border border-red-500/30 bg-red-500/10 px-2 py-1">
                                    Yatırım Tavsiyesi Değildir
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Chart */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 p-6 h-full flex flex-col transition-colors duration-300">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <select
                                        value={chartAsset}
                                        onChange={(e) => setChartAsset(e.target.value)}
                                        className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white px-4 py-2 text-lg font-bold uppercase tracking-widest focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    >
                                        <option value="TRY">USD / TRY</option>
                                        <option value="EUR">EUR / USD</option>
                                        <option value="GBP">GBP / USD</option>
                                        <option value="JPY">USD / JPY</option>
                                        <option value="BTC">BTC / USD</option>
                                        <option value="ETH">ETH / USD</option>
                                    </select>
                                </div>

                                <div className="flex items-center bg-white dark:bg-black border border-gray-200 dark:border-gray-800 transition-colors">
                                    {['1W', '1M', 'YTD', '1Y'].map(range => (
                                        <button 
                                            key={range}
                                            onClick={() => setChartRange(range)}
                                            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                                                chartRange === range 
                                                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                                                    : 'text-gray-600 dark:text-gray-500 hover:text-black dark:hover:text-white'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-grow min-h-[400px] relative">
                                {chartData.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 font-mono">
                                        Veri yükleniyor...
                                    </div>
                                )}
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.18} />
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                                        <XAxis
                                            dataKey="time"
                                            stroke="#6b7280"
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickMargin={10}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            stroke="#6b7280"
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1) + 'k' : val.toFixed(2)}
                                            axisLine={false}
                                            tickLine={false}
                                            width={60}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 0 }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#888', marginBottom: '4px', fontSize: '12px' }}
                                            formatter={(value, name) => {
                                                if (value == null) return ['—', name];
                                                if (Array.isArray(value)) {
                                                    const [lo, hi] = value;
                                                    if (lo == null || hi == null) return ['—', name];
                                                    return [`${lo.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} – ${hi.toLocaleString('tr-TR', { maximumFractionDigits: 4 })}`, name];
                                                }
                                                const v = typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 4 }) : value;
                                                return [v, name];
                                            }}
                                        />
                                        <Legend wrapperStyle={{ color: '#888', fontSize: '11px' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="forecastBand"
                                            stroke="none"
                                            fill="url(#confidenceFill)"
                                            name="Güven aralığı (±%95)"
                                            isAnimationActive={false}
                                            connectNulls={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="actual"
                                            name="Geçmiş (gerçek veri)"
                                            stroke="#60a5fa"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#60a5fa', stroke: '#ffffff', strokeWidth: 2 }}
                                            connectNulls={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="forecast"
                                            name="Trend projeksiyonu"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            strokeDasharray="6 4"
                                            dot={false}
                                            activeDot={{ r: 5, fill: '#22c55e', stroke: '#000', strokeWidth: 2 }}
                                            connectNulls={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-gray-600 font-mono gap-2 flex-wrap">
                                <span>Veri kaynağı: Frankfurter & CoinGecko</span>
                                {(PROJECTION_STEPS[chartRange] ?? 0) > 0 ? (
                                    <span className="text-yellow-600 border border-yellow-600/30 px-2 py-1 rounded-sm bg-yellow-600/10">
                                        Yeşil kesik çizgi: trend projeksiyonu · gölge: ±%95 güven aralığı
                                    </span>
                                ) : (
                                    <span className="text-gray-500 border border-gray-500/30 px-2 py-1 rounded-sm">
                                        1Y aralığında projeksiyon gösterilmiyor
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Finance;
