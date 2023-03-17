import { Button, Input } from '@mui/material';
import { useEffect, useState } from 'react';
import { decrypt, encrypt } from '../../util/util';
import POSSIBLE_ANSWERS from './wordle-answers.json';
import VALID_WORDS from './wordle-words.json';

const SECRET = '13-6';

function generateWord(): string {
  return POSSIBLE_ANSWERS[Math.floor(Math.random() * POSSIBLE_ANSWERS.length)]
}

type Color = 'gray' | 'green' | 'yellow';

function evaluateGuess(guess: string, answer: string): Color[] {
  const answerLetterCounts = getLetterCounts(answer);
  const colors: Color[] = [];

  for (let i = 0; i < answer.length; i += 1) {
    // check for match
    let match: Color | undefined = undefined
    if (guess[i] === answer[i]) {
      match = 'green';
    } else
    // check for yellow and update letter counts if applicable
    if (answerLetterCounts[guess[i]] !== undefined) {
      match = 'yellow';
    }
    if (match) {
      colors.push(match);
      answerLetterCounts[guess[i]] -= 1;
      if (answerLetterCounts[guess[i]] === 0) {
        delete answerLetterCounts[guess[i]];
      }
      continue;
    }
    // no match at all
    colors.push('gray');
  }

  return colors;
}

type LetterCounts = {
  [key in string]: number;
}

function getLetterCounts(word: string): LetterCounts {
  const counts: LetterCounts = {};
  for (const letter of word) {
    if (counts[letter] === undefined) {
      counts[letter] = 1;
    } else {
      counts[letter] += 1;
    }
  }
  return counts;
}

function range(exclusiveMax: number): number[] {
  return Array.from(Array(exclusiveMax).keys());
}

const DisplayGuess = ({ value, evaluation }: { value: string, evaluation: Color[] }) => {
  return (
    <div style={{overflow: 'hidden'}} key={value}>
      {range(value.length).map(i => <div style={{float: 'left', backgroundColor: evaluation[i], width: 20}} key={i}>{value[i].toUpperCase()}</div>)}
    </div>
  )
}

const WordlePage = ({ cipherText }: { cipherText?: string }) => {
  const [answer, setAnswer] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [results, setResults] = useState<Color[][]>([]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameIsActive, setGameIsActive] = useState<boolean>(true);

  useEffect(() => setAnswer(cipherText ? decrypt(SECRET, cipherText) : generateWord()), []); 

  function submitGuess() {
    if (!gameIsActive) {
      return;
    }
    if (guesses.find(guess => guess === inputValue)) {
      return;
    }
    if (inputValue.length !== 5) {
      console.log('guess was not the right length');
      return;
    }
    if (!VALID_WORDS.find(s => s === inputValue)) {
      console.log('not a valid guess');
      return;
    }
    const result = evaluateGuess(inputValue, answer);

    setResults([...results, result]);
    setGuesses([...guesses, inputValue]);
    setInputValue('');

    if (inputValue === answer) {
      onGameEnd(true);
    } else if (results.length + 1 === 6) {
      onGameEnd(false);
    }
  }

  function onGameEnd(won: boolean) {
    if (won) {
      console.log('You won! :)');
    } else {
      console.log('You lose... :(');
    }
    setGameIsActive(false);
  }

  return (
    <div>
      <div>
        <h1>Guesses</h1>
        <div>
          {range(guesses.length).map(i => (
            <div key={i}>
              <DisplayGuess value={guesses[i]} evaluation={results[i]}/>
            </div>
          ))}
        </div>
      </div>
      <Input
        value={inputValue}
        onChange={event => setInputValue(event.target.value)} 
        autoComplete='off'
        onKeyDown={event => event.key === 'Enter' && submitGuess()}
      />
      <Button variant='text' onClick={submitGuess} size='large'>Guess</Button>
      <div>Share: jaron-cui.github.io/#/wordle/{encrypt(SECRET, answer)}</div>
    </div>
  );
}

export default WordlePage;