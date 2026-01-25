import { getAppConfig } from './config.js';
import { handleError } from './errors.js';
import { createLogger } from './logger.js';
import {
  computeCoinOperations,
  parseCoinsInput,
  parseThreshold,
} from './utils/coin-game.js';
import { safeEvaluateExpression } from './utils/math.js';
import { createAuthStore } from './utils/auth-store.js';
import { readStorageValue, writeStorageValue } from './utils/storage.js';

const config = getAppConfig();
const logger = createLogger(config.logLevel);

const supportedLanguages = ['en', 'fr'];
const UI_CONSTANTS = {
  aiFadeMs: 500,
  questPulseMs: 300,
  questSwapMs: 600,
  questScoreDelta: 10,
  easterEggScoreBonus: 50,
  coinGameRunningLabel: 'Running...',
  coinGameStartLabel: 'Start Game',
  coinGameReadyStatus: 'Ready to combine coins. Enter values to start.',
  authMinimumPasswordLength: 8,
  brake: {
    pressureMin: 0,
    pressureMax: 100,
    whiteoutThreshold: 80,
    aggressiveThreshold: 50,
    whiteoutDurationMs: 700,
    tempBase: 260,
    tempMultiplier: 2.1,
  },
  cardRevealThreshold: 0.2,
  cardFloatAmplitude: 5,
  cardFloatFrequency: 0.5,
  cardFloatPhaseDivisor: 6,
};
let currentLanguage = readStorageValue('language', 'en');

