const translations = {
  en: {
    landingTitle: 'Tokyo TCG Hub & Star Bazaar',
    landingSubtitle: 'A retro-futuristic hub for EV customization, quests, and rally culture.',
    landingHeroTitle: 'Step into the Neon Garage',
    landingHeroBody:
      'Compare electric cars from Tesla to Ferrari, browse rally highlights, and unlock the 3D lab.',
    landingCtaPrimary: 'Enter the App',
    landingCtaSecondary: 'Explore 3D Lab',
    landingFeatureOneTitle: 'EV Intelligence',
    landingFeatureOneBody:
      'Fast specs, range insights, and performance snapshots for top electric models.',
    landingFeatureTwoTitle: 'Family Access',
    landingFeatureTwoBody:
      'Register securely and unlock the control panel, quests, and car tools.',
    landingFeatureThreeTitle: 'Rally Signal',
    landingFeatureThreeBody:
      'Follow WRC, Dakar, and Extreme E updates with a futuristic overlay.',
    landingFooterLink: 'Back to Index',
  },
  fr: {
    landingTitle: 'Tokyo TCG Hub & Star Bazaar',
    landingSubtitle: 'Un hub rétro-futuriste pour la custom EV, les quêtes et la culture rallye.',
    landingHeroTitle: 'Entre dans le garage néon',
    landingHeroBody:
      'Compare les voitures électriques de Tesla à Ferrari, découvre le rallye, et ouvre le labo 3D.',
    landingCtaPrimary: "Entrer dans l'app",
    landingCtaSecondary: 'Explorer le labo 3D',
    landingFeatureOneTitle: 'Intelligence EV',
    landingFeatureOneBody:
      'Specs rapides, autonomie, et performances pour les meilleurs modèles.',
    landingFeatureTwoTitle: 'Accès famille',
    landingFeatureTwoBody:
      'Inscris-toi en sécurité pour débloquer le panneau, les quêtes et les outils.',
    landingFeatureThreeTitle: 'Signal Rallye',
    landingFeatureThreeBody:
      'Suis les actus WRC, Dakar et Extreme E avec un style futuriste.',
    landingFooterLink: "Retour à l'index",
  },
};

const getTranslation = (lang, key) => (translations[lang] && translations[lang][key]) || translations.en[key];

const applyTranslations = (lang) => {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = getTranslation(lang, key);
  });
};

const initLanding = () => {
  const languageToggle = document.getElementById('landingLanguageToggle');
  const languageLabel = document.getElementById('landingLanguageLabel');
  if (!languageToggle || !languageLabel) {
    return;
  }

  const storedLanguage = window.localStorage.getItem('language') || 'en';
  let currentLanguage = storedLanguage === 'fr' ? 'fr' : 'en';

  const setLanguage = (lang) => {
    currentLanguage = lang;
    window.localStorage.setItem('language', currentLanguage);
    languageLabel.textContent = currentLanguage.toUpperCase();
    applyTranslations(currentLanguage);
  };

  languageToggle.addEventListener('click', () => {
    const nextLanguage = currentLanguage === 'en' ? 'fr' : 'en';
    setLanguage(nextLanguage);
  });

  setLanguage(currentLanguage);
};

document.addEventListener('DOMContentLoaded', initLanding);
