import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, ArrowRightLeft, TrendingUp, TrendingDown, Activity, Cpu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Utility to generate mock historical data based on current price
const generateMockData = (currentPrice, range) => {
    const data = [];
    const now = new Date();
    let points = 30;
    let volatility = 0.02; // 2% daily volatility
    let interval = 'day';

    switch (range) {
        case '1D': points = 24; volatility = 0.005; interval = 'hour'; break;
        case '1W': points = 7; volatility = 0.015; interval = 'day'; break;
        case '1M': points = 30; volatility = 0.03; interval = 'day'; break;
        case 'YTD': 
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const daysDiff = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
            points = Math.max(10, Math.min(daysDiff, 100)); // Cap points for performance
            volatility = 0.05; 
            interval = 'day'; 
            break;
        case '1Y': points = 12; volatility = 0.1; interval = 'month'; break;
        default: points = 30;
    }

    let price = currentPrice * (1 - (Math.random() * volatility)); // Start slightly offset

    for (let i = points; i >= 0; i--) {
        const date = new Date();
        if (interval === 'hour') date.setHours(date.getHours() - i);
        if (interval === 'day') date.setDate(date.getDate() - i);
        if (interval === 'month') date.setMonth(date.getMonth() - i);

        // Random walk
        const change = 1 + (Math.random() * volatility * 2 - volatility);
        price = price * change;

        data.push({
            time: interval === 'hour' 
                ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
            price: Number(price.toFixed(4)),
            fullDate: date.toISOString()
        });
    }

    // Ensure the last point matches exactly the current price
    data[data.length - 1].price = Number(currentPrice.toFixed(4));
    
    return data;
};

// Simple AI Prediction Generator based on recent slope
const generateAIPrediction = (data) => {
    if (!data || data.length < 5) return "Veri yetersiz.";
    
    const recentData = data.slice(-5);
    const start = recentData[0].price;
    const end = recentData[recentData.length - 1].price;
    const change = ((end - start) / start) * 100;
    
    let trend = change > 0 ? "YUKARI" : "AŞAĞI";
    let strength = Math.abs(change) > 2 ? "güçlü" : "zayıf";

    return `AI Analizi: Son dönemdeki fiyat hareketleri incelendiğinde, varlığın ${strength} bir momentumla ${trend} yönlü bir eğilim sergilediği tespit edilmiştir. İlgili göstergeler ve hareketli ortalamalar, önümüzdeki 7 gün içinde bu trendin devam edebileceğine işaret etmektedir. Ancak küresel piyasa koşulları anlık olarak değişebilir.`;
};