const translations = {
  en: {
    headerTitle: 'Tokyo TCG Hub & Star Bazaar',
    headerSubtitle: 'Retro-futuristic quests, electric car labs, and rally data in one place.',
    headerLandingLink: 'Landing',
    statusWelcome: 'Welcome back, explorer. Ready to tune your ride and conquer quests.',
    openControlPanel: 'Open Control Panel',
    quickHelp: 'Quick Help',
    masterControlTitle: 'Master Control Panel',
    launchCustomization: 'Launch 3D Car Customization',
    storyTitle: 'Welcome to the Quest',
    welcomeTitle: 'Welcome to the Bazaar',
    welcomeBody:
      'At <strong>Tokyo TCG Hub &amp; Star Bazaar</strong>, your journey begins! Customize your electric ride, master futuristic tech, and embark on quests that transform routine tasks into epic adventures.',
    questsTitle: 'Epic Quests',
    innovationTitle: 'Innovative Solutions ❤️',
    innovationBody:
      'Experience advanced tech with our futuristic customization tools, interactive challenges, and gamified upgrades that push your electric ride to the next level.',
    authTitle: 'Join the Family',
    authBadgeGuest: 'Guest',
    authBadgeMember: 'Member',
    authPrompt: 'Create your secure profile to unlock the control panel and 3D lab.',
    registerTitle: 'Create Account',
    loginTitle: 'Sign In',
    labelName: 'Name',
    labelEmail: 'Email',
    labelPassword: 'Password',
    placeholderName: 'Your name',
    placeholderEmail: 'name@example.com',
    placeholderPassword: '8+ characters',
    registerButton: 'Register',
    loginButton: 'Sign In',
    logoutButton: 'Sign out',
    authFootnote: 'Local SQL-style vault for now; serverless database coming soon.',
    authWelcome: 'Welcome back',
    authRegisterSuccess: 'Registration complete. You are now signed in.',
    authRegisterExists: 'An account with that email already exists.',
    authRegisterInvalid: 'Check your name, email, and password to continue.',
    authRegisterWeakPassword: 'Password must be at least 8 characters.',
    authLoginInvalid: 'Login failed. Check your email and password.',
    authLoginSuccess: 'Signed in successfully.',
    authLogout: 'Signed out. See you soon!',
    authUnlockTooltip: 'Register or sign in to unlock this feature.',
    authManageTitle: 'Manage Profile',
    authManageLabel: 'Display name',
    authManagePlaceholder: 'Update your display name',
    authUpdateButton: 'Update Profile',
    authDeleteButton: 'Delete Account',
    authUpdateSuccess: 'Profile updated successfully.',
    authUpdateInvalid: 'Enter a valid display name to continue.',
    authUpdateMissing: 'Session expired. Please sign in again.',
    authDeleteConfirm: 'Delete your local account? This cannot be undone.',
    authDeleteSuccess: 'Your account has been deleted locally.',
    authDeleteMissing: 'Account not found. Try signing in again.',
    evDataTitle: 'Electric Car Intelligence',
    evDataSubtitle: 'Curated specs from leading EV makers, tuned for quick comparison.',
    rallyTitle: 'Rally Signal (2024/2025)',
    rallySubtitle: 'Latest rally highlights and series you can follow right now.',
    evRange: 'Range',
    evPower: 'Power',
    evZeroToHundred: '0-100 km/h',
    evTopSpeed: 'Top speed',
    evNote: 'Note',
    rallySeries: 'Series',
    rallyHighlight: 'Highlight',
    rallyWindow: 'Window',
    vercelTitle: 'Vercel-ready Car Templates',
    vercelIntro:
      'Vanilla JS car templates deploy as static sites on Vercel—just HTML, CSS, and JS files with no build step.',
    templateCanvasTitle: 'Canvas Car Racer',
    templateCanvasBody: 'Pure Canvas driving sim with sprite swaps for city or campaign branding.',
    templateThreeTitle: 'Three.js Car Viewer',
    templateThreeBody: 'Lightweight GLTF loader with orbit controls for interactive 3D showcases.',
    templateSvgTitle: 'SVG Car Animator',
    templateSvgBody: 'Minimal SVG path animation for 2D top-down routes and fleet tracking.',
    vercelStepsTitle: 'Deploy to Vercel in Minutes',
    vercelStepOne:
      'Create an index.html with scripts, add style.css, and keep assets in the repo root.',
    vercelStepTwo:
      'Optional: add vercel.json to rewrite all routes to index.html.',
    vercelStepThree: 'Push to GitHub and import the repo in Vercel for instant static deploys.',
    vercelTipsTitle: 'Quick Customization Tips',
    vercelTipOne: 'Swap in free GLTF cars (Sketchfab) and adjust materials for city lighting.',
    vercelTipTwo: 'Overlay campaign stats and delivery milestones directly on the HUD.',
    vercelTipThree: 'Test locally with npx serve, then push to redeploy.',
    commandPlaceholder: "Type 'reset', 'next', 'toggle', or '--help'",
    brakeLabTitle: 'Whiteout Braking Display',
    brakeLabSubtitle:
      'Simulate EV braking pressure, ABS assist, and watch the whiteout flash when braking hits peak load.',
    brakePressureLabel: 'Brake pressure',
    brakeAbsToggle: 'ABS assist engaged',
    brakeSimulateBtn: 'Simulate Brake',
    brakeReleaseBtn: 'Release',
    brakeGaugeLabel: 'Brake Pressure',
    brakeAbsLabel: 'ABS',
    brakeTempLabel: 'Rotor temp',
    brakeFeedbackLabel: 'Feedback',
    brakeSignalIdle: 'Coasting · Brake system idle',
    brakeSignalActive: 'Braking engaged · Grip steady',
    brakeSignalWhiteout: 'Whiteout braking · Maximum deceleration',
    brakeFeedbackStable: 'Stable',
    brakeFeedbackAggressive: 'Aggressive',
    brakeFeedbackWhiteout: 'Whiteout',
    brakeAbsOn: 'ON',
    brakeAbsOff: 'OFF',
  },
  fr: {
    headerTitle: 'Tokyo TCG Hub & Star Bazaar',
    headerSubtitle: 'Quêtes rétro-futuristes, labos EV et données rallye réunis.',
    headerLandingLink: 'Accueil',
    statusWelcome: 'Bon retour, explorateur. Prêt à régler ton bolide et réussir les quêtes.',
    openControlPanel: 'Ouvrir le panneau',
    quickHelp: 'Aide rapide',
    masterControlTitle: 'Panneau de contrôle',
    launchCustomization: 'Lancer la customisation 3D',
    storyTitle: 'Bienvenue dans la quête',
    welcomeTitle: 'Bienvenue au Bazaar',
    welcomeBody:
      'Chez <strong>Tokyo TCG Hub &amp; Star Bazaar</strong>, l’aventure commence ici ! Personnalise ton véhicule électrique, maîtrise la tech futuriste et transforme tes tâches en quêtes épiques.',
    questsTitle: 'Quêtes épiques',
    innovationTitle: 'Solutions innovantes ❤️',
    innovationBody:
      "Découvre des outils de customisation futuristes, des défis interactifs et des améliorations gamifiées pour propulser ton bolide au niveau supérieur.",
    authTitle: 'Rejoins la famille',
    authBadgeGuest: 'Visiteur',
    authBadgeMember: 'Membre',
    authPrompt: 'Crée un profil sécurisé pour accéder au panneau et au labo 3D.',
    registerTitle: 'Créer un compte',
    loginTitle: 'Connexion',
    labelName: 'Nom',
    labelEmail: 'Email',
    labelPassword: 'Mot de passe',
    placeholderName: 'Ton nom',
    placeholderEmail: 'nom@exemple.com',
    placeholderPassword: '8+ caractères',
    registerButton: "S'inscrire",
    loginButton: 'Se connecter',
    logoutButton: 'Se déconnecter',
    authFootnote: 'Base locale type SQL pour l’instant; base serverless bientôt.',
    authWelcome: 'Bon retour',
    authRegisterSuccess: 'Inscription réussie. Vous êtes connecté.',
    authRegisterExists: 'Un compte avec cet email existe déjà.',
    authRegisterInvalid: 'Vérifiez votre nom, email et mot de passe.',
    authRegisterWeakPassword: 'Le mot de passe doit contenir 8 caractères minimum.',
    authLoginInvalid: 'Connexion échouée. Vérifiez vos identifiants.',
    authLoginSuccess: 'Connexion réussie.',
    authLogout: 'Déconnecté. À bientôt !',
    authUnlockTooltip: 'Inscrivez-vous ou connectez-vous pour déverrouiller cette fonction.',
    authManageTitle: 'Gérer le profil',
    authManageLabel: "Nom d'affichage",
    authManagePlaceholder: 'Mettre à jour votre nom',
    authUpdateButton: 'Mettre à jour',
    authDeleteButton: 'Supprimer le compte',
    authUpdateSuccess: 'Profil mis à jour avec succès.',
    authUpdateInvalid: 'Saisissez un nom valide pour continuer.',
    authUpdateMissing: 'Session expirée. Merci de vous reconnecter.',
    authDeleteConfirm: 'Supprimer votre compte local ? Action irréversible.',
    authDeleteSuccess: 'Votre compte a été supprimé localement.',
    authDeleteMissing: "Compte introuvable. Reconnectez-vous s'il vous plaît.",
    evDataTitle: 'Intelligence voitures électriques',
    evDataSubtitle: 'Données clés des leaders EV pour comparer rapidement.',
    rallyTitle: 'Signal Rallye (2024/2025)',
    rallySubtitle: 'Points forts rallye récents et séries à suivre.',
    evRange: 'Autonomie',
    evPower: 'Puissance',
    evZeroToHundred: '0-100 km/h',
    evTopSpeed: 'Vitesse max',
    evNote: 'Note',
    rallySeries: 'Série',
    rallyHighlight: 'Point fort',
    rallyWindow: 'Période',
    vercelTitle: 'Templates voiture prêts pour Vercel',
    vercelIntro:
      'Ces templates voiture en vanilla JS se déploient sur Vercel en site statique : HTML, CSS et JS sans build.',
    templateCanvasTitle: 'Canvas Car Racer',
    templateCanvasBody:
      'Simulation Canvas avec sprites personnalisables pour un décor ville ou campagne.',
    templateThreeTitle: 'Three.js Car Viewer',
    templateThreeBody:
      'Chargeur GLTF léger avec orbit controls pour des présentations 3D interactives.',
    templateSvgTitle: 'SVG Car Animator',
    templateSvgBody: 'Animation SVG minimale pour itinéraires 2D et suivi de flotte.',
    vercelStepsTitle: 'Déployer sur Vercel en quelques minutes',
    vercelStepOne:
      'Créez un index.html avec scripts, ajoutez style.css, et gardez les assets à la racine.',
    vercelStepTwo:
      'Optionnel : ajoutez vercel.json pour réécrire toutes les routes vers index.html.',
    vercelStepThree:
      'Poussez sur GitHub et importez le repo dans Vercel pour un déploiement instantané.',
    vercelTipsTitle: 'Astuces de personnalisation rapide',
    vercelTipOne:
      'Remplacez par des voitures GLTF gratuites (Sketchfab) et ajustez les matériaux pour la ville.',
    vercelTipTwo:
      'Ajoutez des stats de campagne et des jalons de livraison directement sur le HUD.',
    vercelTipThree: 'Testez avec npx serve, puis poussez pour redéployer.',
    commandPlaceholder: "Tapez 'reset', 'next', 'toggle' ou '--help'",
    brakeLabTitle: 'Affichage de freinage Whiteout',
    brakeLabSubtitle:
      "Simule la pression de freinage, l'assistance ABS, et observe le flash whiteout quand le freinage atteint le pic.",
    brakePressureLabel: 'Pression de freinage',
    brakeAbsToggle: 'Assistance ABS engagée',
    brakeSimulateBtn: 'Simuler le freinage',
    brakeReleaseBtn: 'Relâcher',
    brakeGaugeLabel: 'Pression de freinage',
    brakeAbsLabel: 'ABS',
    brakeTempLabel: 'Température disque',
    brakeFeedbackLabel: 'Retour',
    brakeSignalIdle: 'Roulage · Freinage au repos',
    brakeSignalActive: 'Freinage engagé · Adhérence stable',
    brakeSignalWhiteout: 'Freinage whiteout · Décélération max',
    brakeFeedbackStable: 'Stable',
    brakeFeedbackAggressive: 'Agressif',
    brakeFeedbackWhiteout: 'Whiteout',
    brakeAbsOn: 'ACTIF',
    brakeAbsOff: 'INACTIF',
  },
};

