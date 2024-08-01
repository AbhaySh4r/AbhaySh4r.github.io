let secretWord;
let dotProductList = [];
let attemptHistory = [];

// Function to setup, loading JSON file and calculate distances
async function setup_contextofolio() {
  try {
    const response = await fetch('word_embedding/word_embeddings.json');

    if (!response.ok) {
      throw new Error('Failed to load JSON file');
    }

    const data = await response.json();

    // Accessing words and embeddings
    for (const word in data) {
      if (data.hasOwnProperty(word)) {
        const embedding = data[word];
        // Use word and embedding as needed in your code
        // console.log(`${word}: ${embedding}`);
      }
    }

    const words = Object.keys(data);
    const currentDate = new Date();
    const seed = currentDate.getDate();
    Math.seedrandom(seed);

    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    const randomIndex = getRandomInt(0, words.length - 1);
    secretWord = words[randomIndex];
    console.log('You think you can find the Secret Word here? You found it ->', secretWord);

    const randomEmbedding = data[secretWord];
    
    words.forEach(word => {
      const embedding = data[word];
      const dotProduct = calculateDotProduct(randomEmbedding, embedding);
      dotProductList.push({ word, dotProduct });
    });

    dotProductList.sort((a, b) => b.dotProduct - a.dotProduct);

    const firstWordInList = dotProductList[0].word;
    //console.log('First Word in Sorted List:', firstWordInList);

    function calculateDotProduct(arr1, arr2) {
      return arr1.reduce((sum, value, index) => sum + value * arr2[index], 0);
    }
  } catch (error) {
    console.error('Error loading JSON file:', error.message);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  setup_contextofolio();
});

// Function to submit a guess
function submitGuess() {
  const guessInput = document.getElementById('guessInput');
  let guess = guessInput.value.toLowerCase();

  
  // Replace spaces with empty strings
  guess = guess.replace(/ /g, '');

  if (!/^[a-z0-9]+$/.test(guess)) {
    displayResult('Please enter a valid word');
    return;
  }

  const alreadyGuessed = attemptHistory.find(item => item.word === guess);

  if (alreadyGuessed) {
    displayResult(`You have already tried '${guess}'. It is in position ${alreadyGuessed.position}. Try again.`);
  }
  else{
    const guessedWordIndex = dotProductList.findIndex(item => item.word === guess);

    if (guessedWordIndex !== -1) {
      const position = guessedWordIndex + 1;

      if (guess === secretWord) {
        displayResult(`Congratulations! You found the secret word. You get a secret access to my very personal instagram account https://www.instagram.com/yusk1111111/`);
      } 
      else {
        displayResult(`Your word "${guess}" is at position ${position}. Keep guessing!`);
      }

      attemptHistory.push({ word: guess, position });
      attemptHistory.sort((a, b) => a.position - b.position);
    } 
    else {
      // spell check
      corrected_word = correction(guess)
            
      // if the guessed word is not close to any of the words in the portfolio
      if (guess==corrected_word) {
        displayResult(`Sorry, '${guess}' is not in this portfolio. Try again.`);
      }
      else {
        displayResult(`Cannot find '${guess}', did you mean '${corrected_word}'?`);
      }
    }
  }

  // Hide the "How to play" section
  hideHowToPlay();

  // Display attempt history
  displayAttemptHistory();

  // Clear the input field
  guessInput.value = '';
}

// Function to display the result
function displayResult(message) {
  document.getElementById('result').textContent = message;
}

// Function to display attempt history
function displayAttemptHistory() {
  const historyList = document.getElementById('attemptHistory');
  historyList.innerHTML = '';

  const maxDistance = dotProductList.length;

  attemptHistory.forEach(attempt => {
    const listItem = document.createElement('li');

    // Calculate the color based on the proximity to the secret word
    const proximity = attempt.position / maxDistance;
    const backgroundColor = getColorByProximity(proximity);

    listItem.innerHTML = `<span class="color-indicator"></span> <span class="word">${attempt.word}</span> <strong class="position">${attempt.position}</strong>`;
    listItem.style.background = `linear-gradient(to right, ${backgroundColor} ${(1- proximity) * 100}%, transparent ${proximity * 10}%)`;
    historyList.appendChild(listItem);
  });
}

// Function to calculate color based on proximity
function getColorByProximity(proximity) {
  const greenHue = 120; // Fixed hue for green
  const redHue = 0; // Fixed hue for red
  const darkGreenLightness = 30; // Lightness for darker green
  const lightness = darkGreenLightness + proximity * (70 - darkGreenLightness); // Adjust the lightness for the transition

  // Interpolate between green and red based on proximity
  const interpolatedHue = (1 - proximity) * greenHue + proximity * redHue;

  return `hsl(${interpolatedHue}, 100%, ${lightness}%)`;
}

// Function to hide the "How to play" section
function hideHowToPlay() {
  const howToPlaySection = document.getElementById('howToPlaySection');
  howToPlaySection.classList.add('hidden');
}

// Function to toggle the visibility of the "How to play" section
function toggleHowToPlay() {
  const howToPlaySection = document.getElementById('howToPlaySection');
  howToPlaySection.classList.toggle('hidden');
}

function hint() {
  let hint;

  // If attemptHistory is empty, guess becomes the word in the middle of dotProductList
  if (attemptHistory.length === 0) {
    const middleIndex = Math.floor(dotProductList.length / 2);
    const middleWord = dotProductList[middleIndex].word;
    hint = middleWord;
  } else {
    // If attemptHistory has words, guess becomes the word with half of the best position value in the attemptHistory
    const bestAttempt = attemptHistory.reduce((prev, current) =>
      prev.position < current.position ? prev : current
    );

    const hintPosition = Math.floor(bestAttempt.position / 2);
    hint = dotProductList[hintPosition].word;
  }

  // Type hint into the guess input field
  const guessInput = document.getElementById('guessInput');
  guessInput.value = hint;

  // Then submit Guess 
  submitGuess();
}
