import React, { useState } from 'react';
import Dial from './Dial';
import { Eye, EyeOff, Check, ArrowRight, Play, RotateCcw, Plus, X } from 'lucide-react';

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

/* ── SETUP ── */
export function SetupScreen({ initialTeams, initialPoints, onStart }) {
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
    const [winPoints, setWinPoints] = useState(initialPoints || 10);
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
            <h1>Wavelength</h1>

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
                    max={20}
                    value={winPoints}
                    onChange={e => setWinPoints(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--color-primary)' }}
                />
            </div>

            <button onClick={handleStart} disabled={!canStart} style={{ marginTop: '1.5rem' }}>
                <Play size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Començar Partida
            </button>
        </div>
    );
}

/* ── PSYCHIC ── */
export function PsychicScreen({ target, clue, setClue, onConfirm, card, psychic, guesser, teams, currentTeamIdx, winPoints }) {
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
                Fes que <strong>{guesser.avatar} {guesser.name}</strong> ho endevini!
            </p>

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
                Amagar i Passar
            </button>
        </div>
    );
}

/* ── TRANSITION ── */
export function TransitionScreen({ onReady, guesser, teamName, currentTeamIdx }) {
    return (
        <div className="card fade-in">
            <EyeOff size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
            <h2>Passa el dispositiu</h2>
            <p style={{ marginBottom: '0.5rem' }}>Passa el dispositiu a</p>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                <span>{guesser.avatar}</span> <strong>{guesser.name}</strong>
            </p>
            <p style={{ color: TEAM_COLORS[currentTeamIdx], fontSize: '0.9rem', marginBottom: '2rem' }}>
                {teamName}
            </p>
            <button onClick={onReady}>
                <Check size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Estic a punt
            </button>
        </div>
    );
}

/* ── GUESSER ── */
export function GuesserScreen({ clue, guess, setGuess, onConfirm, card, guesser, teams, currentTeamIdx, winPoints }) {
    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <ScoreBar teams={teams} currentTeamIdx={currentTeamIdx} winPoints={winPoints} />

            <h2>
                <span className="phase-avatar">{guesser.avatar}</span> {guesser.name} — Endevina
            </h2>

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
                Confirmar
            </button>
        </div>
    );
}

/* ── REVEAL ── */
export function RevealScreen({ clue, guess, target, score, onNext, card, psychic, guesser, teams, currentTeamIdx, winPoints }) {
    const scoreColors = { 4: '#4ecdc4', 3: '#ffe66d', 2: '#ff6b6b', 0: '#666' };
    const scoreEmoji = { 4: '🎯', 3: '👏', 2: '👍', 0: '😬' };

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
export function WinScreen({ winnerTeamIdx, teams, onPlayAgain }) {
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
        </div>
    );
}
