import { Button, Input } from '@mui/material';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { CopyButton } from '../../component/Buttons';
import { CENTERED_VERTICAL } from '../../util/styles';
import { decrypt, encrypt } from '../../util/util';
import POSSIBLE_ANSWERS from './wordle-answers.json';
import VALID_WORDS from './wordle-words.json';

const SECRET = '13-6';

function generateWord(): string {
  return POSSIBLE_ANSWERS[Math.floor(Math.random() * POSSIBLE_ANSWERS.length)]
}

type Color = 'gray' | 'green' | 'yellow';

type GameResult = 'won' | 'lost';

function evaluateGuess(guess: string, answer: string): Color[] {
  const answerLetterCounts = getLetterCounts(answer);
  const colors: Color[] = [];

  function decrementLetter(letter: string): void {
      answerLetterCounts[letter] -= 1;
      if (answerLetterCounts[letter] === 0) {
        delete answerLetterCounts[letter];
      }
  }

  for (let i = 0; i < answer.length; i += 1) {
    console.log(JSON.stringify(answerLetterCounts))
    // check for match
    if (guess[i] === answer[i]) {
      decrementLetter(guess[i]);
      colors.push('green');
    } else {
      colors.push('gray');
    }
  }

  for (let i = 0; i < colors.length; i += 1) {
    if (colors[i] === 'gray' && answerLetterCounts[guess[i]]) {
      decrementLetter(guess[i]);
      colors[i] = 'yellow';
    }
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

const COLOR_CHARACTERS = {
  'gray': '⬜',
  'yellow': '🟨',
  'green': '🟩'
}

function formatGameURL(answer?: string): string {
  const ending = answer ? '/' + encrypt(SECRET, answer) : '';
  return window.location.origin + '/#/wordle' + ending;
}

function formatEvaluationString(evaluation: Color[]): string {
  return evaluation.map(color => COLOR_CHARACTERS[color]).join('');
}

function formatResultString(answer: string, result: GameResult, evaluations: Color[][]): string {
  const id = encrypt(SECRET, answer);
  const score = (result === 'won' ? evaluations.length : 'X') + '/6';
  const boxes = evaluations.map(formatEvaluationString).join('\n');
  return 'Jardle ' + id + ' ' + score + '\n\n' + boxes + '\n' + formatGameURL(answer);
}

function range(exclusiveMax: number): number[] {
  return Array.from(Array(exclusiveMax).keys());
}

const BACKGROUND_COLORS = {
  'gray': '#BBBBBB',
  'yellow': '#FFCC33',
  'green': '#88CC88'
}

const DisplayGuess = ({ value, evaluation }: { value: string, evaluation: Color[] }) => {
  return (
    <div style={{overflow: 'hidden'}} key={value}>
      {range(value.length).map(i => (
          <div
            style={{
              float: 'left',
              borderRadius: 5,
              backgroundColor: BACKGROUND_COLORS[evaluation[i]],
              height: 40,
              width: 40,
              textAlign: 'center',
              fontSize: 30,
              fontWeight: 'bold',
              userSelect: 'none'
            }}
            key={i}
          >
            {value[i].toUpperCase()}
          </div>
        ))}
    </div>
  )
}

function title(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MEAN_MESSAGES = [
  ['I can\'t believe you didn\'t know what ', ' meant.'],
  ['Didn\'t you learn the word \'', '\' in school??'],
  ['Embarrassing... it was \'', '\'.'],
  ['Here\'s your hint for the 7th guess: ', '.'],
  ['You don\'t know. ', ''],
  ['Bruh. It was ', '.'],
  ['It was ', '...'],
  ['\'', '\'.'],
  ['Suck my ', '.'],
  ['That\'s kinda sad... it was ', '.'],
  ['Only hot people guessed ', ' correctly.']
];

function endsWith(word: string, ...endings: string[]): boolean {
  for (const ending of endings) {
    if (ending.length <= word.length && word.slice(word.length - ending.length) === ending) {
      return true;
    }
  }
  return false;
}

function getLoseMessage(answer: string): string {
  if (endsWith(answer, 'er', 'ir', 'or', 'ur')) {
    return title(answer) + '? I hardly know her!';
  }
  if (endsWith(answer, 'im', 'em', 'am', 'um')) {
    return title(answer) + '? I hardly know him!';
  }
  if (endsWith(answer, 'ed')) {
    return 'I ' + answer + ' your mom.';
  }
  if (endsWith(answer, 'an', 'in', 'en', 'un', 'on')) {
    return 'I am currently ' + answer + ' your mom.';
  }
  const [before, after] = MEAN_MESSAGES[Math.floor(Math.random() * MEAN_MESSAGES.length)];
  return before + answer + after;
}

const WordlePage = ({ cipherText }: { cipherText?: string }) => {
  const [answer, setAnswer] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [results, setResults] = useState<Color[][]>([]);
  const [guesses, setGuesses] = useState<string[]>([]);

  const [gameResult, setGameResult] = useState<GameResult>();
  useEffect(() => setAnswer(cipherText ? decrypt(SECRET, cipherText) : generateWord()), []); 

  function submitGuess() {
    const lastGuess = inputValue;
    if (gameResult) {
      return;
    }
    if (guesses.find(guess => guess === lastGuess)) {
      return;
    }
    if (lastGuess.length !== 5) {
      console.log('guess was not the right length');
      return;
    }
    if (!VALID_WORDS.find(s => s === lastGuess)) {
      console.log('not a valid guess');
      return;
    }
    const result = evaluateGuess(lastGuess, answer);

    setResults([...results, result]);
    setGuesses([...guesses, lastGuess]);
    setInputValue('');

    if (lastGuess === answer) {
      onGameEnd(true);
    } else if (results.length + 1 === 6) {
      onGameEnd(false);
    }
  }

  function onGameEnd(won: boolean) {
    if (won) {
      console.log('You won! :)');
      setGameResult('won')
    } else {
      console.log('You lose... :( the word was ' + answer.toUpperCase());
      setGameResult('lost')
    }
  }

  function displayGameResult() {
    if (!gameResult) {
      return <div>
        {shareLink}
        <CopyButton text={shareLink}/>
      </div>;
    }
    const message = gameResult === 'won' ? 'You won!' : getLoseMessage(answer);
    return (
      <div style={{...CENTERED_VERTICAL}}>
        <h4>{message}</h4>
        <div>Share result: <CopyButton text={formatResultString(answer, gameResult, results)}/></div>
        <Confetti width={window.innerWidth * .9} height={window.innerHeight * .9} />
      </div>
    );
  }

  const shareLink = formatGameURL(answer);

  return (
    <div style={{...CENTERED_VERTICAL}}>
      <div>
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
        onChange={event => setInputValue(event.target.value.toLowerCase())} 
        autoComplete='off'
        onKeyDown={event => event.key === 'Enter' && submitGuess()}
      />
      <Button variant='text' onClick={submitGuess} size='large'>Guess</Button>
      <div>
        <Button variant='text' href={'/#/wordle'} onClick={() => {
          window.location.replace('/#/wordle');
          window.location.reload();
        }}>New Game</Button>
      </div>
      <div>
        {displayGameResult()}
      </div>
    </div>
  );
}

export default WordlePage;