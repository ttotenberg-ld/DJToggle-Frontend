import React, { useEffect, useState } from 'react';
import { withLDProvider, useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { useStrudel } from './hooks/useStrudel';
import { TrackColumn } from './components/TrackColumn';
import { Controls } from './components/Controls';
import { PATTERNS } from './audio/patterns';
import { cn } from './lib/utils';
import djAstronaut from './assets/DJToggle.png';

// Initial fallback tracks (minimal structure)
const FALLBACK_TRACKS = [
  { id: 'bass', title: 'Bass', options: [{ id: 'option1', name: 'Option 1' }, { id: 'option2', name: 'Option 2' }, { id: 'option3', name: 'Option 3' }] },
  { id: 'drums', title: 'Drums', options: [{ id: 'option1', name: 'Option 1' }, { id: 'option2', name: 'Option 2' }, { id: 'option3', name: 'Option 3' }] },
  { id: 'leadArrangement', title: 'Melody', options: [{ id: 'option1', name: 'Option 1' }, { id: 'option2', name: 'Option 2' }, { id: 'option3', name: 'Option 3' }] },
];

function App() {
  const flags = useFlags();
  const ldClient = useLDClient();
  const { isPlaying, togglePlay, updatePattern } = useStrudel();

  // Local state to track what user voted for (optional visual feedback)
  const [userVotes, setUserVotes] = useState({});
  const [tracks, setTracks] = useState(FALLBACK_TRACKS);

  useEffect(() => {
    // Fetch dynamic configuration from our backend proxy
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        // Map the API response to our UI structure
        const newTracks = [];

        // Define display titles mapping
        const titles = { bass: 'Bass', drums: 'Drums', leadArrangement: 'Melody' };

        // Process known keys in specific order or strictly from return
        ['bass', 'drums', 'leadArrangement'].forEach(key => {
          if (data[key]) {
            newTracks.push({
              id: key,
              title: titles[key] || key,
              options: data[key].options
            });
          }
        });

        if (newTracks.length > 0) {
          setTracks(newTracks);
        }
      })
      .catch(err => console.error("Failed to load track config:", err));
  }, []);

  useEffect(() => {
    // Construct the combined pattern based on active flags
    try {
      // Default to option1 if flag is missing/invalid
      const bass = PATTERNS.bass[flags.bass] || PATTERNS.bass.option1;
      const drums = PATTERNS.drums[flags.drums] || PATTERNS.drums.option1;
      const leadArrangement = PATTERNS.leadArrangement[flags.leadArrangement] || PATTERNS.leadArrangement.option1;

      // Stack the patterns
      const combinedPattern = `stack(
        ${bass},
        ${drums},
        ${leadArrangement}
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
      <div className="z-10 text-center mb-12 flex flex-col items-center">
        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-2xl mb-4">
          DJ TOGGLE
        </h1>
        <p className="text-xl text-white/50 font-light tracking-widest uppercase mb-8">
          Live Audience Mixing
        </p>

        {/* DJ Astronaut Image */}
        <div className="relative w-96 h-96 mb-8">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl animate-pulse" />
          <img
            src={djAstronaut}
            alt="DJ Astronaut"
            className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mb-12">
        {tracks.map(track => (
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
