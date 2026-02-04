import React from 'react';
import { OptionCard } from './OptionCard';

export function TrackColumn({ title, trackId, options, currentOption, onVote }) {
    return (
        <div className="flex flex-col gap-4 min-w-[250px] flex-1">
            <h2 className="text-xl font-bold text-white/80 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">
                {title}
            </h2>
            <div className="flex flex-col gap-3">
                {options.map((opt) => (
                    <OptionCard
                        key={opt.id}
                        label={opt.name}
                        isSelected={false} // Todo: local selection state?
                        isWinning={currentOption === opt.id}
                        onVote={() => onVote(trackId, opt.id)}
                    />
                ))}
            </div>
        </div>
    );
}
