import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
    return (
        <div className="relative w-full max-w-2xl mx-auto mb-10">
            <div className="flex items-center border-2 border-black dark:border-white bg-transparent">
                <Search size={18} className="ml-4 text-gray-400 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Haberlerde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent text-black dark:text-white placeholder-gray-400 font-editorial text-sm focus:outline-none"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="mr-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
            {searchQuery && (
                <p className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-widest">
                    "{searchQuery}" için aranıyor...
                </p>
            )}
        </div>
    );
};

export default SearchBar;
