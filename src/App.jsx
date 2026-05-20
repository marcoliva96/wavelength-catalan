import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SetupScreen,
  ModeSelectScreen,
  HostLobbyScreen,
  JoinRoomScreen,
  GuestWaitingScreen,
  PassDeviceScreen,
  PsychicScreen,
  TransitionScreen,
  GuesserScreen,
  RevealScreen,
  WinScreen,
} from './components/GameScreens';
import { cards } from './data/cards';
import './index.css';

const PHASES = {
  MODE_SELECT: 'MODE_SELECT',
  SETUP: 'SETUP',
  HOST_LOBBY: 'HOST_LOBBY',
  JOIN_ROOM: 'JOIN_ROOM',
  GUEST_WAITING: 'GUEST_WAITING',
  PASS_DEVICE: 'PASS_DEVICE',
  PSYCHIC: 'PSYCHIC',
  TRANSITION: 'TRANSITION',
  GUESSER: 'GUESSER',
  REVEAL: 'REVEAL',
  WIN: 'WIN',
};

const NUM_POSITIONS = 21; // 0-20
const STORAGE_KEY = 'wavelength-catalan-state-v2';
const DEFAULT_WIN_POINTS = 25;

function shuffleCards() {
  return [...cards].sort(() => Math.random() - 0.5);
}

const INITIAL_TEAMS = [
  { name: 'Equip 1', players: [], score: 0 },
  { name: 'Equip 2', players: [], score: 0 },
];

