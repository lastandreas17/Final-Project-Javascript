const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const gameSection = document.getElementById("game-section");
const gridContainer = document.getElementById("grid-container");
const gameMessage = document.getElementById("game-message");

let token = "";
let targetWord = "";
let currentRow = 0;
let currentCol = 0;
const maxRows = 6;
const maxCols = 5;

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("https://delta-indie.vercel.app/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
      token = result.token;
      document.getElementById("login-section").style.display = "none";
      gameSection.style.display = "block";
      startGame();
    } else {
      loginError.textContent = result.message || "Login failed.";
    }
  } catch (error) {
    loginError.textContent = "An error occurred during login.";
  }
});

async function fetchWord() {
  try {
    const response = await fetch("https://delta-indie.vercel.app/api/random-word-api.herokuapp.com/word");
    const result = await response.json();
    if (response.ok) {
      return result.word.toUpperCase();
    }
    throw new Error("Failed to fetch word");
  } catch (error) {
    console.error(error);
    return "ERROR";
  }
}

async function startGame() {
  targetWord = await fetchWord();
  gridContainer.innerHTML = "";
  gameMessage.textContent = "";
  currentRow = 0;
  currentCol = 0;

  for (let row = 0; row < maxRows; row++) {
    const rowElement = document.createElement("div");
    rowElement.classList.add("row");
    for (let col = 0; col < maxCols; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.setAttribute("data-row", row);
      cell.setAttribute("data-col", col);
      rowElement.appendChild(cell);
    }
    gridContainer.appendChild(rowElement);
  }

  document.addEventListener("keydown", handleInput);
}

function handleInput(event) {
  if (currentRow >= maxRows) return;

  const key = event.key.toUpperCase();
  if (key === "BACKSPACE" && currentCol > 0) {
    currentCol--;
    const cell = getCell(currentRow, currentCol);
    cell.textContent = "";
    return;
  }

  if (key === "ENTER" && currentCol === maxCols) {
    submitGuess();
    return;
  }

  if (key.match(/^[A-Z]$/) && currentCol < maxCols) {
    const cell = getCell(currentRow, currentCol);
    cell.textContent = key;
    currentCol++;
  }
}

function getCell(row, col) {
  return gridContainer.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
}

function submitGuess() {
  const guess = Array.from({ length: maxCols }, (_, i) => getCell(currentRow, i).textContent).join("");

  if (guess.length !== maxCols) {
    gameMessage.textContent = "Please complete the word.";
    return;
  }

  const guessResult = checkGuess(guess);
  guessResult.forEach((result, i) => {
    const cell = getCell(currentRow, i);
    cell.classList.add(result);
  });

  if (guess === targetWord) {
    gameMessage.textContent = "Congratulations! You guessed the word.";
    document.removeEventListener("keydown", handleInput);
    return;
  }

  currentRow++;
  currentCol = 0;
  if (currentRow === maxRows) {
    gameMessage.textContent = `Game over! The word was: ${targetWord}`;
    document.removeEventListener("keydown", handleInput);
  }
}

function checkGuess(guess) {
  const result = Array(maxCols).fill("wrong");
  const targetArray = targetWord.split("");

  guess.split("").forEach((char, i) => {
    if (char === targetArray[i]) {
      result[i] = "correct";
      targetArray[i] = null;
    }
  });

  guess.split("").forEach((char, i) => {
    if (result[i] !== "correct" && targetArray.includes(char)) {
      result[i] = "misplaced";
      targetArray[targetArray.indexOf(char)] = null;
    }
  });

  return result;
}
