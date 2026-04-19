import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CurrencyTicker = () => {
    const [rates, setRates] = useState(null);
    const [goldPrice, setGoldPrice] = useState(null);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await res.json();
                if (data && data.rates) {
                    setRates(data.rates);
                }
            } catch (err) {
                console.error('Currency fetch error:', err);
            }
        };

        // Fetch gold price from a free API
        const fetchGold = async () => {
            try {
                const res = await fetch('https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies=XAU');
                const data = await res.json();
                if (data && data.rates && data.rates.XAU) {
                    setGoldPrice((1 / data.rates.XAU).toFixed(2));
                }
            } catch (err) {
                // Gold API might fail with demo key, use approximate
                setGoldPrice('2.350');
            }
        };

        fetchRates();
        fetchGold();
    }, []);

    if (!rates) return null;

    const usdTry = rates.TRY?.toFixed(2);
    const eurTry = (rates.TRY / rates.EUR)?.toFixed(2);
    const gbpTry = (rates.TRY / rates.GBP)?.toFixed(2);

    const items = [
        { label: 'USD/TRY', value: usdTry, icon: <TrendingUp size={12} /> },
        { label: 'EUR/TRY', value: eurTry, icon: <TrendingUp size={12} /> },
        { label: 'GBP/TRY', value: gbpTry, icon: <TrendingDown size={12} /> },
        { label: 'ALTIN (USD)', value: `$${goldPrice || '—'}`, icon: <TrendingUp size={12} /> },
    ];

    return (
        <div className="bg-black text-white dark:bg-white dark:text-black overflow-hidden">
            <div className="ticker-wrap">
                <div className="ticker-content flex animate-ticker">
                    {[...items, ...items, ...items].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-6 py-1.5 whitespace-nowrap text-xs font-mono tracking-wide">
                            <span className="font-bold">{item.label}</span>
                            <span className="opacity-80">{item.value}</span>
                            <span className="opacity-60">{item.icon}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CurrencyTicker;