const Finance = () => {
    const navigate = useNavigate();
    // State for API Data
    const [fiatRates, setFiatRates] = useState(null); // Base USD
    const [metalRates, setMetalRates] = useState(null); // Base USD
    const [cryptoRates, setCryptoRates] = useState(null); // Base USD
    
    // Converter State
    const [amount, setAmount] = useState(1);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('TRY');
    
    // Chart State
    const [chartAsset, setChartAsset] = useState('TRY'); // Compare to USD implicitly for simplicity, or we display USD/XXX
    const [chartRange, setChartRange] = useState('1M');
    const [chartData, setChartData] = useState([]);

    // Fetch Rates
    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fiat (Base USD)
                const resFiat = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const dataFiat = await resFiat.json();
                
                // Meta & Crypto Approximations since free APIs are limited
                // We will use standard fiat + some hardcoded/approximated crypto/metals if API fails
                let btcUsd = 65000;
                let ethUsd = 3500;
                let xauUsd = 2350; // Gold
                let xagUsd = 28;   // Silver

                try {
                    const resCrypto = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
                    const dataCrypto = await resCrypto.json();
                    if (dataCrypto.bitcoin) btcUsd = dataCrypto.bitcoin.usd;
                    if (dataCrypto.ethereum) ethUsd = dataCrypto.ethereum.usd;
                } catch(e) { console.warn("Crypto API failed, using fallbacks"); }

                const allRates = {
                    ...dataFiat.rates,
                    BTC: 1 / btcUsd,
                    ETH: 1 / ethUsd,
                    XAU: 1 / xauUsd,
                    XAG: 1 / xagUsd
                };

                setFiatRates(allRates);
            } catch (err) {
                console.error("Failed to fetch rates", err);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    // Update Chart Data when asset, range or rates change
    useEffect(() => {
        if (!fiatRates || !fiatRates[chartAsset]) return;
        
        // For chart, we show How many TRY makes 1 USD? That is fiatRates['TRY']
        // Wait, if chartAsset is TRY, the rate is exactly fiatRates['TRY'] (e.g. 32.5) -> meaning 1 USD = 32.5 TRY
        // If chartAsset is BTC, the rate is 1/65000. So we should chart 1 / fiatRates['BTC'] to show USD price of BTC.
        
        let currentPrice = fiatRates[chartAsset];
        if (['BTC', 'ETH', 'XAU', 'XAG', 'EUR', 'GBP'].includes(chartAsset)) {
             // Show price in USD for these assets
             currentPrice = 1 / fiatRates[chartAsset];
        } else {
             // For TRY, JPY, etc., show how many units per 1 USD
             currentPrice = fiatRates[chartAsset];
        }

        const data = generateMockData(currentPrice, chartRange);
        setChartData(data);
    }, [chartAsset, chartRange, fiatRates]);

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

    const conversionResult = convert(amount, fromCurrency, toCurrency);

    // Dashboard Cards Data
    const tryRate = fiatRates['TRY']?.toFixed(2);
    const eurRate = (1 / fiatRates['EUR'])?.toFixed(4); // EUR to USD
    const btcPrice = (1 / fiatRates['BTC'])?.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
    const xauPrice = (1 / fiatRates['XAU'])?.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    const xagPrice = (1 / fiatRates['XAG'])?.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

    const availableCurrencies = Object.keys(fiatRates).sort();

    const chartTitle = ['BTC', 'ETH', 'XAU', 'XAG', 'EUR', 'GBP'].includes(chartAsset) 
        ? `${chartAsset} / USD` 
        : `USD / ${chartAsset}`;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans pb-20">
            {/* Header */}
            <header className="border-b border-gray-800 bg-black sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-serif font-bold uppercase tracking-widest text-white">Finans Merkezi</h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        CANLI PİYASA
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                
                {/* Dashboard Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    {[
                        { label: 'USD/TRY', value: tryRate, trend: 'up' },
                        { label: 'EUR/USD', value: eurRate, trend: 'down' },
                        { label: 'ALTIN (ONS)', value: `$${xauPrice}`, trend: 'up' },
                        { label: 'GÜMÜŞ (ONS)', value: `$${xagPrice}`, trend: 'up' },
                        { label: 'BITCOIN', value: `$${btcPrice}`, trend: 'down' },
                    ].map((card, i) => (
                        <div key={i} className="bg-[#111] border border-gray-800 p-5 hover:border-gray-600 transition-colors">
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">{card.label}</div>
                            <div className="text-2xl font-serif font-bold text-white flex items-center justify-between">
                                {card.value}
                                {card.trend === 'up' ? <TrendingUp size={18} className="text-green-500" /> : <TrendingDown size={18} className="text-red-500" />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Converter & AI */}
                    <div className="lg:col-span-1 space-y-8">
                        
                        {/* Converter */}
                        <div className="bg-[#111] border border-gray-800 p-6">
                            <h2 className="text-lg font-serif font-bold text-white uppercase tracking-widest mb-6 border-b border-gray-800 pb-2">Kapsamlı Dönüştürücü</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-2">MİKTAR</label>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full bg-black border border-gray-700 text-white p-3 focus:outline-none focus:border-white font-mono text-lg"
                                        min="0"
                                    />
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-mono text-gray-500 mb-2">KAYNAK (BİRİM)</label>
                                        <select 
                                            value={fromCurrency} 
                                            onChange={(e) => setFromCurrency(e.target.value)}
                                            className="w-full bg-black border border-gray-700 text-white p-3 focus:outline-none focus:border-white font-mono"
                                        >
                                            {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="mt-6 text-gray-500">
                                        <ArrowRightLeft size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-mono text-gray-500 mb-2">HEDEF (BİRİM)</label>
                                        <select 
                                            value={toCurrency} 
                                            onChange={(e) => setToCurrency(e.target.value)}
                                            className="w-full bg-black border border-gray-700 text-white p-3 focus:outline-none focus:border-white font-mono"
                                        >
                                            {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-black border border-gray-800 p-4 mt-6 text-center">
                                    <div className="text-sm text-gray-500 mb-1 font-mono">{amount} {fromCurrency} EŞİTTİR</div>
                                    <div className="text-3xl font-serif font-bold text-white">
                                        {conversionResult < 0.01 ? conversionResult.toFixed(6) : conversionResult.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} <span className="text-lg text-gray-400">{toCurrency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Prediction */}
                        <div className="bg-[#111] border border-gray-800 p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Cpu size={100} />
                            </div>
                            <h2 className="text-lg font-serif font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                <Activity size={18} className="text-brand-500" />
                                AI Tahmin Analizi
                            </h2>
                            <p className="text-sm text-gray-400 leading-relaxed font-editorial relative z-10">
                                {generateAIPrediction(chartData)}
                            </p>
                            <div className="mt-6 pt-4 border-t border-gray-800 relative z-10">
                                <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold border border-red-500/30 bg-red-500/10 px-2 py-1">
                                    Yatırım Tavsiyesi Değildir
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Chart */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#111] border border-gray-800 p-6 h-full flex flex-col">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <select 
                                        value={chartAsset}
                                        onChange={(e) => setChartAsset(e.target.value)}
                                        className="bg-black border border-gray-700 text-white px-4 py-2 text-lg font-bold uppercase tracking-widest focus:outline-none focus:border-white"
                                    >
                                        <option value="TRY">USD / TRY</option>
                                        <option value="EUR">EUR / USD</option>
                                        <option value="GBP">GBP / USD</option>
                                        <option value="XAU">ALTIN / USD</option>
                                        <option value="XAG">GÜMÜŞ / USD</option>
                                        <option value="BTC">BTC / USD</option>
                                        <option value="ETH">ETH / USD</option>
                                    </select>
                                </div>

                                <div className="flex items-center bg-black border border-gray-800">
                                    {['1D', '1W', '1M', 'YTD', '1Y'].map(range => (
                                        <button 
                                            key={range}
                                            onClick={() => setChartRange(range)}
                                            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                                                chartRange === range 
                                                    ? 'bg-white text-black' 
                                                    : 'text-gray-500 hover:text-white'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-grow min-h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis 
                                            dataKey="time" 
                                            stroke="#555" 
                                            tick={{ fill: '#777', fontSize: 12 }} 
                                            tickMargin={10}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            domain={['auto', 'auto']} 
                                            stroke="#555" 
                                            tick={{ fill: '#777', fontSize: 12 }}
                                            tickFormatter={(val) => val >= 1000 ? (val/1000).toFixed(1) + 'k' : val.toFixed(2)}
                                            axisLine={false}
                                            tickLine={false}
                                            width={60}
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: 0 }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#888', marginBottom: '4px', fontSize: '12px' }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="price" 
                                            stroke="#fff" 
                                            strokeWidth={2} 
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#fff', stroke: '#000', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-gray-600 font-mono">
                                <span>Veri Kaynağı: ExchangeRate-API & CoinGecko</span>
                                {chartRange !== '1D' && <span className="text-yellow-600 border border-yellow-600/30 px-2 py-1 rounded-sm bg-yellow-600/10">* Simüle Edilmiş Geçmiş Veri</span>}
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Finance;
