import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap, TrendingUp, BarChart3, Search } from 'lucide-react';

const Sports = () => {
    const navigate = useNavigate();
    const [teamA, setTeamA] = useState('Galatasaray');
    const [teamB, setTeamB] = useState('Fenerbahçe');
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [liveMatches, setLiveMatches] = useState([]);
    const [isLoadingLiveScores, setIsLoadingLiveScores] = useState(true);
    const [liveScoresError, setLiveScoresError] = useState('');

    const fallbackMatches = useMemo(
        () => [
            { idEvent: 'fallback-1', strLeague: 'UEFA Champions League', strHomeTeam: 'Man City', strAwayTeam: 'Real Madrid', intHomeScore: '?', intAwayScore: '?', strStatus: 'Yakında' },
            { idEvent: 'fallback-2', strLeague: 'UEFA Champions League', strHomeTeam: 'Bayern', strAwayTeam: 'Arsenal', intHomeScore: '?', intAwayScore: '?', strStatus: 'Yakında' },
            { idEvent: 'fallback-3', strLeague: 'UEFA Europa League', strHomeTeam: 'Dortmund', strAwayTeam: 'PSG', intHomeScore: '?', intAwayScore: '?', strStatus: 'Yakında' }
        ],
        []
    );

    useEffect(() => {
        let isMounted = true;

        const fetchLiveScores = async () => {
            setIsLoadingLiveScores(true);
            setLiveScoresError('');

            try {
                const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/livescore.php?s=Soccer');
                if (!response.ok) {
                    throw new Error('Canli skor verisine ulasilamadi.');
                }

                const data = await response.json();
                const events = Array.isArray(data?.events) ? data.events : [];

                if (isMounted) {
                    setLiveMatches(events);
                    if (events.length === 0) {
                        setLiveScoresError('Su anda canli mac bulunamadi, varsayilan fikstur gosteriliyor.');
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setLiveScoresError('Canli skor servisine baglanilamadi, varsayilan fikstur gosteriliyor.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingLiveScores(false);
                }
            }
        };

        fetchLiveScores();
        const intervalId = setInterval(fetchLiveScores, 60000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const homeProb = Math.floor(Math.random() * 40 + 30);
            const drawProb = Math.floor(Math.random() * 20 + 10);
            const awayProb = 100 - homeProb - drawProb;
            
            setAnalysis({
                homeProb,
                drawProb,
                awayProb,
                comment: `${teamA} son maçlardaki hücum hattı performansı ile %${homeProb} favori görünüyor. Ancak ${teamB} deplasman savunmasında oldukça disiplinli.`
            });
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans pb-20">
            <header className="border-b border-gray-900 bg-black">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-serif font-bold uppercase tracking-widest text-white">Spor Merkezi</h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        GERÇEK ZAMANLI VERİ
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Live Scores Widget (Real Data) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg overflow-hidden h-[800px]">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/50">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                                <Trophy size={14} className="text-brand-500" /> CANLI SKORLAR (DÜNYA GENELİ)
                            </div>
                        </div>
                        <div className="h-[calc(100%-49px)] overflow-y-auto p-4 space-y-3">
                            {isLoadingLiveScores && (
                                <div className="text-xs text-gray-500 font-mono animate-pulse">Canli skorlar yukleniyor...</div>
                            )}

                            {!isLoadingLiveScores && liveScoresError && (
                                <div className="text-[11px] text-amber-400 border border-amber-700/40 bg-amber-900/10 rounded px-3 py-2">
                                    {liveScoresError}
                                </div>
                            )}

                            {!isLoadingLiveScores && (liveMatches.length > 0 ? liveMatches : fallbackMatches).map((match) => (
                                <div key={match.idEvent} className="border border-gray-800 rounded-md bg-black/40 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                            {match.strLeague || 'Dunya Futbolu'}
                                        </span>
                                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wide">
                                            {match.strStatus || 'Canli'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-semibold">
                                        <span>{match.strHomeTeam}</span>
                                        <span className="font-mono text-white">
                                            {match.intHomeScore ?? '?'} - {match.intAwayScore ?? '?'}
                                        </span>
                                        <span>{match.strAwayTeam}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Win Predictor Section */}
                <div className="space-y-6">
                    <div className="bg-[#0f0f0f] border border-gray-800 p-6 rounded-lg">
                        <div className="flex items-center gap-2 text-brand-500 font-bold uppercase tracking-tighter mb-6">
                            <Zap size={20} /> AI MAÇ TAHMİNİ
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Ev Sahibi Takım</label>
                                <input 
                                    type="text" 
                                    value={teamA}
                                    onChange={(e) => setTeamA(e.target.value)}
                                    className="w-full bg-black border border-gray-800 p-3 rounded text-sm focus:border-brand-500 outline-none transition-colors"
                                    placeholder="Takım adı girin..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Deplasman Takım</label>
                                <input 
                                    type="text" 
                                    value={teamB}
                                    onChange={(e) => setTeamB(e.target.value)}
                                    className="w-full bg-black border border-gray-800 p-3 rounded text-sm focus:border-brand-500 outline-none transition-colors"
                                    placeholder="Takım adı girin..."
                                />
                            </div>
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ANALİZ EDİLİYOR...
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 size={16} /> ANALİZ ET
                                    </>
                                )}
                            </button>
                        </div>

                        {analysis && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4">
                                    <div className="relative h-8 w-full flex overflow-hidden rounded-md border border-gray-800">
                                        <div style={{ width: `${analysis.homeProb}%` }} className="h-full bg-brand-600 flex items-center justify-center text-[10px] font-black text-white">
                                            {analysis.homeProb}%
                                        </div>
                                        <div style={{ width: `${analysis.drawProb}%` }} className="h-full bg-gray-700 flex items-center justify-center text-[10px] font-black text-white">
                                            {analysis.drawProb}%
                                        </div>
                                        <div style={{ width: `${analysis.awayProb}%` }} className="h-full bg-gray-500 flex items-center justify-center text-[10px] font-black text-white">
                                            {analysis.awayProb}%
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-mono font-bold text-gray-500">
                                        <span>{teamA.toUpperCase()}</span>
                                        <span>BERABERLİK</span>
                                        <span>{teamB.toUpperCase()}</span>
                                    </div>
                                    <div className="p-4 bg-brand-900/10 border border-brand-900/30 rounded">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp size={14} className="text-brand-500" />
                                            <span className="text-xs font-bold text-brand-500 uppercase">AI YORUMU</span>
                                        </div>
                                        <p className="text-xs text-gray-400 italic leading-relaxed">
                                            "{analysis.comment}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Günün Önemli Karşılaşmaları</h4>
                        <div className="space-y-4">
                            {[
                                { t1: 'Man City', t2: 'Real Madrid', time: '22:00' },
                                { t1: 'Bayern', t2: 'Arsenal', time: '22:00' },
                                { t1: 'Dortmund', t2: 'PSG', time: '21:45' }
                            ].map((m, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-gray-800 pb-2">
                                    <span className="text-xs font-medium">{m.t1} - {m.t2}</span>
                                    <span className="text-[10px] font-mono text-brand-500">{m.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Sports;
