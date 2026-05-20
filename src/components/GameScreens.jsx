import React, { useState } from 'react';
import Dial from './Dial';
import {
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  Play,
  RotateCcw,
  Plus,
  X,
  ArrowLeft,
  Smartphone,
  Wifi,
  Users,
  QrCode,
} from 'lucide-react';

const AVATARS = ['😎', '🤩', '🦊', '🐱', '🐶', '🦄', '🎸', '🌟', '🔥', '💎', '🍕', '🎯', '🧠', '👻', '🤖', '🦋'];
const TEAM_COLORS = ['#ff6b6b', '#4ecdc4'];

/* ── Score bar (team-based) ── */
function ScoreBar({ teams, currentTeamIdx, winPoints }) {
    return (
        <div className="score-bar">
            {teams.map((team, i) => (
                <div key={i} className={`score-bar-team ${i === currentTeamIdx ? 'active' : ''}`}>
                    <span className="score-bar-team-name" style={{ color: TEAM_COLORS[i] }}>
                        {team.name}
                    </span>
                    <span className="score-bar-pts">{team.score}/{winPoints}</span>
                </div>
            ))}
        </div>
    );
}

/* ── MODE SELECT ── */
export function ModeSelectScreen({ onLocal, onHost, onGuest }) {
    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <h1>Wavelength</h1>
            <p style={{ color: '#aaa', marginBottom: '2rem' }}>Tria com vols jugar</p>

            <button onClick={onLocal} style={{ width: '100%', marginBottom: '1rem' }}>
                <Smartphone size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Un sol mòbil (passar-lo)
            </button>

            <button
                onClick={onHost}
                style={{ width: '100%', marginBottom: '1rem', background: 'var(--color-accent)' }}
            >
                <QrCode size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Crear sala amb QR (multidispositiu)
            </button>

            <button
                onClick={onGuest}
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}
            >
                <Wifi size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Unir-me a una sala
            </button>
        </div>
    );
}