function buildInitialState() {
  return {
    gameMode: null, // 'LOCAL' | 'MULTI_HOST' | 'MULTI_GUEST'
    phase: PHASES.MODE_SELECT,
    teams: INITIAL_TEAMS,
    winPoints: DEFAULT_WIN_POINTS,
    currentTeamIdx: 0,
    psychicIndices: [0, 0],
    target: 10,
    clue: '',
    guess: 10,
    roundScore: 0,
    currentCard: cards[0],
    deck: [],
    deckIndex: 0,
    // For pass-device transition between rounds: who's the next psychic.
    pendingPsychic: null, // { teamIdx, playerIdx }
    // Multi-device state (host-side authoritative)
    roomCode: null,
    // Guest-side identity
    guestSelf: null, // { teamIdx, playerIdx } once joined
  };
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function App() {
  // Single state object so persistence is trivial.
  const [state, setState] = useState(() => {
    const restored = loadPersistedState();
    if (restored) return { ...buildInitialState(), ...restored };
    return buildInitialState();
  });

  // Persist every change. For guests we still persist the slim identity
  // (gameMode, roomCode, guestSelf, phase) so they auto-rejoin on reload;
  // the rest of the state is overwritten as soon as the host reconnects.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / private mode errors
    }
  }, [state]);

  const patch = useCallback((updater) => {
    setState(prev =>
      typeof updater === 'function' ? { ...prev, ...updater(prev) } : { ...prev, ...updater }
    );
  }, []);

  // ── Derived ──
  const teams = state.teams;
  const currentTeam = teams[state.currentTeamIdx];
  const psychicIdx = state.psychicIndices[state.currentTeamIdx];
  const psychic = currentTeam?.players?.[psychicIdx] || { name: '', avatar: '😎' };
  const guessingTeamIdx = state.currentTeamIdx; // same team guesses
  const guessingTeam = teams[guessingTeamIdx];
  // Players of the team excluding the psychic — they are the ones who guess
  const guessers = (currentTeam?.players || []).filter((_, i) => i !== psychicIdx);

  // ── Mode selection ──
  const chooseLocalMode = () => {
    patch({ gameMode: 'LOCAL', phase: PHASES.SETUP });
  };
  const chooseHostMode = () => {
    // Multi-device host: we still need teams configured locally; then go to lobby
    patch({ gameMode: 'MULTI_HOST', phase: PHASES.SETUP });
  };
  const chooseGuestMode = () => {
    patch({ gameMode: 'MULTI_GUEST', phase: PHASES.JOIN_ROOM });
  };

  // ── Setup done ──
  const handleSetupDone = useCallback(({ teams: newTeams, points }) => {
    const shuffled = shuffleCards();
    const startingTeamIdx = 0;
    const startingPsychicIdx = 0;
    setState(prev => ({
      ...prev,
      teams: newTeams.map(t => ({ ...t, score: 0 })),
      winPoints: points,
      currentTeamIdx: startingTeamIdx,
      psychicIndices: [0, 0],
      deck: shuffled,
      deckIndex: 0,
      target: Math.floor(Math.random() * NUM_POSITIONS),
      currentCard: shuffled[0],
      clue: '',
      guess: 10,
      roundScore: 0,
      pendingPsychic: { teamIdx: startingTeamIdx, playerIdx: startingPsychicIdx },
      phase:
        prev.gameMode === 'MULTI_HOST' ? PHASES.HOST_LOBBY : PHASES.PASS_DEVICE,
    }));
  }, []);

  // After PASS_DEVICE confirms, move to PSYCHIC
  const handlePassDeviceReady = () => {
    patch({ phase: PHASES.PSYCHIC, pendingPsychic: null });
  };

  const handlePsychicDone = () => patch({ phase: PHASES.TRANSITION });
  const handleTransitionDone = () => patch({ phase: PHASES.GUESSER });

  const calculateScore = (t, g) => {
    const diff = Math.abs(t - g);
    if (diff === 0) return 4;
    if (diff === 1) return 3;
    if (diff === 2) return 2;
    return 0;
  };

  const handleGuesserDone = () => {
    const score = calculateScore(state.target, state.guess);
    setState(prev => ({
      ...prev,
      roundScore: score,
      teams: prev.teams.map((t, i) =>
        i === prev.currentTeamIdx ? { ...t, score: t.score + score } : t
      ),
      phase: PHASES.REVEAL,
    }));
  };

  const handleRevealNext = () => {
    setState(prev => {
      // Check win condition first
      const teamThatJustPlayed = prev.teams[prev.currentTeamIdx];
      if (teamThatJustPlayed.score >= prev.winPoints) {
        return { ...prev, phase: PHASES.WIN };
      }

      // Advance: rotate psychic for current team, swap to other team, pick next card
      const newPsychicIndices = [...prev.psychicIndices];
      const playerCount = prev.teams[prev.currentTeamIdx].players.length || 1;
      newPsychicIndices[prev.currentTeamIdx] =
        (prev.psychicIndices[prev.currentTeamIdx] + 1) % playerCount;

      const nextTeamIdx = prev.currentTeamIdx === 0 ? 1 : 0;
      const nextPsychicIdx = newPsychicIndices[nextTeamIdx];

      let nextDeckIdx = prev.deckIndex + 1;
      let nextDeck = prev.deck;
      if (nextDeckIdx >= nextDeck.length) {
        nextDeck = shuffleCards();
        nextDeckIdx = 0;
      }

      return {
        ...prev,
        psychicIndices: newPsychicIndices,
        currentTeamIdx: nextTeamIdx,
        deck: nextDeck,
        deckIndex: nextDeckIdx,
        target: Math.floor(Math.random() * NUM_POSITIONS),
        currentCard: nextDeck[nextDeckIdx],
        clue: '',
        guess: 10,
        pendingPsychic: { teamIdx: nextTeamIdx, playerIdx: nextPsychicIdx },
        phase: PHASES.PASS_DEVICE,
      };
    });
  };

  const handlePlayAgain = () => {
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => ({ ...t, score: 0 })),
      phase: PHASES.SETUP,
    }));
  };

  const handleResetGame = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(buildInitialState());
  };

  const winnerTeamIdx =
    teams[0].score >= state.winPoints ? 0 : teams[1].score >= state.winPoints ? 1 : 0;

  // ── Multiplayer host wiring ──
  const mp = useMultiplayer({
    enabled: state.gameMode === 'MULTI_HOST' || state.gameMode === 'MULTI_GUEST',
    role: state.gameMode === 'MULTI_HOST' ? 'host' : state.gameMode === 'MULTI_GUEST' ? 'guest' : null,
    desiredRoomCode: state.roomCode, // reuse on host reload
    autoJoinRoomCode: state.gameMode === 'MULTI_GUEST' ? state.roomCode : null,
    onRoomCodeAssigned: (code) => {
      // Host: persist the code we successfully claimed
      setState(prev => (prev.roomCode === code ? prev : { ...prev, roomCode: code }));
    },
    onGuestConnected: () => {
      // Re-announce our identity so the host re-links us after a reload.
      if (state.gameMode === 'MULTI_GUEST' && state.guestSelf) {
        mpRef.current?.sendAction({
          type: 'JOIN_TEAM',
          teamIdx: state.guestSelf.teamIdx,
          playerIdx: state.guestSelf.playerIdx,
          name: state.guestSelf.name,
          avatar: state.guestSelf.avatar,
          guestId: state.guestSelf.guestId,
        });
      }
    },
    onGuestStateReceived: (remoteState) => {
      // Apply incoming state from host (guests only)
      setState(prev => ({
        ...prev,
        ...remoteState,
        gameMode: 'MULTI_GUEST', // preserve guest role
        guestSelf: prev.guestSelf,
        roomCode: prev.roomCode,
      }));
    },
    onGuestActionReceived: (action) => {
      // Host receives actions from guests, applies them locally → which triggers broadcast
      applyGuestAction(action);
    },
  });
  // Keep a ref so callbacks can access the latest mp without re-binding
  const mpRef = useRef(mp);
  useEffect(() => { mpRef.current = mp; }, [mp]);

  // Host: whenever local state changes, broadcast.
  useEffect(() => {
    if (state.gameMode !== 'MULTI_HOST') return;
    if (!mp.ready) return;
    mp.broadcastState(state);
  }, [state, mp.ready, mp.peerCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guest: send actions back to host
  const sendAction = (action) => {
    if (state.gameMode === 'MULTI_GUEST') {
      mp.sendAction(action);
    } else {
      applyGuestAction(action);
    }
  };

  function applyGuestAction(action) {
    switch (action.type) {
      case 'SET_CLUE':
        patch({ clue: action.value });
        break;
      case 'PSYCHIC_DONE':
        handlePsychicDone();
        break;
      case 'TRANSITION_READY':
        handleTransitionDone();
        break;
      case 'SET_GUESS':
        patch({ guess: action.value });
        break;
      case 'GUESSER_DONE':
        handleGuesserDone();
        break;
      case 'REVEAL_NEXT':
        handleRevealNext();
        break;
      case 'PASS_DEVICE_READY':
        handlePassDeviceReady();
        break;
      case 'PLAY_AGAIN':
        handlePlayAgain();
        break;
      case 'JOIN_TEAM': {
        // action: { teamIdx, playerIdx, name, avatar, guestId }
        setState(prev => {
          const newTeams = prev.teams.map((t, ti) => {
            if (ti !== action.teamIdx) return t;
            const players = [...t.players];
            players[action.playerIdx] = {
              ...(players[action.playerIdx] || {}),
              name: action.name,
              avatar: action.avatar,
              guestId: action.guestId,
            };
            return { ...t, players };
          });
          return { ...prev, teams: newTeams };
        });
        break;
      }
      default:
        break;
    }
  }

  const startMultiGame = () => {
    // Called by host from lobby
    patch({ phase: PHASES.PASS_DEVICE });
  };

  const handleHostJoinRoom = (code, self) => {
    // Guest joining for the first time: persist room code + identity, the
    // guest effect in useMultiplayer will pick it up and connect.
    patch({ phase: PHASES.GUEST_WAITING, guestSelf: self, roomCode: code });
  };

  // ── Render ──
  return (
    <div className="app-container">
      {state.phase === PHASES.MODE_SELECT && (
        <ModeSelectScreen
          onLocal={chooseLocalMode}
          onHost={chooseHostMode}
          onGuest={chooseGuestMode}
        />
      )}

      {state.phase === PHASES.SETUP && (
        <SetupScreen
          initialTeams={state.teams}
          initialPoints={state.winPoints}
          gameMode={state.gameMode}
          onStart={handleSetupDone}
          onBack={() => patch({ phase: PHASES.MODE_SELECT })}
        />
      )}

      {state.phase === PHASES.HOST_LOBBY && (
        <HostLobbyScreen
          teams={state.teams}
          roomCode={state.roomCode}
          connectedGuests={mp.connectedGuests}
          reconnecting={mp.reconnecting}
          onStart={startMultiGame}
          onBack={() => patch({ phase: PHASES.SETUP })}
        />
      )}

      {state.phase === PHASES.JOIN_ROOM && (
        <JoinRoomScreen onJoin={handleHostJoinRoom} onBack={() => patch({ phase: PHASES.MODE_SELECT })} />
      )}

      {state.phase === PHASES.GUEST_WAITING && (
        <GuestWaitingScreen connected={mp.connected} reconnecting={mp.reconnecting} />
      )}

      {state.phase === PHASES.PASS_DEVICE && (
        <PassDeviceScreen
          pendingPsychic={state.pendingPsychic}
          teams={state.teams}
          onReady={() => sendAction({ type: 'PASS_DEVICE_READY' })}
          gameMode={state.gameMode}
          guestSelf={state.guestSelf}
        />
      )}

      {state.phase === PHASES.PSYCHIC && (
        <PsychicScreen
          target={state.target}
          clue={state.clue}
          setClue={(v) => sendAction({ type: 'SET_CLUE', value: v })}
          onConfirm={() => sendAction({ type: 'PSYCHIC_DONE' })}
          card={state.currentCard}
          psychic={psychic}
          guessingTeam={guessingTeam}
          guessers={guessers}
          teams={state.teams}
          currentTeamIdx={state.currentTeamIdx}
          winPoints={state.winPoints}
          gameMode={state.gameMode}
          guestSelf={state.guestSelf}
          currentPsychicIdx={psychicIdx}
        />
      )}

      {state.phase === PHASES.TRANSITION && (
        <TransitionScreen
          onReady={() => sendAction({ type: 'TRANSITION_READY' })}
          guessingTeam={guessingTeam}
          guessers={guessers}
          currentTeamIdx={state.currentTeamIdx}
          gameMode={state.gameMode}
          guestSelf={state.guestSelf}
          currentPsychicIdx={psychicIdx}
        />
      )}

      {state.phase === PHASES.GUESSER && (
        <GuesserScreen
          clue={state.clue}
          guess={state.guess}
          setGuess={(v) => sendAction({ type: 'SET_GUESS', value: v })}
          onConfirm={() => sendAction({ type: 'GUESSER_DONE' })}
          card={state.currentCard}
          guessingTeam={guessingTeam}
          guessers={guessers}
          teams={state.teams}
          currentTeamIdx={state.currentTeamIdx}
          winPoints={state.winPoints}
          gameMode={state.gameMode}
          guestSelf={state.guestSelf}
          currentPsychicIdx={psychicIdx}
        />
      )}

      {state.phase === PHASES.REVEAL && (
        <RevealScreen
          clue={state.clue}
          guess={state.guess}
          target={state.target}
          score={state.roundScore}
          onNext={() => sendAction({ type: 'REVEAL_NEXT' })}
          card={state.currentCard}
          psychic={psychic}
          teams={state.teams}
          currentTeamIdx={state.currentTeamIdx}
          winPoints={state.winPoints}
        />
      )}

      {state.phase === PHASES.WIN && (
        <WinScreen
          winnerTeamIdx={winnerTeamIdx}
          teams={state.teams}
          onPlayAgain={() => sendAction({ type: 'PLAY_AGAIN' })}
          onReset={handleResetGame}
        />
      )}

      {/* Reconnecting indicator (guests only, during gameplay) */}
      {state.gameMode === 'MULTI_GUEST' &&
        mp.reconnecting &&
        !mp.connected &&
        state.phase !== PHASES.JOIN_ROOM &&
        state.phase !== PHASES.GUEST_WAITING && (
          <div className="reconnect-banner">
            🔄 Reconnectant amb la sala {state.roomCode}…
          </div>
        )}

      {/* Reset button (small, in corner) — always available except on mode select */}
      {state.phase !== PHASES.MODE_SELECT && (
        <button
          className="reset-corner-btn"
          onClick={() => {
            if (confirm('Vols sortir de la partida actual? Es perdrà el progrés.')) {
              handleResetGame();
            }
          }}
          title="Sortir de la partida"
        >
          ⟲
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Multiplayer hook (PeerJS via CDN — see index.html)
//
// Resilience strategy:
// • Host persists the room code. On reload we try to reclaim the same PeerJS
//   ID; if the signaling server still holds it (~5–15 s) we retry until it
//   becomes free (auto-recovery, same code).
// • Guests auto-rejoin the persisted room code on reload and re-announce their
//   identity so the host re-links them seamlessly.
// • WebRTC data channels can't survive a page reload, so a momentary
//   "Reconnectant…" state is unavoidable, but the codi de sala doesn't change.
// ─────────────────────────────────────────────────────────────────────────────
function useMultiplayer({
  enabled,
  role,
  desiredRoomCode,
  autoJoinRoomCode,
  onRoomCodeAssigned,
  onGuestConnected,
  onGuestStateReceived,
  onGuestActionReceived,
}) {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedGuests, setConnectedGuests] = useState([]);
  const [reconnecting, setReconnecting] = useState(false);
  const peerRef = useRef(null);
  const connectionsRef = useRef([]); // host: list of DataConnection. guest: [hostConn]
  const handlersRef = useRef({});

  useEffect(() => {
    handlersRef.current = {
      onGuestStateReceived,
      onGuestActionReceived,
      onRoomCodeAssigned,
      onGuestConnected,
    };
  }, [onGuestStateReceived, onGuestActionReceived, onRoomCodeAssigned, onGuestConnected]);

  // ── HOST ──
  useEffect(() => {
    if (!enabled || role !== 'host') return undefined;
    if (!window.Peer) {
      console.warn('PeerJS not loaded');
      return undefined;
    }

    let cancelled = false;
    let retryTimer = null;
    let activePeer = null;

    const attachConnectionHandlers = (peer) => {
      peer.on('connection', (conn) => {
        conn.on('open', () => {
          connectionsRef.current = [...connectionsRef.current, conn];
          setConnectedGuests(prev => [...prev, conn.peer]);
        });
        conn.on('data', (data) => {
          if (data && data.__type === 'action') {
            handlersRef.current.onGuestActionReceived?.(data.payload);
          }
        });
        conn.on('close', () => {
          connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
          setConnectedGuests(prev => prev.filter(p => p !== conn.peer));
        });
      });
    };

    const tryOpen = (preferredCode, fallbackAfter = 30) => {
      if (cancelled) return;
      const code = preferredCode || generateRoomCode();
      const peer = new window.Peer(`wvl-${code}`);
      activePeer = peer;
      peerRef.current = peer;

      peer.on('open', () => {
        if (cancelled) return;
        setReady(true);
        setReconnecting(false);
        handlersRef.current.onRoomCodeAssigned?.(code);
      });

      attachConnectionHandlers(peer);

      peer.on('error', (err) => {
        if (cancelled) return;
        if (err && err.type === 'unavailable-id') {
          // Server still holds our previous registration; wait and retry.
          setReconnecting(true);
          try { peer.destroy(); } catch { /* ignore */ }
          if (fallbackAfter > 0) {
            retryTimer = setTimeout(
              () => tryOpen(preferredCode, fallbackAfter - 1),
              2000,
            );
          } else {
            // Give up and use a fresh code.
            tryOpen(null, 0);
          }
        } else if (err && (err.type === 'network' || err.type === 'disconnected')) {
          // Try to reconnect to signaling silently
          setReconnecting(true);
          try { peer.reconnect(); } catch { /* ignore */ }
        } else {
          console.error('PeerJS host error:', err);
        }
      });
    };

    tryOpen(desiredRoomCode || null);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      try { activePeer?.destroy(); } catch { /* ignore */ }
      peerRef.current = null;
      connectionsRef.current = [];
      setReady(false);
      setConnected(false);
      setConnectedGuests([]);
      setReconnecting(false);
    };
  }, [enabled, role, desiredRoomCode]);

  // ── GUEST: auto-rejoin if we have a persisted roomCode ──
  useEffect(() => {
    if (!enabled || role !== 'guest') return undefined;
    if (!autoJoinRoomCode) return undefined;
    if (!window.Peer) return undefined;
    // Already connected? skip.
    if (peerRef.current) return undefined;

    let cancelled = false;
    let retryTimer = null;

    const tryJoin = () => {
      if (cancelled) return;
      const peer = new window.Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        if (cancelled) return;
        const conn = peer.connect(`wvl-${autoJoinRoomCode}`, { reliable: true });
        connectionsRef.current = [conn];
        conn.on('open', () => {
          if (cancelled) return;
          setConnected(true);
          setReady(true);
          setReconnecting(false);
          handlersRef.current.onGuestConnected?.();
        });
        conn.on('data', (data) => {
          if (data && data.__type === 'state') {
            handlersRef.current.onGuestStateReceived?.(data.payload);
          }
        });
        conn.on('close', () => {
          setConnected(false);
          setReconnecting(true);
          // Schedule a rejoin
          retryTimer = setTimeout(() => {
            try { peerRef.current?.destroy(); } catch { /* ignore */ }
            peerRef.current = null;
            tryJoin();
          }, 2000);
        });
      });
      peer.on('error', (err) => {
        if (cancelled) return;
        if (err && (err.type === 'peer-unavailable' || err.type === 'network')) {
          setReconnecting(true);
          retryTimer = setTimeout(() => {
            try { peer.destroy(); } catch { /* ignore */ }
            peerRef.current = null;
            tryJoin();
          }, 2500);
        } else {
          console.error('PeerJS guest error:', err);
        }
      });
    };

    tryJoin();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      try { peerRef.current?.destroy(); } catch { /* ignore */ }
      peerRef.current = null;
      connectionsRef.current = [];
      setReady(false);
      setConnected(false);
      setReconnecting(false);
    };
  }, [enabled, role, autoJoinRoomCode]);

  const joinRoom = useCallback((code) => {
    // Manual join (from JoinRoomScreen). Triggers state.roomCode update via parent,
    // which then triggers the autoJoinRoomCode effect above.
    if (!window.Peer) {
      console.warn('PeerJS not loaded');
      return;
    }
    // We rely on the parent calling onRoomCodeAssigned-equivalent — but for the
    // initial manual join we have no host hook; instead the parent stores the
    // code in state, which feeds back as autoJoinRoomCode. So here we just
    // expose a no-op for compatibility; actual connection is set up by the
    // guest effect.
    void code;
  }, []);

  const broadcastState = useCallback((stateObj) => {
    // Strip purely local fields before sending
    const { deck, ...sharable } = stateObj;
    void deck;
    const msg = { __type: 'state', payload: sharable };
    connectionsRef.current.forEach(c => {
      if (c.open) {
        try { c.send(msg); } catch { /* ignore */ }
      }
    });
  }, []);

  const sendAction = useCallback((action) => {
    const msg = { __type: 'action', payload: action };
    connectionsRef.current.forEach(c => {
      if (c.open) {
        try { c.send(msg); } catch { /* ignore */ }
      }
    });
  }, []);

  return {
    ready,
    connected,
    connectedGuests,
    reconnecting,
    peerCount: connectedGuests.length,
    joinRoom,
    broadcastState,
    sendAction,
  };
}

function generateRoomCode() {
  // 4-char human-friendly code
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export default App;
