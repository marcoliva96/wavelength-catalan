import { useState, useCallback } from 'react';
import { SetupScreen, PsychicScreen, TransitionScreen, GuesserScreen, RevealScreen, WinScreen } from './components/GameScreens';
import { cards } from './data/cards';
import './index.css';

const PHASES = {
  SETUP: 'SETUP',
  PSYCHIC: 'PSYCHIC',
  TRANSITION: 'TRANSITION',
  GUESSER: 'GUESSER',
  REVEAL: 'REVEAL',
  WIN: 'WIN',
};

const NUM_POSITIONS = 21; // 0-20

function shuffleCards() {
  return [...cards].sort(() => Math.random() - 0.5);
}

function App() {
  // ── Teams ──
  const [teams, setTeams] = useState([
    { name: 'Equip 1', players: [], score: 0 },
    { name: 'Equip 2', players: [], score: 0 },
  ]);
  const [winPoints, setWinPoints] = useState(10);

  // ── Game state ──
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [psychicIndices, setPsychicIndices] = useState([0, 0]); // per-team rotation
  const [target, setTarget] = useState(10);
  const [clue, setClue] = useState('');
  const [guess, setGuess] = useState(10);
  const [roundScore, setRoundScore] = useState(0);
  const [currentCard, setCurrentCard] = useState(cards[0]);
  const [deck, setDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);

  // Derived: current psychic & guesser (same team)
  const currentTeam = teams[currentTeamIdx];
  const psychicIdx = psychicIndices[currentTeamIdx];
  const psychic = currentTeam?.players?.[psychicIdx] || { name: '', avatar: '😎' };
  const guesserIdx = currentTeam?.players?.length > 0
    ? (psychicIdx + 1) % currentTeam.players.length
    : 0;
  const guesser = currentTeam?.players?.[guesserIdx] || { name: '', avatar: '🤩' };

  const handleSetupDone = useCallback(({ teams: newTeams, points }) => {
    setTeams(newTeams.map(t => ({ ...t, score: 0 })));
    setWinPoints(points);
    setCurrentTeamIdx(0);
    setPsychicIndices([0, 0]);

    const shuffled = shuffleCards();
    setDeck(shuffled);
    setDeckIndex(0);

    const newTarget = Math.floor(Math.random() * NUM_POSITIONS);
    setTarget(newTarget);
    setCurrentCard(shuffled[0]);
    setClue('');
    setGuess(10);
    setPhase(PHASES.PSYCHIC);
  }, []);

  const startNextRound = useCallback(() => {
    // Advance psychic index for the team that just played
    const newPsychicIndices = [...psychicIndices];
    newPsychicIndices[currentTeamIdx] =
      (psychicIndices[currentTeamIdx] + 1) % teams[currentTeamIdx].players.length;
    setPsychicIndices(newPsychicIndices);

    // Switch to other team
    setCurrentTeamIdx(prev => (prev === 0 ? 1 : 0));

    // Next card from deck
    let nextIdx = deckIndex + 1;
    let currentDeck = deck;
    if (nextIdx >= currentDeck.length) {
      currentDeck = shuffleCards();
      setDeck(currentDeck);
      nextIdx = 0;
    }
    setDeckIndex(nextIdx);

    const newTarget = Math.floor(Math.random() * NUM_POSITIONS);
    setTarget(newTarget);
    setCurrentCard(currentDeck[nextIdx]);
    setClue('');
    setGuess(10);
    setPhase(PHASES.PSYCHIC);
  }, [currentTeamIdx, psychicIndices, teams, deckIndex, deck]);

  const handlePsychicDone = () => setPhase(PHASES.TRANSITION);
  const handleTransitionDone = () => setPhase(PHASES.GUESSER);

  const calculateScore = (t, g) => {
    const diff = Math.abs(t - g);
    if (diff === 0) return 4;
    if (diff === 1) return 3;
    if (diff === 2) return 2;
    return 0;
  };

  const handleGuesserDone = () => {
    const score = calculateScore(target, guess);
    setRoundScore(score);

    // Add score to the team
    setTeams(prev => prev.map((t, i) =>
      i === currentTeamIdx ? { ...t, score: t.score + score } : t
    ));
    setPhase(PHASES.REVEAL);
  };

  const handleRevealNext = () => {
    if (teams[currentTeamIdx].score >= winPoints) {
      setPhase(PHASES.WIN);
    } else {
      startNextRound();
    }
  };

  const handlePlayAgain = () => {
    setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
    setPhase(PHASES.SETUP);
  };

  const winnerTeamIdx = teams[0].score >= winPoints ? 0 : 1;

  return (
    <div className="app-container">
      {phase === PHASES.SETUP && (
        <SetupScreen
          initialTeams={teams}
          initialPoints={winPoints}
          onStart={handleSetupDone}
        />
      )}

      {phase === PHASES.PSYCHIC && (
        <PsychicScreen
          target={target}
          clue={clue}
          setClue={setClue}
          onConfirm={handlePsychicDone}
          card={currentCard}
          psychic={psychic}
          guesser={guesser}
          teams={teams}
          currentTeamIdx={currentTeamIdx}
          winPoints={winPoints}
        />
      )}

      {phase === PHASES.TRANSITION && (
        <TransitionScreen
          onReady={handleTransitionDone}
          guesser={guesser}
          teamName={currentTeam.name}
          currentTeamIdx={currentTeamIdx}
        />
      )}

      {phase === PHASES.GUESSER && (
        <GuesserScreen
          clue={clue}
          guess={guess}
          setGuess={setGuess}
          onConfirm={handleGuesserDone}
          card={currentCard}
          guesser={guesser}
          teams={teams}
          currentTeamIdx={currentTeamIdx}
          winPoints={winPoints}
        />
      )}

      {phase === PHASES.REVEAL && (
        <RevealScreen
          clue={clue}
          guess={guess}
          target={target}
          score={roundScore}
          onNext={handleRevealNext}
          card={currentCard}
          psychic={psychic}
          guesser={guesser}
          teams={teams}
          currentTeamIdx={currentTeamIdx}
          winPoints={winPoints}
        />
      )}

      {phase === PHASES.WIN && (
        <WinScreen
          winnerTeamIdx={winnerTeamIdx}
          teams={teams}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}

export default App;
