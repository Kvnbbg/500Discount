import { getAppConfig } from './config.js';
import { handleError } from './errors.js';
import { createLogger } from './logger.js';
import {
  computeCoinOperations,
  parseCoinsInput,
  parseThreshold,
} from './utils/coin-game.js';
import { safeEvaluateExpression } from './utils/math.js';
import { readStorageValue, writeStorageValue } from './utils/storage.js';

const config = getAppConfig();
const logger = createLogger(config.logLevel);

const aiMessages = [
  'AI: Did you know? Electric cars can accelerate from 0-60 in under 3 seconds.',
  'AI: Giveaway: Enter now for a chance to win bonus points!',
  "AI: Quote: 'The future is electric and full of surprises.'",
  'AI: Imagine a neon skyline where every card tells a unique story.',
  'AI: Fact: Cutting-edge tech drives innovation in every duel.',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setStatusMessage = (element, message) => {
  if (element) {
    element.textContent = message;
  }
};

const initAiLoop = (aiLoopElement) => {
  if (!aiLoopElement) {
    return;
  }

  let aiIndex = 0;

  const updateAiMessage = () => {
    aiLoopElement.classList.add('fade');
    setTimeout(() => {
      aiLoopElement.textContent = aiMessages[aiIndex];
      aiLoopElement.classList.remove('fade');
      aiIndex = (aiIndex + 1) % aiMessages.length;
    }, 500);
  };

  aiLoopElement.addEventListener('click', updateAiMessage);
  setInterval(updateAiMessage, config.aiMessageIntervalMs);
};

const initQuests = ({ checkboxes, progressBar, scoreDisplay }) => {
  if (!checkboxes || checkboxes.length === 0) {
    return {
      resetTasks: () => {},
      validateNextTask: () => {},
    };
  }

  let score = 0;
  const totalTasks = checkboxes.length;

  const updateProgress = () => {
    const completed = document.querySelectorAll('.task-checkbox:checked').length;
    const percent = totalTasks === 0 ? 0 : (completed / totalTasks) * 100;
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
  };

  const updateScore = (points) => {
    score = Math.max(0, score + points);
    if (scoreDisplay) {
      scoreDisplay.textContent = `${score}`;
    }
  };

  const handleCheckboxChange = (event) => {
    const checkbox = event.currentTarget;
    const label = checkbox.parentElement;

    if (label) {
      label.classList.add('pulse');
      setTimeout(() => {
        label.classList.remove('pulse');
        label.classList.add('swap-clean');
        setTimeout(() => {
          if (checkbox.checked) {
            label.classList.add('done');
            updateScore(10);
          } else {
            label.classList.remove('done');
            updateScore(-10);
          }
          label.classList.remove('swap-clean');
          updateProgress();
        }, 600);
      }, 300);
    }
  };

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });

  const resetTasks = () => {
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        checkbox.checked = false;
        const label = checkbox.parentElement;
        if (label) {
          label.classList.add('swap-clean');
          setTimeout(() => {
            label.classList.remove('swap-clean', 'done');
            updateProgress();
          }, 600);
        }
      }
    });
    score = 0;
    if (scoreDisplay) {
      scoreDisplay.textContent = '0';
    }
  };

  const validateNextTask = () => {
    const nextTask = Array.from(checkboxes).find((checkbox) => !checkbox.checked);
    if (nextTask) {
      nextTask.checked = true;
      nextTask.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return { resetTasks, validateNextTask, addScore: updateScore };
};

const initMathCalculator = ({ mathInput, calcBtn, mathResult }) => {
  if (!mathInput || !calcBtn || !mathResult) {
    return;
  }

  const calculate = () => {
    const { ok, value, error } = safeEvaluateExpression(mathInput.value);
    if (ok) {
      mathResult.textContent = `Result: ${value}`;
    } else {
      mathResult.textContent = error;
    }
  };

  calcBtn.addEventListener('click', calculate);
  mathInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      calculate();
    }
  });
};