const getAiMessages = (lang) => {
  if (lang === 'fr') {
    return [
      "IA : Le couple instantané des EV booste les départs.",
      "IA : Bonus du jour — vise les quêtes rapides pour des points.",
      "IA : Citation : « Le futur est électrique et surprenant. »",
      "IA : Imagine une skyline néon où chaque carte raconte une histoire.",
      "IA : Fait : l'innovation électrique accélère chaque duel.",
    ];
  }

  return [
    'AI: Did you know? Electric cars can accelerate from 0-60 in under 3 seconds.',
    'AI: Giveaway: Enter now for a chance to win bonus points!',
    "AI: Quote: 'The future is electric and full of surprises.'",
    'AI: Imagine a neon skyline where every card tells a unique story.',
    'AI: Fact: Cutting-edge tech drives innovation in every duel.',
  ];
};

const getTranslation = (lang, key) =>
  (translations[lang] && translations[lang][key]) || translations.en[key] || key;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildLabeledRow = (label, value, { tag = 'div', className } = {}) => {
  const container = document.createElement(tag);
  if (className) {
    container.className = className;
  }
  const strong = document.createElement('strong');
  strong.textContent = `${label}:`;
  container.append(strong, ` ${value}`);
  return container;
};

const appendCoinLogEntry = (coinLog, message, { strong = false } = {}) => {
  if (!coinLog) {
    return;
  }
  const entry = document.createElement('p');
  if (strong) {
    const strongEl = document.createElement('strong');
    strongEl.textContent = message;
    entry.appendChild(strongEl);
  } else {
    entry.textContent = message;
  }
  coinLog.appendChild(entry);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const setStatusMessage = (element, message) => {
  if (element) {
    element.textContent = message;
  }
};

const initAiLoop = (aiLoopElement, getMessages) => {
  if (!aiLoopElement) {
    return;
  }

  let aiIndex = 0;

  const updateAiMessage = () => {
    const resolvedMessages = getMessages();
    const aiMessages =
      Array.isArray(resolvedMessages) && resolvedMessages.length > 0 ? resolvedMessages : [''];
    aiLoopElement.classList.add('fade');
    setTimeout(() => {
      aiLoopElement.textContent = aiMessages[aiIndex];
      aiLoopElement.classList.remove('fade');
      aiIndex = (aiIndex + 1) % aiMessages.length;
    }, UI_CONSTANTS.aiFadeMs);
  };

  aiLoopElement.addEventListener('click', updateAiMessage);
  setInterval(updateAiMessage, config.aiMessageIntervalMs);
};

const applyTranslations = (lang) => {
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = getTranslation(lang, key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    el.innerHTML = getTranslation(lang, key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    el.setAttribute('placeholder', getTranslation(lang, key));
  });
};

const evData = [
  {
    model: 'Tesla Model 3 Performance',
    range: '547 km (WLTP)',
    power: '375 kW',
    zeroToHundred: '3.1 s',
    topSpeed: '262 km/h',
    note: 'Dual-motor performance trim.',
  },
  {
    model: 'Toyota bZ4X',
    range: '452 km (WLTP)',
    power: '160 kW',
    zeroToHundred: '7.5 s',
    topSpeed: '160 km/h',
    note: 'AWD EU spec.',
  },
  {
    model: 'Hyundai Ioniq 5 N',
    range: '448 km (WLTP)',
    power: '478 kW',
    zeroToHundred: '3.4 s',
    topSpeed: '260 km/h',
    note: 'N Mode boosted output.',
  },
  {
    model: 'Porsche Taycan Turbo',
    range: '510 km (WLTP)',
    power: '500 kW',
    zeroToHundred: '2.9 s',
    topSpeed: '260 km/h',
    note: 'Performance battery plus.',
  },
  {
    model: 'Ford Mustang Mach-E GT',
    range: '490 km (WLTP)',
    power: '358 kW',
    zeroToHundred: '3.8 s',
    topSpeed: '200 km/h',
    note: 'Extended range battery.',
  },
  {
    model: 'Citroën ë-C4 X',
    range: '360 km (WLTP)',
    power: '100 kW',
    zeroToHundred: '9.7 s',
    topSpeed: '150 km/h',
    note: 'Comfort-focused sedan.',
  },
  {
    model: 'Opel Corsa Electric',
    range: '405 km (WLTP)',
    power: '115 kW',
    zeroToHundred: '8.1 s',
    topSpeed: '150 km/h',
    note: 'Urban EV benchmark.',
  },
  {
    model: 'Ferrari SF90 Stradale',
    range: '25 km (EV)',
    power: '735 kW',
    zeroToHundred: '2.5 s',
    topSpeed: '340 km/h',
    note: 'Plug-in hybrid hypercar.',
  },
];

const rallyData = [
  {
    series: 'WRC',
    highlight: 'Hybrid era stages across Europe, Africa, and Asia.',
    window: 'Jan–Nov 2024/2025',
  },
  {
    series: 'Dakar Rally',
    highlight: 'Rally-raid endurance in desert terrain.',
    window: 'Jan 2025',
  },
  {
    series: 'ERC',
    highlight: 'European tarmac + gravel mix with new talents.',
    window: 'Apr–Oct 2024',
  },
  {
    series: 'Extreme E',
    highlight: 'Electric off-road battle in climate-challenged locations.',
    window: '2024 season',
  },
];

const renderEvData = (container, lang) => {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  evData.forEach((car) => {
    const card = document.createElement('article');
    card.className = 'data-card';

    const title = document.createElement('h3');
    title.textContent = car.model;

    const meta = document.createElement('div');
    meta.className = 'data-meta';
    meta.append(
      buildLabeledRow(getTranslation(lang, 'evRange'), car.range),
      buildLabeledRow(getTranslation(lang, 'evPower'), car.power),
      buildLabeledRow(getTranslation(lang, 'evZeroToHundred'), car.zeroToHundred),
      buildLabeledRow(getTranslation(lang, 'evTopSpeed'), car.topSpeed)
    );

    const note = buildLabeledRow(getTranslation(lang, 'evNote'), car.note, {
      tag: 'p',
      className: 'data-meta',
    });

    card.append(title, meta, note);
    container.appendChild(card);
  });
};

const renderRallyData = (container, lang) => {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  rallyData.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'rally-card';

    const title = document.createElement('h3');
    title.textContent = event.series;

    const highlight = document.createElement('div');
    highlight.className = 'data-meta';
    highlight.append(
      buildLabeledRow(getTranslation(lang, 'rallyHighlight'), event.highlight, { tag: 'span' })
    );

    const window = document.createElement('div');
    window.className = 'data-meta';
    window.append(buildLabeledRow(getTranslation(lang, 'rallyWindow'), event.window, { tag: 'span' }));

    card.append(title, highlight, window);
    container.appendChild(card);
  });
};

