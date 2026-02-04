import React from 'react';
import { Play, Pause } from 'lucide-react';

export function Controls({ isPlaying, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-primary hover:bg-primary/80 text-white transition-all shadow-lg hover:scale-105 active:scale-95"
        >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>
    );
}
