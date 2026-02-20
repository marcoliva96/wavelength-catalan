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
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled;
}

function App() {
  // ── Players ──
  const [player1, setPlayer1] = useState({ name: '', avatar: '😎', score: 0 });
  const [player2, setPlayer2] = useState({ name: '', avatar: '🤩', score: 0 });
  const [winPoints, setWinPoints] = useState(10);

  // ── Game state ──
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [currentPsychic, setCurrentPsychic] = useState(1); // 1 or 2
  const [target, setTarget] = useState(10);
  const [clue, setClue] = useState('');
  const [guess, setGuess] = useState(10);
  const [roundScore, setRoundScore] = useState(0);
  const [currentCard, setCurrentCard] = useState(cards[0]);
  const [deck, setDeck] = useState([]);
  const [deckIndex, setDeckIndex] = useState(0);

  const psychic = currentPsychic === 1 ? player1 : player2;
  const guesser = currentPsychic === 1 ? player2 : player1;

  const handleSetupDone = useCallback(({ p1, p2, points }) => {
    setPlayer1({ ...p1, score: 0 });
    setPlayer2({ ...p2, score: 0 });
    setWinPoints(points);
    setCurrentPsychic(1);

    // Shuffle deck
    const shuffled = shuffleCards();
    setDeck(shuffled);
    setDeckIndex(0);

    // Start first round
    const newTarget = Math.floor(Math.random() * NUM_POSITIONS);
    setTarget(newTarget);
    setCurrentCard(shuffled[0]);
    setClue('');
    setGuess(10);
    setPhase(PHASES.PSYCHIC);
  }, []);

  const startNextRound = useCallback(() => {
    // Swap psychic
    const nextPsychic = currentPsychic === 1 ? 2 : 1;
    setCurrentPsychic(nextPsychic);

    // Next card from deck
    let nextIdx = deckIndex + 1;
    let currentDeck = deck;
    if (nextIdx >= currentDeck.length) {
      // Reshuffle
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
  }, [currentPsychic, deckIndex, deck]);

  const handlePsychicDone = () => {
    setPhase(PHASES.TRANSITION);
  };

  const handleTransitionDone = () => {
    setPhase(PHASES.GUESSER);
  };

  const calculateScore = (target, guess) => {
    const diff = Math.abs(target - guess);
    if (diff === 0) return 4;
    if (diff === 1) return 3;
    if (diff === 2) return 2;
    return 0;
  };

  const handleGuesserDone = () => {
    const score = calculateScore(target, guess);
    setRoundScore(score);

    // Add score to the guesser's total
    const guesserNum = currentPsychic === 1 ? 2 : 1;
    if (guesserNum === 1) {
      const newScore = player1.score + score;
      setPlayer1(prev => ({ ...prev, score: newScore }));
      if (newScore >= winPoints) {
        setPhase(PHASES.REVEAL); // Show reveal first, then win
      } else {
        setPhase(PHASES.REVEAL);
      }
    } else {
      const newScore = player2.score + score;
      setPlayer2(prev => ({ ...prev, score: newScore }));
      setPhase(PHASES.REVEAL);
    }
  };

  const handleRevealNext = () => {
    // Check if someone won (scores were already updated)
    const guesserNum = currentPsychic === 1 ? 2 : 1;
    const guesserScore = guesserNum === 1 ? player1.score : player2.score;
    if (guesserScore >= winPoints) {
      setPhase(PHASES.WIN);
    } else {
      startNextRound();
    }
  };

  const handlePlayAgain = () => {
    setPlayer1(prev => ({ ...prev, score: 0 }));
    setPlayer2(prev => ({ ...prev, score: 0 }));
    setPhase(PHASES.SETUP);
  };

  const winner = player1.score >= winPoints ? player1 : player2;

  return (
    <div className="app-container">
      {phase === PHASES.SETUP && (
        <SetupScreen
          initialP1={player1}
          initialP2={player2}
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
          player1={player1}
          player2={player2}
          winPoints={winPoints}
        />
      )}

      {phase === PHASES.TRANSITION && (
        <TransitionScreen
          onReady={handleTransitionDone}
          guesser={guesser}
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
          player1={player1}
          player2={player2}
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
          player1={player1}
          player2={player2}
          winPoints={winPoints}
        />
      )}

      {phase === PHASES.WIN && (
        <WinScreen
          winner={winner}
          player1={player1}
          player2={player2}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}

export default App;