const renderCoins = (coinDisplay, coins) => {
  if (!coinDisplay) {
    return;
  }

  coinDisplay.innerHTML = '';
  coins.forEach((value) => {
    const coinEl = document.createElement('div');
    coinEl.className = 'coin';
    coinEl.textContent = `${value}`;
    coinDisplay.appendChild(coinEl);
  });
};

const initCoinGame = ({
  startCoinGameBtn,
  coinsInput,
  thresholdInput,
  coinDisplay,
  coinLog,
  coinStatus,
  coinError,
}) => {
  if (!startCoinGameBtn || !coinsInput || !thresholdInput) {
    return;
  }

  let isRunning = false;

  const setRunningState = (running) => {
    isRunning = running;
    startCoinGameBtn.disabled = running;
    startCoinGameBtn.textContent = running ? 'Running...' : 'Start Game';
  };

  const runCoinGame = async () => {
    if (isRunning) {
      return;
    }

    setStatusMessage(coinError, '');

    const coins = parseCoinsInput(coinsInput.value);
    const thresholdResult = parseThreshold(thresholdInput.value);

    if (coins.length === 0) {
      setStatusMessage(coinError, 'Enter at least one valid coin value.');
      return;
    }

    if (!thresholdResult.ok) {
      setStatusMessage(coinError, thresholdResult.error);
      return;
    }

    setRunningState(true);
    setStatusMessage(coinStatus, 'Calculating optimal merges...');
    if (coinLog) {
      coinLog.innerHTML = '';
    }

    try {
      const result = computeCoinOperations(coins, thresholdResult.value);
      let workingCoins = [...coins];
      renderCoins(coinDisplay, workingCoins);

      if (result.steps.length === 0) {
        setStatusMessage(
          coinStatus,
          result.success
            ? 'All coins already meet the threshold.'
            : 'Not enough coins to reach the threshold.'
        );
        if (coinLog) {
          coinLog.innerHTML = `<p><strong>Minimum operations required: ${result.operations}</strong></p>`;
        }
        return;
      }

      for (const [index, step] of result.steps.entries()) {
        workingCoins.sort((a, b) => a - b);
        const x = workingCoins.shift();
        const y = workingCoins.shift();
        if (x === undefined || y === undefined) {
          break;
        }
        workingCoins.push(step.newCoin);
        if (coinLog) {
          coinLog.innerHTML += `<p>Operation ${index + 1}: Combined ${x} and ${y} to create ${step.newCoin}</p>`;
        }
        await sleep(config.coinGameStepDelayMs);
        renderCoins(coinDisplay, workingCoins);
      }

      setStatusMessage(
        coinStatus,
        result.success
          ? 'Threshold reached!'
          : 'Unable to reach threshold with the provided coins.'
      );
      if (coinLog) {
        coinLog.innerHTML += `<p><strong>Minimum operations required: ${result.operations}</strong></p>`;
      }
    } catch (error) {
      handleError({
        error,
        logger,
        userMessage: 'Coin game failed. Try different values.',
        statusElement: coinError,
      });
    } finally {
      setRunningState(false);
    }
  };

  startCoinGameBtn.addEventListener('click', () => {
    runCoinGame();
  });
};

const initCommandPalette = ({
  commandInput,
  commandOutput,
  resetTasks,
  validateNextTask,
  toggleTheme,
  triggerEasterEgg,
}) => {
  if (!commandInput || !commandOutput) {
    return;
  }

  const helpText = [
    'Available commands:',
    '• help / --help / ? — show this message',
    '• reset — reset all quests',
    '• next — complete the next quest',
    '• toggle — toggle the theme',
    '• magicword — trigger a bonus event',
  ].join('\n');

  const respond = (message) => {
    commandOutput.textContent = message;
  };

  respond('Ready. Type "help" for commands.');

  commandInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    const command = commandInput.value.trim().toLowerCase();
    if (!command) {
      respond('Enter a command. Type "help" for options.');
      return;
    }

    if (['help', '--help', '?'].includes(command)) {
      respond(helpText);
    } else if (command === 'reset') {
      resetTasks();
      respond('Quests reset. Ready for a new run.');
    } else if (command === 'next') {
      validateNextTask();
      respond('Next quest validated.');
    } else if (command === 'toggle') {
      toggleTheme();
      respond('Theme toggled.');
    } else if (command === 'magicword') {
      triggerEasterEgg();
      respond('Mystery mode activated!');
    } else {
      respond(`Unknown command: ${command}. Type "help" for options.`);
    }

    commandInput.value = '';
  });
};

