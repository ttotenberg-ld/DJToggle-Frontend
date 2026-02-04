import React, { useEffect, useState } from 'react';
import { withLDProvider, useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { useStrudel } from './hooks/useStrudel';
import { TrackColumn } from './components/TrackColumn';
import { Controls } from './components/Controls';
import { PATTERNS } from './audio/patterns';
import { cn } from './lib/utils';

const TRACKS = [
  { id: 'bass', title: 'Bass', options: [{ id: 'option1', name: 'Deep Pulse' }, { id: 'option2', name: 'Driving Saw' }, { id: 'option3', name: 'Funky Square' }] },
  { id: 'drums', title: 'Drums', options: [{ id: 'option1', name: 'Basic 4/4' }, { id: 'option2', name: 'Breakbeat' }, { id: 'option3', name: 'Double Time' }] },
  { id: 'harmony', title: 'Harmony', options: [{ id: 'option1', name: 'Warm Pad' }, { id: 'option2', name: 'Stabs' }, { id: 'option3', name: 'Arpeggio' }] },
  { id: 'melody', title: 'Melody', options: [{ id: 'option1', name: 'Main Theme' }, { id: 'option2', name: 'Counterpoint' }, { id: 'option3', name: 'Minimal' }] },
];

function App() {
  const flags = useFlags();
  const ldClient = useLDClient();
  const { isPlaying, togglePlay, updatePattern } = useStrudel();

  // Local state to track what user voted for (optional visual feedback)
  const [userVotes, setUserVotes] = useState({});

  useEffect(() => {
    // Construct the combined pattern based on active flags
    try {
      // Default to option1 if flag is missing/invalid
      const bass = PATTERNS.bass[flags.bass] || PATTERNS.bass.option1;
      const drums = PATTERNS.drums[flags.drums] || PATTERNS.drums.option1;
      const harmony = PATTERNS.harmony[flags.harmony] || PATTERNS.harmony.option1;
      const melody = PATTERNS.melody[flags.melody] || PATTERNS.melody.option1;

      // Stack the patterns
      const combinedPattern = `stack(
        ${bass},
        ${drums},
        ${harmony},
        ${melody}
      )`;

      updatePattern(combinedPattern);
    } catch (e) {
      console.error("Error constructing pattern:", e);
    }
  }, [flags, updatePattern]);

  const handleVote = (trackId, optionId) => {
    console.log(`Voting for ${trackId}: ${optionId}`);

    // Send metric to LaunchDarkly
    // Metric key is 'vote', with custom attributes
    ldClient.track('vote', { track: trackId, option: optionId });

    setUserVotes(prev => ({ ...prev, [trackId]: optionId }));

    // Optional: Visual flair for valid processing
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-black z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      {/* Header */}
      <div className="z-10 text-center mb-12">
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-2xl mb-4">
          DJ TOGGLE
        </h1>
        <p className="text-xl text-white/50 font-light tracking-widest uppercase">
          Live Audience Mixing
        </p>
      </div>

      {/* Main Grid */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mb-12">
        {TRACKS.map(track => (
          <TrackColumn
            key={track.id}
            title={track.title}
            trackId={track.id}
            options={track.options}
            currentOption={flags[track.id] || 'option1'} // Use flag value as source of truth for "Winning"
            onVote={handleVote}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="z-10 mt-auto mb-8">
        <Controls isPlaying={isPlaying} onToggle={togglePlay} />
      </div>

      {/* Footer / Status */}
      <div className="z-10 text-white/30 text-sm font-mono">
        Connected to LaunchDarkly • {Object.keys(flags).length} Flags Active
      </div>
    </div>
  );
}

export default withLDProvider({
  clientSideID: import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID,
  options: {
    bootstrap: 'localStorage',
  },
})(App);
