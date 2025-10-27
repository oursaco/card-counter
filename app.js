(() => {
  const homeScreen = document.getElementById('home-screen');
  const trainerScreen = document.getElementById('trainer-screen');
  const configForm = document.getElementById('config-form');
  const inputL = document.getElementById('input-l');
  const inputR = document.getElementById('input-r');
  const formError = document.getElementById('form-error');
  const startBtn = document.getElementById('start-btn');
  const backBtn = document.getElementById('back-btn');
  const dealArea = document.getElementById('deal-area');
  const cardImg = document.getElementById('card-img');
  const cardsSeenEl = document.getElementById('cards-seen');
  const quizOverlay = document.getElementById('quiz-overlay');
  const optionsEl = document.getElementById('options');
  const feedbackEl = document.getElementById('feedback');
  const continueBtn = document.getElementById('continue-btn');
  const checkBtn = document.getElementById('check-btn');

  const IMG_BASE = 'https://deckofcardsapi.com/static/img/';

  let minInterval = 7;
  let maxInterval = 10;
  let runningCount = 0;
  let cardsSeen = 0;
  let nextQuizIn = 0;
  let overlayOpen = false;

  // Restore saved values if present
  try {
    const savedL = localStorage.getItem('cc_minInterval');
    const savedR = localStorage.getItem('cc_maxInterval');
    if (savedL) inputL.value = String(savedL);
    if (savedR) inputR.value = String(savedR);
  } catch {}

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function rankToCode(rank) {
    // Deck of Cards API uses '0' for 10
    return rank === '10' ? '0' : rank;
  }

  function getRandomCard() {
    const suits = ['S', 'H', 'D', 'C'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = suits[randInt(0, suits.length - 1)];
    const rank = ranks[randInt(0, ranks.length - 1)];
    const code = `${rankToCode(rank)}${suit}`;
    const imgUrl = `${IMG_BASE}${code}.png`;
    return { rank, suit, imgUrl };
  }

  function hiLoDelta(rank) {
    if (rank === 'A' || rank === '10' || rank === 'J' || rank === 'Q' || rank === 'K') return -1;
    if (rank === '2' || rank === '3' || rank === '4' || rank === '5' || rank === '6') return +1;
    return 0; // 7,8,9
  }

  function showCard() {
    const card = getRandomCard();
    cardImg.src = card.imgUrl;
    cardImg.alt = `${card.rank} of ${suitName(card.suit)}`;
    runningCount += hiLoDelta(card.rank);
    cardsSeen += 1;
    cardsSeenEl.textContent = String(cardsSeen);

    if (nextQuizIn > 0) {
      nextQuizIn -= 1;
      if (nextQuizIn === 0) {
        requestQuiz();
      }
    }
  }

  function suitName(s) {
    switch (s) {
      case 'S': return 'Spades';
      case 'H': return 'Hearts';
      case 'D': return 'Diamonds';
      case 'C': return 'Clubs';
      default: return 'Unknown';
    }
  }

  function startTraining() {
    runningCount = 0;
    cardsSeen = 0;
    cardsSeenEl.textContent = '0';
    overlayOpen = false;
    nextQuizIn = randInt(minInterval, maxInterval);
    homeScreen.classList.add('hidden');
    trainerScreen.classList.remove('hidden');
    trainerScreen.setAttribute('aria-hidden', 'false');
    showCard();
  }

  function backToHome() {
    trainerScreen.classList.add('hidden');
    trainerScreen.setAttribute('aria-hidden', 'true');
    homeScreen.classList.remove('hidden');
    overlayOpen = false;
    hideQuiz();
  }

  let currentGuess = 0;

  function requestQuiz() {
    overlayOpen = true;
    currentGuess = 0;
    renderAdjustableQuiz();
    quizOverlay.classList.remove('hidden');
    feedbackEl.textContent = '';
    continueBtn.classList.add('hidden');
  }

  function hideQuiz() {
    quizOverlay.classList.add('hidden');
    optionsEl.innerHTML = '';
  }

  function renderAdjustableQuiz() {
    optionsEl.innerHTML = '';

    const guessDisplay = document.createElement('div');
    guessDisplay.className = 'guess-display';
    const guessLabel = document.createElement('span');
    guessLabel.textContent = 'Your guess:';
    const guessValue = document.createElement('strong');
    guessValue.id = 'guess-value';
    guessValue.textContent = String(currentGuess);
    guessDisplay.appendChild(guessLabel);
    guessDisplay.appendChild(guessValue);

    const adjustGrid = document.createElement('div');
    adjustGrid.className = 'adjust-grid';
    const steps = [-10, -5, -1, +1, +5, +10];
    for (const step of steps) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'adjust-btn';
      btn.textContent = step > 0 ? `+${step}` : String(step);
      btn.addEventListener('click', () => {
        currentGuess += step;
        guessValue.textContent = String(currentGuess);
      });
      adjustGrid.appendChild(btn);
    }

    optionsEl.appendChild(guessDisplay);
    optionsEl.appendChild(adjustGrid);
  }

  // Events
  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    formError.textContent = '';
    const l = Number(inputL.value);
    const r = Number(inputR.value);
    if (!Number.isInteger(l) || !Number.isInteger(r) || l < 1 || r < 1) {
      formError.textContent = 'Enter positive integers for l and r.';
      return;
    }
    if (l > r) {
      formError.textContent = 'Ensure l ≤ r.';
      return;
    }
    minInterval = l;
    maxInterval = r;
    try {
      localStorage.setItem('cc_minInterval', String(l));
      localStorage.setItem('cc_maxInterval', String(r));
    } catch {}
    startTraining();
  });

  backBtn.addEventListener('click', () => {
    backToHome();
  });

  dealArea.addEventListener('click', () => {
    if (overlayOpen) return;
    showCard();
  });
  dealArea.addEventListener('keydown', (e) => {
    if (overlayOpen) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      showCard();
    }
  });

  continueBtn.addEventListener('click', () => {
    hideQuiz();
    overlayOpen = false;
    nextQuizIn = randInt(minInterval, maxInterval);
  });

  checkBtn.addEventListener('click', () => {
    const correct = runningCount;
    if (currentGuess === correct) {
      feedbackEl.textContent = 'Correct';
    } else {
      feedbackEl.textContent = `Wrong · Correct: ${correct}`;
    }
    continueBtn.classList.remove('hidden');
  });
})();


