import React, { useState } from 'react';
import Dial from './Dial';
import { Eye, EyeOff, Check, ArrowRight, Play, Trophy, RotateCcw } from 'lucide-react';

const AVATARS = ['😎', '🤩', '🦊', '🐱', '🐶', '🦄', '🎸', '🌟', '🔥', '💎', '🍕', '🎯', '🧠', '👻', '🤖', '🦋'];

/* ── Score bar (shown on game screens) ── */
function ScoreBar({ player1, player2, winPoints }) {
    return (
        <div className="score-bar">
            <div className="score-bar-player">
                <span className="score-bar-avatar">{player1.avatar}</span>
                <span className="score-bar-name">{player1.name}</span>
                <span className="score-bar-pts">{player1.score}/{winPoints}</span>
            </div>
            <div className="score-bar-player">
                <span className="score-bar-pts">{player2.score}/{winPoints}</span>
                <span className="score-bar-name">{player2.name}</span>
                <span className="score-bar-avatar">{player2.avatar}</span>
            </div>
        </div>
    );
}

/* ── SETUP ── */
export function SetupScreen({ initialP1, initialP2, initialPoints, onStart }) {
    const [p1Name, setP1Name] = useState(initialP1.name || '');
    const [p1Avatar, setP1Avatar] = useState(initialP1.avatar || '😎');
    const [p2Name, setP2Name] = useState(initialP2.name || '');
    const [p2Avatar, setP2Avatar] = useState(initialP2.avatar || '🤩');
    const [winPoints, setWinPoints] = useState(initialPoints || 10);

    const canStart = p1Name.trim() && p2Name.trim();

    const handleStart = () => {
        onStart({
            p1: { name: p1Name.trim(), avatar: p1Avatar },
            p2: { name: p2Name.trim(), avatar: p2Avatar },
            points: winPoints,
        });
    };

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <h1>Wavelength</h1>

            <div className="setup-players">
                {/* Player 1 */}
                <div className="card setup-player-card">
                    <h3>Jugador 1</h3>
                    <div className="avatar-picker">
                        {AVATARS.map(a => (
                            <button
                                key={`p1-${a}`}
                                className={`avatar-btn ${p1Avatar === a ? 'selected' : ''}`}
                                onClick={() => setP1Avatar(a)}
                            >{a}</button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Nom..."
                        value={p1Name}
                        onChange={e => setP1Name(e.target.value)}
                        maxLength={12}
                    />
                </div>

                {/* Player 2 */}
                <div className="card setup-player-card">
                    <h3>Jugador 2</h3>
                    <div className="avatar-picker">
                        {AVATARS.map(a => (
                            <button
                                key={`p2-${a}`}
                                className={`avatar-btn ${p2Avatar === a ? 'selected' : ''}`}
                                onClick={() => setP2Avatar(a)}
                            >{a}</button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Nom..."
                        value={p2Name}
                        onChange={e => setP2Name(e.target.value)}
                        maxLength={12}
                    />
                </div>
            </div>

            {/* Win points config */}
            <div className="card" style={{ marginTop: '1rem', padding: '1rem 1.5rem' }}>
                <label style={{ fontSize: '1rem', color: '#aaa' }}>
                    Punts per guanyar: <strong style={{ color: '#fff', fontSize: '1.3rem' }}>{winPoints}</strong>
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
export function PsychicScreen({ target, clue, setClue, onConfirm, card, psychic, player1, player2, winPoints }) {
    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <ScoreBar player1={player1} player2={player2} winPoints={winPoints} />

            <h2>
                <span className="phase-avatar">{psychic.avatar}</span> {psychic.name} — Psíquic
            </h2>

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
                    onChange={(e) => setClue(e.target.value)}
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
export function TransitionScreen({ onReady, guesser }) {
    return (
        <div className="card fade-in">
            <EyeOff size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
            <h2>Passa el dispositiu</h2>
            <p style={{ marginBottom: '0.5rem' }}>
                Passa el dispositiu a
            </p>
            <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                <span>{guesser.avatar}</span> <strong>{guesser.name}</strong>
            </p>
            <button onClick={onReady}>
                <Check size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Estic a punt
            </button>
        </div>
    );
}

/* ── GUESSER ── */
export function GuesserScreen({ clue, guess, setGuess, onConfirm, card, guesser, player1, player2, winPoints }) {
    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <ScoreBar player1={player1} player2={player2} winPoints={winPoints} />

            <h2>
                <span className="phase-avatar">{guesser.avatar}</span> {guesser.name} — Endevina
            </h2>

            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>PISTA</span>
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
export function RevealScreen({ clue, guess, target, score, onNext, card, psychic, guesser, player1, player2, winPoints }) {
    const scoreColors = { 4: '#4ecdc4', 3: '#ffe66d', 2: '#ff6b6b', 0: '#666' };
    const scoreEmoji = { 4: '🎯', 3: '👏', 2: '👍', 0: '😬' };

    return (
        <div className="fade-in" style={{ width: '100%' }}>
            <ScoreBar player1={player1} player2={player2} winPoints={winPoints} />

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
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: scoreColors[score] || '#666',
                    marginTop: '0.3rem'
                }}>
                    +{score}
                </div>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {guesser.avatar} {guesser.name} guanya {score} punt{score !== 1 ? 's' : ''}
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
export function WinScreen({ winner, player1, player2, onPlayAgain }) {
    return (
        <div className="fade-in" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '0.5rem' }}>🏆</div>
            <h1 style={{ fontSize: '2.5rem' }}>
                {winner.avatar} {winner.name}
            </h1>
            <h2 style={{ color: '#4ecdc4', marginTop: '0' }}>ha guanyat!</h2>

            <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '1.3rem' }}>
                    <div>
                        <span style={{ fontSize: '2rem' }}>{player1.avatar}</span>
                        <div style={{ fontWeight: 'bold' }}>{player1.name}</div>
                        <div style={{ fontSize: '2rem', color: '#4ecdc4' }}>{player1.score}</div>
                    </div>
                    <div style={{ alignSelf: 'center', color: '#555', fontSize: '1.5rem' }}>vs</div>
                    <div>
                        <span style={{ fontSize: '2rem' }}>{player2.avatar}</span>
                        <div style={{ fontWeight: 'bold' }}>{player2.name}</div>
                        <div style={{ fontSize: '2rem', color: '#4ecdc4' }}>{player2.score}</div>
                    </div>
                </div>
            </div>

            <button onClick={onPlayAgain} style={{ marginTop: '2rem' }}>
                <RotateCcw size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Tornar a jugar
            </button>
        </div>
    );
}
