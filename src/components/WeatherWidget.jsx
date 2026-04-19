import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Snowflake, Wind, MapPin } from 'lucide-react';

const WEATHER_ICONS = {
    'Clear': Sun,
    'Clouds': Cloud,
    'Rain': CloudRain,
    'Drizzle': CloudRain,
    'Snow': Snowflake,
    'default': Wind
};

const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                // Using OpenWeatherMap free tier
                const API_KEY = '284e0d3bc6065e36e226a8e89c74e8d0'; // Free demo key
                const res = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=tr&appid=${API_KEY}`
                );
                const data = await res.json();
                if (data && data.main) {
                    setWeather({
                        temp: Math.round(data.main.temp),
                        desc: data.weather[0]?.description || '',
                        main: data.weather[0]?.main || 'default',
                        city: data.name || 'Konum'
                    });
                }
            } catch (err) {
                setError(true);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => {
                    // Default to Istanbul if location denied
                    fetchWeather(41.0082, 28.9784);
                }
            );
        } else {
            fetchWeather(41.0082, 28.9784);
        }
    }, []);

    if (error || !weather) return null;

    const IconComponent = WEATHER_ICONS[weather.main] || WEATHER_ICONS['default'];

    return (
        <div className="flex items-center gap-2 text-xs font-mono text-black dark:text-white">
            <MapPin size={12} className="opacity-50" />
            <span className="font-bold">{weather.city}</span>
            <IconComponent size={14} />
            <span>{weather.temp}°C</span>
            <span className="hidden sm:inline opacity-60 capitalize">{weather.desc}</span>
        </div>
    );
};

export default WeatherWidget;
