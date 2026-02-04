import React from 'react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export function OptionCard({ label, isSelected, isWinning, onVote, votes }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onVote}
            className={cn(
                "relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden group",
                "backdrop-blur-md",
                isSelected
                    ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(109,40,217,0.3)]"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
                isWinning && "ring-2 ring-accent ring-offset-2 ring-offset-black"
            )}
        >
            <div className="flex justify-between items-center z-10 relative">
                <span className="font-medium text-white/90">{label}</span>
                {isWinning && (
                    <span className="text-xs bg-accent text-black px-2 py-0.5 rounded-full font-bold">
                        LIVE
                    </span>
                )}
            </div>

            {/* Vote count indication (optional visualization) */}
            <div className="absolute bottom-0 left-0 h-1 bg-primary/50 transition-all duration-500" style={{ width: `${votes}%` }} />
        </motion.div>
    );
}