const initFileActions = (fileLog) => {
  const actionButtons = document.querySelectorAll('[data-file-action]');
  if (!fileLog || actionButtons.length === 0) {
    return;
  }

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.fileAction || 'Action';
      const timestamp = new Date().toLocaleTimeString();
      const entry = document.createElement('p');
      entry.textContent = `[${timestamp}] Action: ${action}`;
      fileLog.appendChild(entry);
      fileLog.scrollTop = fileLog.scrollHeight;
    });
  });
};

const initFolders = () => {
  const folderButtons = document.querySelectorAll('[data-folder-toggle]');

  folderButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.folderToggle;
      const content = document.getElementById(targetId);
      if (!content) {
        return;
      }

      const isOpen = content.style.display === 'block';
      content.style.display = isOpen ? 'none' : 'block';
      button.setAttribute('aria-expanded', String(!isOpen));
    });
  });
};

const initMemo = () => {
  const notesArea = document.getElementById('notesArea');
  const saveNotesBtn = document.getElementById('saveNotesBtn');
  const openMemoBtn = document.getElementById('openMemoBtn');
  const virtualFileContent = document.getElementById('virtualFileContent');
  const appStatus = document.getElementById('appStatus');

  if (notesArea) {
    const savedNotes = readStorageValue('virtualNotes', '');
    notesArea.value = savedNotes || '';
  }

  if (saveNotesBtn && notesArea) {
    saveNotesBtn.addEventListener('click', () => {
      const success = writeStorageValue('virtualNotes', notesArea.value);
      setStatusMessage(
        appStatus,
        success
          ? 'Mémo saved! You can open it in the Quick Memo Viewer.'
          : 'Unable to save the memo. Check browser storage permissions.'
      );
    });
  }

  if (openMemoBtn && notesArea && virtualFileContent) {
    openMemoBtn.addEventListener('click', () => {
      const memoText = notesArea.value.trim();
      if (!memoText) {
        virtualFileContent.textContent = 'No memo saved yet.';
        return;
      }
      virtualFileContent.innerHTML = '';
      const title = document.createElement('p');
      title.textContent = 'Your saved Mémo:';
      const body = document.createElement('p');
      body.textContent = memoText;
      virtualFileContent.append(title, body);
    });
  }
};

