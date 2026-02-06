import React, { useEffect, useState } from 'react';
import { withLDProvider, useFlags, useLDClient } from 'launchdarkly-react-client-sdk';
import { useStrudel } from './hooks/useStrudel';
import { TrackColumn } from './components/TrackColumn';
import { PATTERNS } from './audio/patterns';
import { cn } from './lib/utils';
import djAstronaut from './assets/DJToggle.png';

// Initial fallback tracks (minimal structure)
const FALLBACK_TRACKS = [
  { id: 'bass', title: 'Bass', options: [{ id: 'option1', name: 'Option 1' }, { id: 'option2', name: 'Option 2' }, { id: 'option3', name: 'Option 3' }] },
  { id: 'drums', title: 'Drums', options: [{ id: 'option1', name: 'Option 1' }, { id: 'option2', name: 'Option 2' }, { id: 'option3', name: 'Option 3' }] },
  { id: 'leadArrangement', title: 'Melody', options: [{ id: 'option1', name: 'Option 1' }, { id: 'option2', name: 'Option 2' }, { id: 'option3', name: 'Option 3' }] },
];
const CONFIG_POLL_MS = 2000;
const MAX_REROLL_ATTEMPTS = 10;

const getRequestKey = (suffix = '') => {
  const storage = globalThis.sessionStorage;
  const storageKey = suffix ? `dj-toggle-request-key:${suffix}` : 'dj-toggle-request-key';

  if (!storage) {
    const base = globalThis.crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return suffix ? `${base}-${suffix}` : base;
  }

  const existing = storage.getItem(storageKey);
  if (existing) return existing;

  const base = globalThis.crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const next = suffix ? `${base}-${suffix}` : base;
  storage.setItem(storageKey, next);
  return next;
};

const INITIAL_LD_CONTEXT = {
  kind: 'multi',
  user: {
    key: 'anonymous',
    anonymous: true,
  },
  request: {
    key: getRequestKey(),
  },
};

const createRequestKey = (suffix = '') => {
  const base = globalThis.crypto?.randomUUID?.() || `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return suffix ? `${base}-${suffix}` : base;
};

function App() {
  const flags = useFlags();
  const ldClient = useLDClient();
  const { isPlaying, togglePlay, updatePattern } = useStrudel();

  // Local state to track what user voted for (optional visual feedback)
  const [userVotes, setUserVotes] = useState({});
  const [tracks, setTracks] = useState(FALLBACK_TRACKS);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;
    let controller = new AbortController();

    const isSilenceOption = (option) => {
      const label = String(option?.name || option?.value || '').trim().toLowerCase();
      return label === 'silence';
    };

    const fetchConfig = () => {
      controller.abort();
      controller = new AbortController();

      // Fetch dynamic configuration from our backend proxy
      fetch('/api/config', { signal: controller.signal })
        .then(res => {
          if (!res.ok) {
            throw new Error(`Config fetch failed: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (!isMounted) return;

          setIsConnected(true);

          // Map the API response to our UI structure
          const newTracks = [];

          // Define display titles mapping
          const titles = { bassArrangement: 'Bass', drumArrangement: 'Drums', leadArrangement: 'Melody' };

          // Process known keys in specific order or strictly from return
          ['bassArrangement', 'drumArrangement', 'leadArrangement'].forEach(key => {
            if (data[key]) {
              newTracks.push({
                id: key,
                title: titles[key] || key,
                options: (data[key].options || []).filter(option => !isSilenceOption(option))
              });
            }
          });

          if (newTracks.length > 0) {
            setTracks(newTracks);
          }
        })
        .catch(err => {
          if (err?.name !== 'AbortError') {
            setIsConnected(false);
            console.error("Failed to load track config:", err);
          }
        });
    };

    fetchConfig();
    pollTimer = setInterval(fetchConfig, CONFIG_POLL_MS);

    return () => {
      isMounted = false;
      controller.abort();
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, []);

  useEffect(() => {
    // Construct the combined pattern based on active flags
    try {
      // Default to 'original' if flag is missing/invalid
      const bass = PATTERNS.bassArrangement[flags.bassArrangement] || PATTERNS.bassArrangement.original;
      const drums = PATTERNS.drumArrangement[flags.drumArrangement] || PATTERNS.drumArrangement.original;
      const leadArrangement = PATTERNS.leadArrangement[flags.leadArrangement] || PATTERNS.leadArrangement.original;

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

  const handleVote = async (trackId, option) => {
    const optionId = option?.id;
    const desiredVariation = option?.value;
    console.log(`Voting for ${trackId}: ${optionId}`);

    if (ldClient) {
      let matched = false;

      for (let attempt = 0; attempt < MAX_REROLL_ATTEMPTS; attempt += 1) {
        const requestKey = createRequestKey(`${trackId}-${attempt}`);
        const context = {
          kind: 'multi',
          user: {
            key: 'anonymous',
            anonymous: true,
          },
          request: {
            key: requestKey,
          },
        };

        try {
          await ldClient.identify(context);
          const actual = ldClient.variation(trackId, flags[trackId]);
          if (!desiredVariation || actual === desiredVariation) {
            matched = true;
            break;
          }
        } catch (err) {
          console.error('Failed to identify LaunchDarkly context:', err);
          break;
        }
      }

      if (!matched && desiredVariation) {
        console.warn(`No variation match for ${trackId} after retries.`);
      }

      // Send metric to LaunchDarkly
      // Metric key is 'vote', with custom attributes
      ldClient.track('vote', { track: trackId, option: optionId });
      if (typeof ldClient.flush === 'function') {
        ldClient.flush();
      }
    }

    if (optionId) {
      setUserVotes(prev => ({ ...prev, [trackId]: optionId }));
    }

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
      <div className="z-10 flex flex-wrap justify-center gap-6 w-full max-w-7xl mb-12">
        {tracks.map(track => (
          <TrackColumn
            key={track.id}
            title={track.title}
            trackId={track.id}
            options={track.options}
            currentOption={flags[track.id] || 'option1'} // Use flag value as source of truth for "Winning"
            selectedOption={userVotes[track.id]}
            onVote={handleVote}
          />
        ))}
      </div>

      {/* Footer / Status */}
      <div className="z-10 text-white/30 text-sm font-mono mt-auto mb-8">
        {isConnected ? 'Connected to LaunchDarkly' : 'Disconnected from LaunchDarkly'}
      </div>
    </div>
  );
}

export default withLDProvider({
  clientSideID: import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID,
  context: INITIAL_LD_CONTEXT,
  options: {
    bootstrap: 'localStorage',
    baseUrl: 'https://clientsdk.launchdarkly.com',
    streamUrl: 'https://clientstream.launchdarkly.com',
    eventsUrl: 'https://events.launchdarkly.com',
    diagnosticOptOut: true,
  },
})(App);