const initLanguageToggle = ({
  languageToggle,
  languageLabel,
  evDataGrid,
  rallyList,
  onLanguageChange,
}) => {
  if (!languageToggle || !languageLabel) {
    return { applyLanguage: () => {} };
  }

  const applyLanguage = (lang) => {
    currentLanguage = supportedLanguages.includes(lang) ? lang : 'en';
    writeStorageValue('language', currentLanguage);
    languageLabel.textContent = currentLanguage.toUpperCase();
    applyTranslations(currentLanguage);
    renderEvData(evDataGrid, currentLanguage);
    renderRallyData(rallyList, currentLanguage);
    if (onLanguageChange) {
      onLanguageChange(currentLanguage);
    }
  };

  languageToggle.addEventListener('click', () => {
    const nextLanguage = currentLanguage === 'en' ? 'fr' : 'en';
    applyLanguage(nextLanguage);
  });

  applyLanguage(currentLanguage);
  return { applyLanguage };
};

const initAuth = async ({
  authStatus,
  authBadge,
  logoutBtn,
  registerForm,
  loginForm,
  gatedButtons,
  manageSection,
  manageForm,
  manageNameInput,
  deleteAccountBtn,
}) => {
  if (!authStatus || !authBadge || !logoutBtn || !registerForm || !loginForm) {
    return () => {};
  }

  const authStore = createAuthStore();
  const gatedButtonsList = gatedButtons ? Array.from(gatedButtons) : [];

  const updateGatedButtons = (isAuthenticated) => {
    gatedButtonsList.forEach((button) => {
      button.disabled = !isAuthenticated;
      button.setAttribute('aria-disabled', String(!isAuthenticated));
      button.title = isAuthenticated
        ? ''
        : getTranslation(currentLanguage, 'authUnlockTooltip');
    });
  };

  const applyAuthState = (session, messageKey) => {
    const isAuthenticated = Boolean(session);
    authBadge.textContent = getTranslation(
      currentLanguage,
      isAuthenticated ? 'authBadgeMember' : 'authBadgeGuest'
    );
    authStatus.textContent = isAuthenticated
      ? `${getTranslation(currentLanguage, 'authWelcome')}, ${session.name}.`
      : getTranslation(currentLanguage, 'authPrompt');
    registerForm.hidden = isAuthenticated;
    loginForm.hidden = isAuthenticated;
    logoutBtn.hidden = !isAuthenticated;
    if (manageSection) {
      manageSection.hidden = !isAuthenticated;
    }
    if (manageNameInput) {
      manageNameInput.value = session?.name ?? '';
    }
    updateGatedButtons(isAuthenticated);

    if (messageKey) {
      authStatus.textContent = getTranslation(currentLanguage, messageKey);
    }
  };

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = registerForm.querySelector('#registerName')?.value.trim();
    const email = registerForm.querySelector('#registerEmail')?.value.trim().toLowerCase();
    const password = registerForm.querySelector('#registerPassword')?.value;

    if (!name || !email || !password || !isValidEmail(email)) {
      applyAuthState(null, 'authRegisterInvalid');
      return;
    }

    if (password.length < UI_CONSTANTS.authMinimumPasswordLength) {
      applyAuthState(null, 'authRegisterWeakPassword');
      return;
    }

    const response = await authStore.registerUser({ name, email, password });
    if (!response.ok && response.reason === 'exists') {
      applyAuthState(null, 'authRegisterExists');
      return;
    }

    applyAuthState(response.session ?? authStore.getSession(), 'authRegisterSuccess');
    registerForm.reset();
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = loginForm.querySelector('#loginEmail')?.value.trim().toLowerCase();
    const password = loginForm.querySelector('#loginPassword')?.value;

    if (!email || !password || !isValidEmail(email)) {
      applyAuthState(null, 'authLoginInvalid');
      return;
    }

    const response = await authStore.authenticateUser({ email, password });
    if (!response.ok) {
      applyAuthState(null, 'authLoginInvalid');
      return;
    }

    applyAuthState(response.session ?? authStore.getSession(), 'authLoginSuccess');
    loginForm.reset();
  });

  logoutBtn.addEventListener('click', () => {
    authStore.clearSession();
    applyAuthState(null, 'authLogout');
  });

  if (manageForm && manageNameInput) {
    manageForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const session = authStore.getSession();
      if (!session) {
        applyAuthState(null);
        return;
      }

      const nextName = manageNameInput.value.trim();
      if (!nextName) {
        applyAuthState(session, 'authUpdateInvalid');
        return;
      }

      const response = authStore.updateProfile({ email: session.email, name: nextName });
      const nextSession = response.session ?? authStore.getSession();
      applyAuthState(nextSession, response.ok ? 'authUpdateSuccess' : 'authUpdateMissing');
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      const session = authStore.getSession();
      if (!session) {
        applyAuthState(null);
        return;
      }

      const shouldDelete = window.confirm(getTranslation(currentLanguage, 'authDeleteConfirm'));
      if (!shouldDelete) {
        return;
      }

      const response = authStore.deleteProfile(session.email);
      if (!response.ok) {
        applyAuthState(authStore.getSession(), 'authDeleteMissing');
        return;
      }

      applyAuthState(response.session, 'authDeleteSuccess');
    });
  }

  const refreshAuthState = () => {
    applyAuthState(authStore.getSession());
  };

  refreshAuthState();
  return refreshAuthState;
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
            updateScore(UI_CONSTANTS.questScoreDelta);
          } else {
            label.classList.remove('done');
            updateScore(-UI_CONSTANTS.questScoreDelta);
          }
          label.classList.remove('swap-clean');
          updateProgress();
        }, UI_CONSTANTS.questSwapMs);
      }, UI_CONSTANTS.questPulseMs);
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
          }, UI_CONSTANTS.questSwapMs);
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
    startCoinGameBtn.textContent = running
      ? UI_CONSTANTS.coinGameRunningLabel
      : UI_CONSTANTS.coinGameStartLabel;
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
      coinLog.replaceChildren();
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
        appendCoinLogEntry(coinLog, `Minimum operations required: ${result.operations}`, {
          strong: true,
        });
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
        appendCoinLogEntry(
          coinLog,
          `Operation ${index + 1}: Combined ${x} and ${y} to create ${step.newCoin}`
        );
        await sleep(config.coinGameStepDelayMs);
        renderCoins(coinDisplay, workingCoins);
      }

      setStatusMessage(
        coinStatus,
        result.success
          ? 'Threshold reached!'
          : 'Unable to reach threshold with the provided coins.'
      );
      appendCoinLogEntry(coinLog, `Minimum operations required: ${result.operations}`, {
        strong: true,
      });
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