/* ── SETUP ── */
export function SetupScreen({ initialTeams, initialPoints, onStart, onBack, gameMode }) {
    const [teamNames, setTeamNames] = useState(initialTeams.map(t => t.name));
    const [teamPlayers, setTeamPlayers] = useState(
        initialTeams.map((t, ti) =>
            t.players.length >= 2
                ? t.players
                : [
                    { name: '', avatar: AVATARS[ti * 2] },
                    { name: '', avatar: AVATARS[ti * 2 + 1] },
                ]
        )
    );
    const [winPoints, setWinPoints] = useState(initialPoints || 25);
    const [openAvatarPicker, setOpenAvatarPicker] = useState(null);

    const canStart = teamPlayers.every(
        players => players.length >= 2 && players.every(p => p.name.trim())
    );

    const updatePlayer = (teamIdx, playerIdx, field, value) => {
        setTeamPlayers(prev =>
            prev.map((players, ti) =>
                ti === teamIdx
                    ? players.map((p, pi) => (pi === playerIdx ? { ...p, [field]: value } : p))
                    : players
            )
        );
    };

    const addPlayer = (teamIdx) => {
        const usedAvatars = teamPlayers.flat().map(p => p.avatar);
        const freeAvatar = AVATARS.find(a => !usedAvatars.includes(a)) || AVATARS[0];
        setTeamPlayers(prev =>
            prev.map((players, ti) =>
                ti === teamIdx ? [...players, { name: '', avatar: freeAvatar }] : players
            )
        );
    };

    const removePlayer = (teamIdx, playerIdx) => {
        setTeamPlayers(prev =>
            prev.map((players, ti) =>
                ti === teamIdx ? players.filter((_, pi) => pi !== playerIdx) : players
            )
        );
    };

    const handleStart = () => {
        onStart({
            teams: teamNames.map((name, i) => ({
                name: name.trim() || `Equip ${i + 1}`,
                players: teamPlayers[i].map(p => ({ name: p.name.trim(), avatar: p.avatar })),
            })),
            points: winPoints,
        });
    };

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{ background: 'transparent', boxShadow: 'none', padding: '0.5em' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <h1 style={{ flex: 1, margin: 0 }}>Wavelength</h1>
                <div style={{ width: 40 }} />
            </div>

            {gameMode === 'MULTI_HOST' && (
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                    Configura els equips. Després generarem un QR perquè els jugadors s'uneixin.
                </p>
            )}

            {[0, 1].map(teamIdx => (
                <div
                    key={teamIdx}
                    className="card team-setup-card"
                    style={{ borderLeft: `4px solid ${TEAM_COLORS[teamIdx]}` }}
                >
                    <input
                        type="text"
                        className="team-name-input"
                        value={teamNames[teamIdx]}
                        onChange={e =>
                            setTeamNames(prev => prev.map((n, i) => (i === teamIdx ? e.target.value : n)))
                        }
                        placeholder={`Equip ${teamIdx + 1}`}
                        maxLength={16}
                        style={{ color: TEAM_COLORS[teamIdx] }}
                    />

                    {teamPlayers[teamIdx].map((player, playerIdx) => {
                        const pickerKey = `${teamIdx}-${playerIdx}`;
                        const isPickerOpen = openAvatarPicker === pickerKey;
                        return (
                            <div key={playerIdx} className="player-row">
                                <button
                                    className="avatar-cycle-btn"
                                    onClick={() => setOpenAvatarPicker(isPickerOpen ? null : pickerKey)}
                                    title="Canviar avatar"
                                >
                                    {player.avatar}
                                </button>
                                {isPickerOpen && (
                                    <div className="avatar-picker-popup">
                                        {AVATARS.map(a => (
                                            <button
                                                key={a}
                                                className={`avatar-btn ${player.avatar === a ? 'selected' : ''}`}
                                                onClick={() => {
                                                    updatePlayer(teamIdx, playerIdx, 'avatar', a);
                                                    setOpenAvatarPicker(null);
                                                }}
                                            >
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder={`Jugador ${playerIdx + 1}...`}
                                    value={player.name}
                                    onChange={e => updatePlayer(teamIdx, playerIdx, 'name', e.target.value)}
                                    maxLength={12}
                                    className="player-name-input"
                                />
                                {teamPlayers[teamIdx].length > 2 && (
                                    <button
                                        className="remove-player-btn"
                                        onClick={() => removePlayer(teamIdx, playerIdx)}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    <button className="add-player-btn" onClick={() => addPlayer(teamIdx)}>
                        <Plus size={16} /> Afegir jugador
                    </button>
                </div>
            ))}

            {/* Win points config */}
            <div className="card" style={{ marginTop: '1rem', padding: '1rem 1.5rem' }}>
                <label style={{ fontSize: '1rem', color: '#aaa' }}>
                    Punts per guanyar:{' '}
                    <strong style={{ color: '#fff', fontSize: '1.3rem' }}>{winPoints}</strong>
                </label>
                <input
                    type="range"
                    min={3}
                    max={100}
                    value={winPoints}
                    onChange={e => setWinPoints(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--color-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777' }}>
                    <span>3</span>
                    <span>50</span>
                    <span>100</span>
                </div>
            </div>

            <button onClick={handleStart} disabled={!canStart} style={{ marginTop: '1.5rem' }}>
                <Play size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {gameMode === 'MULTI_HOST' ? 'Crear sala' : 'Començar Partida'}
            </button>
        </div>
    );
}

/* ── HOST LOBBY (waiting for guests / showing QR) ── */
export function HostLobbyScreen({ teams, roomCode, connectedGuests, reconnecting, onStart, onBack }) {
    const joinUrl =
        roomCode
            ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
            : null;

    const qrSrc =
        joinUrl
            ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(joinUrl)}`
            : null;

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ background: 'transparent', boxShadow: 'none', padding: '0.5em' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ flex: 1, margin: 0 }}>Sala oberta</h2>
                <div style={{ width: 40 }} />
            </div>

            {!roomCode ? (
                <p>Connectant…</p>
            ) : reconnecting ? (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <p style={{ color: '#ffe66d' }}>Reconnectant a la sala <strong>{roomCode}</strong>…</p>
                    <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
                        Recuperant el codi anterior. Els jugadors es reconnectaran automàticament.
                    </p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <p style={{ color: '#aaa', margin: 0 }}>Codi de sala</p>
                        <h1 style={{ letterSpacing: '0.3em', fontSize: '3rem', margin: '0.3em 0' }}>{roomCode}</h1>
                        {qrSrc && (
                            <img
                                src={qrSrc}
                                alt="QR"
                                style={{ width: 240, height: 240, borderRadius: 12, background: '#fff', padding: 8 }}
                            />
                        )}
                        <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                            {joinUrl}
                        </p>
                    </div>

                    <div className="card" style={{ padding: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#aaa' }}>
                            <Users size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Connectats: {connectedGuests.length}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'left', flexWrap: 'wrap' }}>
                            {teams.map((team, ti) => (
                                <div key={ti} style={{ margin: '0.5rem' }}>
                                    <div style={{ color: TEAM_COLORS[ti], fontWeight: 700 }}>{team.name}</div>
                                    {team.players.map((p, pi) => (
                                        <div key={pi} style={{ fontSize: '0.9rem' }}>
                                            {p.avatar} {p.name}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={onStart} style={{ marginTop: '1rem' }}>
                        <Play size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Començar partida
                    </button>
                </>
            )}
        </div>
    );
}

/* ── JOIN ROOM (guest) ── */
export function JoinRoomScreen({ onJoin, onBack }) {
    // Pre-fill from ?room=XXXX
    const params = new URLSearchParams(window.location.search);
    const preCode = (params.get('room') || '').toUpperCase();
    const [code, setCode] = useState(preCode);
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);

    const handleJoin = () => {
        if (!code.trim() || !name.trim()) return;
        const guestId = Math.random().toString(36).slice(2, 10);
        onJoin(code.trim().toUpperCase(), {
            guestId,
            name: name.trim(),
            avatar,
        });
    };

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ background: 'transparent', boxShadow: 'none', padding: '0.5em' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ flex: 1, margin: 0 }}>Unir-me a la sala</h2>
                <div style={{ width: 40 }} />
            </div>

            <div className="card">
                <label style={{ color: '#aaa', fontSize: '0.9rem' }}>Codi de sala</label>
                <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={6}
                    style={{ letterSpacing: '0.3em', textTransform: 'uppercase' }}
                />

                <label style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '1rem', display: 'block' }}>
                    El teu nom
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nom..."
                    maxLength={12}
                />

                <label style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '1rem', display: 'block' }}>
                    Avatar
                </label>
                <div className="avatar-picker">
                    {AVATARS.map(a => (
                        <button
                            key={a}
                            className={`avatar-btn ${avatar === a ? 'selected' : ''}`}
                            onClick={() => setAvatar(a)}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleJoin} disabled={!code.trim() || !name.trim()}>
                <Wifi size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Unir-me
            </button>
        </div>
    );
}

/* ── GUEST WAITING (after sending join request) ── */
export function GuestWaitingScreen({ connected, reconnecting }) {
    return (
        <div className="card fade-in">
            <Wifi size={64} color={connected ? '#4ecdc4' : '#ccc'} style={{ marginBottom: '1rem' }} />
            <h2>{connected ? 'Connectat!' : reconnecting ? 'Reconnectant…' : 'Connectant…'}</h2>
            <p style={{ color: '#aaa' }}>
                {connected
                    ? "Espera que l'amfitrió comenci la partida."
                    : reconnecting
                        ? "S'ha perdut la connexió. Reintentant automàticament."
                        : "Establint connexió amb la sala…"}
            </p>
        </div>
    );
}

/* ── PASS DEVICE (between rounds) ── */
export function PassDeviceScreen({ pendingPsychic, teams, onReady, gameMode, guestSelf }) {
    if (!pendingPsychic) {
        return (
            <div className="card fade-in">
                <p>Carregant…</p>
            </div>
        );
    }
    const { teamIdx, playerIdx } = pendingPsychic;
    const team = teams[teamIdx];
    const player = team?.players?.[playerIdx];

    // In multi-device mode, only the next psychic confirms on their device
    const isMine =
        gameMode === 'MULTI_GUEST'
            ? guestSelf && guestSelf.teamIdx === teamIdx && guestSelf.playerIdx === playerIdx
            : true;

    return (
        <div className="card fade-in">
            <Smartphone size={64} color={TEAM_COLORS[teamIdx]} style={{ marginBottom: '1rem' }} />
            <h2>Torn següent</h2>
            <p style={{ marginBottom: '0.5rem', color: '#aaa' }}>
                {gameMode === 'MULTI_HOST' || gameMode === 'MULTI_GUEST'
                    ? 'Comença el torn de'
                    : 'Passa el dispositiu a'}
            </p>
            <p style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{player?.avatar}</span>{' '}
                <strong>{player?.name}</strong>
            </p>
            <p
                style={{
                    color: TEAM_COLORS[teamIdx],
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '1.5rem',
                }}
            >
                {team?.name} · Psíquic
            </p>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '2rem' }}>
                Donarà la pista al seu equip.
            </p>

            {isMine ? (
                <button onClick={onReady}>
                    <Check size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Estic a punt
                </button>
            ) : (
                <p style={{ color: '#aaa' }}>Esperant que {player?.name} estigui a punt…</p>
            )}
        </div>
    );
}

/* ── PSYCHIC ── */
export function PsychicScreen({
    target,
    clue,
    setClue,
    onConfirm,
    card,
    psychic,
    guessingTeam,
    guessers,
    teams,
    currentTeamIdx,
    winPoints,
    gameMode,
    guestSelf,
    currentPsychicIdx,
}) {
    // In multi-device, only the psychic sees the target. Others see waiting screen.
    const isMyTurn =
        gameMode === 'MULTI_GUEST'
            ? guestSelf && guestSelf.teamIdx === currentTeamIdx && guestSelf.playerIdx === currentPsychicIdx
            : true;

    if (gameMode === 'MULTI_GUEST' && !isMyTurn) {
        return (
            <div className="card fade-in">
                <EyeOff size={64} color="#aaa" style={{ marginBottom: '1rem' }} />
                <h2>{psychic.avatar} {psychic.name}</h2>
                <p style={{ color: '#aaa' }}>està pensant la pista…</p>
                <p style={{ color: TEAM_COLORS[currentTeamIdx], fontWeight: 700, marginTop: '1rem' }}>
                    {teams[currentTeamIdx].name}
                </p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <ScoreBar teams={teams} currentTeamIdx={currentTeamIdx} winPoints={winPoints} />

            <div className="team-turn-badge" style={{ background: TEAM_COLORS[currentTeamIdx] }}>
                {teams[currentTeamIdx].name}
            </div>

            <h2>
                <span className="phase-avatar">{psychic.avatar}</span> {psychic.name} — Psíquic
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                Fes que el teu equip <strong style={{ color: TEAM_COLORS[currentTeamIdx] }}>{guessingTeam.name}</strong> ho endevini!
            </p>
            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>
                Endevinaran: {guessers.map(g => `${g.avatar} ${g.name}`).join(', ')}
            </div>

            <Dial
                target={target}
                revealed={false}
                interactive={false}
                guess={target}
                leftLabel={card.left}
                rightLabel={card.right}
            />

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Escriu la teva pista..."
                    value={clue}
                    onChange={e => setClue(e.target.value)}
                    autoFocus
                />
            </div>

            <button onClick={onConfirm} disabled={!clue.trim()}>
                <EyeOff size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                {gameMode === 'LOCAL' ? 'Amagar i Passar' : 'Enviar pista'}
            </button>
        </div>
    );
}

/* ── TRANSITION (pass within a team to the guessing players) ── */
export function TransitionScreen({
    onReady,
    guessingTeam,
    guessers,
    currentTeamIdx,
    gameMode,
    guestSelf,
    currentPsychicIdx,
}) {
    // In multi mode, the psychic shouldn't see the dial; guessers should.
    // Any non-psychic teammate can confirm "we're ready".
    const isAGuesser =
        gameMode === 'MULTI_GUEST'
            ? guestSelf && guestSelf.teamIdx === currentTeamIdx && guestSelf.playerIdx !== currentPsychicIdx
            : true;

    return (
        <div className="card fade-in">
            <EyeOff size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
            <h2>Passa el dispositiu</h2>
            <p style={{ marginBottom: '0.5rem' }}>L'endevinarà tot l'equip</p>
            <p style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: TEAM_COLORS[currentTeamIdx] }}>
                <strong>{guessingTeam.name}</strong>
            </p>
            <div style={{ marginBottom: '1.5rem' }}>
                {guessers.map((g, i) => (
                    <span key={i} style={{ fontSize: '1.2rem', margin: '0 4px' }}>
                        {g.avatar} {g.name}
                    </span>
                ))}
            </div>
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Discutiu junts i decidiu on apuntar al dial.
            </p>
            {isAGuesser ? (
                <button onClick={onReady}>
                    <Check size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Estem a punt
                </button>
            ) : (
                <p style={{ color: '#aaa' }}>Esperant l'equip…</p>
            )}
        </div>
    );
}

/* ── GUESSER (whole team guesses) ── */
export function GuesserScreen({
    clue,
    guess,
    setGuess,
    onConfirm,
    card,
    guessingTeam,
    guessers,
    teams,
    currentTeamIdx,
    winPoints,
    gameMode,
    guestSelf,
    currentPsychicIdx,
}) {
    const isAGuesser =
        gameMode === 'MULTI_GUEST'
            ? guestSelf && guestSelf.teamIdx === currentTeamIdx && guestSelf.playerIdx !== currentPsychicIdx
            : true;

    if (gameMode === 'MULTI_GUEST' && !isAGuesser) {
        return (
            <div className="card fade-in">
                <h2>El teu equip està pensant…</h2>
                <p style={{ color: '#aaa' }}>Pista: <strong>"{clue}"</strong></p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <ScoreBar teams={teams} currentTeamIdx={currentTeamIdx} winPoints={winPoints} />

            <h2 style={{ color: TEAM_COLORS[currentTeamIdx] }}>
                {guessingTeam.name} — Endevineu junts
            </h2>
            <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '0.5rem' }}>
                {guessers.map(g => `${g.avatar} ${g.name}`).join(' · ')}
            </div>

            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    PISTA
                </span>
                <h3 style={{ margin: '0.5rem 0', fontSize: '2rem' }}>"{clue}"</h3>
            </div>

            <Dial
                guess={guess}
                target={null}
                revealed={false}
                interactive={true}
                onChange={setGuess}
                leftLabel={card.left}
                rightLabel={card.right}
            />

            <button onClick={onConfirm} style={{ marginTop: '1.5rem' }}>
                <Eye size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Confirmar resposta
            </button>
        </div>
    );
}

/* ── REVEAL ── */
export function RevealScreen({ clue, guess, target, score, onNext, card, psychic, teams, currentTeamIdx, winPoints }) {
    const scoreColors = { 4: '#4ecdc4', 3: '#ffe66d', 2: '#ff6b6b', 0: '#666' };
    const scoreEmoji = { 4: '🎯', 3: '👏', 2: '👍', 0: '😬' };

    void psychic; // not displayed but kept for compatibility
    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <ScoreBar teams={teams} currentTeamIdx={currentTeamIdx} winPoints={winPoints} />

            <h2>Resultat</h2>

            <div className="card" style={{ padding: '0.5rem 1rem', display: 'inline-block', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>"{clue}"</h3>
            </div>

            <Dial
                guess={guess}
                target={target}
                revealed={true}
                interactive={false}
                leftLabel={card.left}
                rightLabel={card.right}
            />

            <div style={{ margin: '1.5rem 0' }}>
                <span style={{ fontSize: '4rem' }}>{scoreEmoji[score] || '😬'}</span>
                <div
                    style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: scoreColors[score] || '#666',
                        marginTop: '0.3rem',
                    }}
                >
                    +{score}
                </div>
                <p style={{ color: TEAM_COLORS[currentTeamIdx], fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {teams[currentTeamIdx].name} guanya {score} punt{score !== 1 ? 's' : ''}
                </p>
            </div>

            <button onClick={onNext}>
                <ArrowRight size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Següent Ronda
            </button>
        </div>
    );
}

/* ── WIN ── */
export function WinScreen({ winnerTeamIdx, teams, onPlayAgain, onReset }) {
    const winner = teams[winnerTeamIdx];

    return (
        <div className="fade-in" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '0.5rem' }}>🏆</div>
            <h1 style={{ fontSize: '2.5rem' }}>{winner.name}</h1>
            <h2 style={{ color: TEAM_COLORS[winnerTeamIdx], marginTop: '0' }}>ha guanyat!</h2>

            <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '1.3rem' }}>
                    {teams.map((team, i) => (
                        <div key={i}>
                            <div style={{ color: TEAM_COLORS[i], fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {team.name}
                            </div>
                            <div style={{ fontSize: '2rem', color: '#4ecdc4' }}>{team.score}</div>
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>
                                {team.players.map(p => `${p.avatar} ${p.name}`).join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={onPlayAgain} style={{ marginTop: '2rem' }}>
                <RotateCcw size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Tornar a jugar
            </button>
            {onReset && (
                <button
                    onClick={onReset}
                    style={{
                        marginTop: '0.8rem',
                        background: 'rgba(255,255,255,0.1)',
                        fontSize: '0.9em',
                    }}
                >
                    Sortir al menú
                </button>
            )}
        </div>
    );
}