const initDraggableWindows = () => {
  const windows = document.querySelectorAll('.window');

  windows.forEach((el) => {
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;
    const header = el.querySelector('.window-header');

    const dragMouseDown = (event) => {
      event.preventDefault();
      pos3 = event.clientX;
      pos4 = event.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    const elementDrag = (event) => {
      event.preventDefault();
      pos1 = pos3 - event.clientX;
      pos2 = pos4 - event.clientY;
      pos3 = event.clientX;
      pos4 = event.clientY;
      el.style.top = `${el.offsetTop - pos2}px`;
      el.style.left = `${el.offsetLeft - pos1}px`;
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
    };

    if (header) {
      header.onmousedown = dragMouseDown;
    } else {
      el.onmousedown = dragMouseDown;
    }
  });
};

const initModals = () => {
  const modalTriggers = document.querySelectorAll('[data-open-modal]');
  const modalClosers = document.querySelectorAll('[data-close-modal]');

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.dataset.openModal;
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.style.display = 'block';
      }
    });
  });

  modalClosers.forEach((closer) => {
    closer.addEventListener('click', () => {
      const targetId = closer.dataset.closeModal;
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
};

const initExternalLinks = () => {
  const externalButtons = document.querySelectorAll('[data-external-link]');
  if (!externalButtons.length) {
    return;
  }

  externalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const url = button.dataset.externalLink;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  });
};

const initKeyboardShortcuts = ({ resetTasks, validateNextTask, toggleTheme }) => {
  document.addEventListener('keydown', (event) => {
    if (!event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'r') {
      event.preventDefault();
      resetTasks();
    }

    if (key === 'n') {
      event.preventDefault();
      validateNextTask();
    }

    if (key === 't') {
      event.preventDefault();
      toggleTheme();
    }
  });
};

const initFirstRun = () => {
  const hasSeenHelp = readStorageValue('firstRunComplete', 'false') === 'true';
  const storyModal = document.getElementById('storyModal');

  if (config.firstRunShowHelp && !hasSeenHelp && storyModal) {
    storyModal.style.display = 'block';
    writeStorageValue('firstRunComplete', 'true');
  }
};

const initCardAnimation = () => {
  const cards = document.querySelectorAll('.card, .command-card, .score-card');

  if (!cards.length) {
    return;
  }

  const animateCards = () => {
    const time = Date.now() / 1000;
    cards.forEach((card, index) => {
      const amplitude = 5;
      const frequency = 0.5;
      const phaseOffset = (index * Math.PI) / 6;
      const deltaY = amplitude * Math.sin(2 * Math.PI * frequency * time + phaseOffset);
      card.style.transform = `translateY(${deltaY}px)`;
    });
    requestAnimationFrame(animateCards);
  };

  requestAnimationFrame(animateCards);
};

const initApp = () => {
  const aiLoopElement = document.getElementById('ai-loop');
  const progressBar = document.getElementById('progressBar');
  const resetBtn = document.getElementById('resetBtn');
  const commandInput = document.getElementById('commandInput');
  const commandOutput = document.getElementById('commandOutput');
  const mathInput = document.getElementById('mathInput');
  const calcBtn = document.getElementById('calcBtn');
  const mathResult = document.getElementById('mathResult');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const startCoinGameBtn = document.getElementById('startCoinGame');
  const coinsInput = document.getElementById('coinsInput');
  const thresholdInput = document.getElementById('thresholdInput');
  const coinDisplay = document.getElementById('coinDisplay');
  const coinLog = document.getElementById('coinLog');
  const coinStatus = document.getElementById('coinStatus');
  const coinError = document.getElementById('coinError');
  const fileLog = document.getElementById('fileLog');
  const toggleTheme = () => document.body.classList.toggle('valentine-theme');
  const easterModal = document.getElementById('easterModal');

  const { resetTasks, validateNextTask, addScore } = initQuests({
    checkboxes: document.querySelectorAll('.task-checkbox'),
    progressBar,
    scoreDisplay,
  });

  const triggerEasterEgg = () => {
    addScore(50);
    if (easterModal) {
      easterModal.style.display = 'block';
    }
  };

  initAiLoop(aiLoopElement);
  initMathCalculator({ mathInput, calcBtn, mathResult });
  initCoinGame({
    startCoinGameBtn,
    coinsInput,
    thresholdInput,
    coinDisplay,
    coinLog,
    coinStatus,
    coinError,
  });
  initCommandPalette({
    commandInput,
    commandOutput,
    resetTasks,
    validateNextTask,
    toggleTheme,
    triggerEasterEgg,
  });
  initFileActions(fileLog);
  initFolders();
  initMemo();
  initDraggableWindows();
  initModals();
  initExternalLinks();
  initKeyboardShortcuts({ resetTasks, validateNextTask, toggleTheme });
  initFirstRun();
  initCardAnimation();

  if (resetBtn) {
    resetBtn.addEventListener('click', resetTasks);
  }

  setStatusMessage(coinStatus, 'Ready to combine coins. Enter values to start.');

  window.TokyoTCG = {
    resetQuests: resetTasks,
    validateNextQuest: validateNextTask,
    toggleTheme,
  };

  logger.info('App initialized');
};

document.addEventListener('DOMContentLoaded', () => {
  try {
    initApp();
  } catch (error) {
    handleError({
      error,
      logger,
      userMessage: 'Unable to start the experience. Please refresh the page.',
      statusElement: document.getElementById('appStatus'),
    });
  }
});