const initBrakeLab = ({
  pressureInput,
  pressureValue,
  absToggle,
  simulateBtn,
  releaseBtn,
  gauge,
  gaugeValue,
  absStatus,
  brakeTemp,
  brakeFeedback,
  brakeSignal,
  whiteoutOverlay,
}) => {
  if (
    !pressureInput ||
    !pressureValue ||
    !absToggle ||
    !simulateBtn ||
    !releaseBtn ||
    !gauge ||
    !gaugeValue ||
    !absStatus ||
    !brakeTemp ||
    !brakeFeedback ||
    !brakeSignal
  ) {
    return { applyLanguage: () => {} };
  }

  const state = {
    pressure: Number(pressureInput.value) || 0,
    absEnabled: absToggle.checked,
    isBraking: false,
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const triggerWhiteout = () => {
    if (!whiteoutOverlay) {
      return;
    }
    whiteoutOverlay.classList.add('active');
    setTimeout(() => {
      whiteoutOverlay.classList.remove('active');
    }, UI_CONSTANTS.brake.whiteoutDurationMs);
  };

  const getFeedbackKey = () => {
    if (state.pressure >= UI_CONSTANTS.brake.whiteoutThreshold) {
      return 'brakeFeedbackWhiteout';
    }
    if (state.pressure >= UI_CONSTANTS.brake.aggressiveThreshold) {
      return 'brakeFeedbackAggressive';
    }
    return 'brakeFeedbackStable';
  };

  const updateSignal = () => {
    let signalKey = 'brakeSignalIdle';
    if (state.isBraking) {
      signalKey =
        state.pressure >= UI_CONSTANTS.brake.whiteoutThreshold
          ? 'brakeSignalWhiteout'
          : 'brakeSignalActive';
    }
    brakeSignal.textContent = getTranslation(currentLanguage, signalKey);
  };

  const updateMetrics = () => {
    const temp = Math.round(
      UI_CONSTANTS.brake.tempBase + state.pressure * UI_CONSTANTS.brake.tempMultiplier
    );
    brakeTemp.textContent = `${temp}°C`;
    brakeFeedback.textContent = getTranslation(currentLanguage, getFeedbackKey());
    absStatus.textContent = getTranslation(
      currentLanguage,
      state.absEnabled ? 'brakeAbsOn' : 'brakeAbsOff'
    );
  };

  const updateGauge = () => {
    const pressure = clamp(
      state.pressure,
      UI_CONSTANTS.brake.pressureMin,
      UI_CONSTANTS.brake.pressureMax
    );
    pressureValue.textContent = `${pressure}%`;
    gaugeValue.textContent = `${pressure}%`;
    gauge.style.setProperty('--brake-level', `${pressure}%`);
  };

  const applyLanguage = () => {
    updateMetrics();
    updateSignal();
  };

  pressureInput.addEventListener('input', (event) => {
    const nextValue = Number.parseFloat(event.target?.value ?? '0');
    state.pressure = Number.isNaN(nextValue) ? 0 : nextValue;
    updateGauge();
    updateMetrics();
    updateSignal();
  });

  absToggle.addEventListener('change', (event) => {
    state.absEnabled = Boolean(event.target?.checked);
    updateMetrics();
  });

  simulateBtn.addEventListener('click', () => {
    state.isBraking = true;
    updateMetrics();
    updateSignal();
    if (state.pressure >= UI_CONSTANTS.brake.whiteoutThreshold) {
      triggerWhiteout();
    }
  });

  releaseBtn.addEventListener('click', () => {
    state.isBraking = false;
    updateSignal();
  });

  updateGauge();
  applyLanguage();

  return { applyLanguage };
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
      virtualFileContent.replaceChildren();
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

const isSafeExternalUrl = (url) => {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }

  if (url.startsWith('/')) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.href);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const initExternalLinks = () => {
  const externalButtons = document.querySelectorAll('[data-external-link]');
  if (!externalButtons.length) {
    return;
  }

  externalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const url = button.dataset.externalLink;
      if (url && isSafeExternalUrl(url)) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        logger.warn('Blocked unsafe external link attempt.', { url });
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

const initCardReveal = () => {
  const cards = document.querySelectorAll('.card, .command-card, .score-card');
  if (!cards.length || !('IntersectionObserver' in window)) {
    return;
  }

  cards.forEach((card) => card.classList.add('reveal-card'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: UI_CONSTANTS.cardRevealThreshold }
  );

  cards.forEach((card) => observer.observe(card));
};

const initCardAnimation = () => {
  const cards = document.querySelectorAll('.card, .command-card, .score-card');

  if (!cards.length) {
    return;
  }

  const animateCards = () => {
    const time = Date.now() / 1000;
    cards.forEach((card, index) => {
      const amplitude = UI_CONSTANTS.cardFloatAmplitude;
      const frequency = UI_CONSTANTS.cardFloatFrequency;
      const phaseOffset = (index * Math.PI) / UI_CONSTANTS.cardFloatPhaseDivisor;
      const deltaY = amplitude * Math.sin(2 * Math.PI * frequency * time + phaseOffset);
      card.style.setProperty('--float-offset', `${deltaY}px`);
    });
    requestAnimationFrame(animateCards);
  };

  requestAnimationFrame(animateCards);
};

const initApp = async () => {
  document.body.classList.add('js-enabled');
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
  const languageToggle = document.getElementById('languageToggle');
  const languageLabel = document.getElementById('languageLabel');
  const themeToggleBtn = document.getElementById('themeToggle');
  const evDataGrid = document.getElementById('evDataGrid');
  const rallyList = document.getElementById('rallyList');
  const brakePressure = document.getElementById('brakePressure');
  const brakePressureValue = document.getElementById('brakePressureValue');
  const absToggle = document.getElementById('absToggle');
  const simulateBrake = document.getElementById('simulateBrake');
  const releaseBrake = document.getElementById('releaseBrake');
  const brakeGauge = document.getElementById('brakeGauge');
  const brakeGaugeValue = document.getElementById('brakeGaugeValue');
  const absStatus = document.getElementById('absStatus');
  const brakeTemp = document.getElementById('brakeTemp');
  const brakeFeedback = document.getElementById('brakeFeedback');
  const brakeSignal = document.getElementById('brakeSignal');
  const brakeWhiteout = document.getElementById('brakeWhiteout');
  const authStatus = document.getElementById('authStatus');
  const authBadge = document.getElementById('authBadge');
  const logoutBtn = document.getElementById('logoutBtn');
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const manageSection = document.getElementById('authManageSection');
  const manageForm = document.getElementById('manageForm');
  const manageNameInput = document.getElementById('manageName');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const gatedButtons = document.querySelectorAll('[data-auth-required="true"]');

  const { resetTasks, validateNextTask, addScore } = initQuests({
    checkboxes: document.querySelectorAll('.task-checkbox'),
    progressBar,
    scoreDisplay,
  });

  const triggerEasterEgg = () => {
    addScore(UI_CONSTANTS.easterEggScoreBonus);
    if (easterModal) {
      easterModal.style.display = 'block';
    }
  };

  const refreshAuthState = await initAuth({
    authStatus,
    authBadge,
    logoutBtn,
    registerForm,
    loginForm,
    manageSection,
    manageForm,
    manageNameInput,
    deleteAccountBtn,
    gatedButtons,
  });

  const brakeLab = initBrakeLab({
    pressureInput: brakePressure,
    pressureValue: brakePressureValue,
    absToggle,
    simulateBtn: simulateBrake,
    releaseBtn: releaseBrake,
    gauge: brakeGauge,
    gaugeValue: brakeGaugeValue,
    absStatus,
    brakeTemp,
    brakeFeedback,
    brakeSignal,
    whiteoutOverlay: brakeWhiteout,
  });

  initLanguageToggle({
    languageToggle,
    languageLabel,
    evDataGrid,
    rallyList,
    onLanguageChange: () => {
      refreshAuthState();
      brakeLab.applyLanguage();
    },
  });
  initAiLoop(aiLoopElement, () => getAiMessages(currentLanguage));
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
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
  initCardReveal();
  initCardAnimation();

  if (resetBtn) {
    resetBtn.addEventListener('click', resetTasks);
  }

  setStatusMessage(coinStatus, UI_CONSTANTS.coinGameReadyStatus);

  window.TokyoTCG = {
    resetQuests: resetTasks,
    validateNextQuest: validateNextTask,
    toggleTheme,
  };

  logger.info('App initialized');
};

document.addEventListener('DOMContentLoaded', () => {
  initApp().catch((error) => {
    handleError({
      error,
      logger,
      userMessage: 'Unable to start the experience. Please refresh the page.',
      statusElement: document.getElementById('appStatus'),
    });
  });
});
