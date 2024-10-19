"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function HomePage() {
  const [objectName, setObjectName] = useState('');
  const [error, setError] = useState('');
  const [imageSrc, setImageSrc] = useState('');
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [levelLoading, setLevelLoading] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [userGuess, setUserGuess] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false); // Track game over state
  const [incorrectAnswerMessage, setIncorrectAnswerMessage] = useState(''); // Message for incorrect answer

  const gatewayUrl = "https://dream-gateway.livepeer.cloud/text-to-image";
  const modelId = "SG161222/RealVisXL_V4.0_Lightning";

  const objectOptions = ['Monster', 'Llama', 'Penguin'];

  const handleObjectSelect = (name: string) => {
    setObjectName(name);
    setError('');
  };

  const handleSubmit = async () => {
    if (!objectName) {
      setError('Please select an object.');
      return;
    }

    setLoading(true);
    const randomItemCount = Math.floor(Math.random() * 11);
    setCorrectAnswer(randomItemCount);

    try {
      const response = await axios.post(gatewayUrl, {
        model_id: modelId,
        prompt: `A quirky, whimsical, colorful scene in Singapore style with ${randomItemCount} hidden ${objectName}(s), Michael Ryba style`,
        width: 512,
        height: 512
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.images && response.data.images.length > 0) {
        setImageSrc(response.data.images[0].url);
        setTimeout(() => setShowControls(true), 2000); // Delay dropdown/button by 2 seconds
      } else {
        setError('Image generation failed. Please try again.');
      }

      setIsPlaying(true);
      setTimeLeft(30 - (level - 1) * 5); // Decrease timer by 5 seconds for each level
      setFound(false);
      setUserGuess(null); // Reset user guess for each stage
      setIsGameOver(false); // Reset game over state
      setIncorrectAnswerMessage(''); // Reset incorrect answer message
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Error generating image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && isPlaying) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      setIsGameOver(true); // Set game over state
      setIncorrectAnswerMessage(`Time out. Congrats, you completed ${level - 1} levels!`);
    }
  }, [timeLeft, isPlaying]);

  const handleNextLevel = async () => {
    setLevelLoading(true);
    setLevel(level + 1);
    await handleSubmit();
    setLevelLoading(false);
  };

  const handleRetry = () => {
    // Reset all states for a new game
    setLevel(1);
    setTimeLeft(30);
    setImageSrc('');
    setObjectName('');
    setIsPlaying(false);
    setUserGuess(null); // Reset guess on retry
    setError('');
    setFound(false);
    setShowControls(false); // Reset controls visibility
    setIsGameOver(false); // Reset game over state
    setIncorrectAnswerMessage(''); // Reset incorrect answer message
  };

  const handleGuessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserGuess(parseInt(e.target.value, 10));
  };

  const checkAnswer = () => {
    if (userGuess === correctAnswer) {
      setFound(true);
      setIsPlaying(false);
    } else {
      setIncorrectAnswerMessage(`That is not correct. Correct answer: ${correctAnswer}. Congrats, you have completed ${level} levels!`);
      setIsGameOver(true); // Set game over state
      setIsPlaying(false);
    }
  };

  return (
    <div className="main-container">
      <header>
        <h1 className="title">Find It Fast!</h1>
      </header>
      {!isPlaying && !found && !isGameOver && (
        <div className="start-section">
          <p className="instructions">Select an object and start the game.</p>
          <div className="radio-group">
            {objectOptions.map((option) => (
              <label key={option} className="radio-label">
                <input 
                  type="radio" 
                  name="object" 
                  value={option} 
                  onChange={() => handleObjectSelect(option)} 
                  className="radio-input"
                  required // Ensure selection is required
                />
                {option}
              </label>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <button onClick={handleSubmit} className="start-btn">Start</button>
          {loading && <p className="loading">Generating image...</p>}
        </div>
      )}

      {isPlaying && (
        <div className="game-section">
          <div className="game-header">
            <div className="level-info">Level: {level}</div>
            <div className="timer-info">Time Left: {timeLeft} seconds</div>
          </div>
          <div className="image-container">
            {loading ? (
              <p className="loading">Loading...</p>
            ) : (
              <>
                <img
                  src={imageSrc}
                  alt="Generated scene"
                  className="game-image"
                />
                {showControls && (
                  <div className="guess-section">
                    <label htmlFor="item-guess">How many {objectName}(s) do you see?</label>
                    <select
                      id="item-guess"
                      onChange={handleGuessChange}
                      value={userGuess || ''}
                      className="dropdown"
                    >
                      <option value="" disabled>Select number</option>
                      {[...Array(11).keys()].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                    <button onClick={checkAnswer} className="submit-btn">Submit</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {found && (
        <div className="next-level-section">
          <p className="congrats-msg">Congrats, you found the correct number of {objectName}(s)!</p>
          <button onClick={handleNextLevel} className="next-btn">
            {levelLoading ? 'Generating next level...' : 'Advance to Next Level'}
          </button>
        </div>
      )}

      {isGameOver && (
        <div className="retry-section">
          <p className="failure-msg">{incorrectAnswerMessage}</p>
          <button onClick={handleRetry} className="retry-btn">Try Again</button>
        </div>
      )}
    </div>
  );
}
