'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'fr';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    highlighted: 'Highlighted',
    portfolio: 'Portfolio',
    manualPortfolio: 'Manual Portfolio',
    targetList: 'Target List',
    monitor: 'Monitor',
    guruList: 'Guru List',
    update: 'Update',
    addStock: 'Add Stock',
    settings: 'Settings',
    darkMode: 'Dark Mode',
    language: 'Language',
    english: 'English',
    french: 'French',
    logout: 'Logout',
    
    // Page Titles
    featuredStocks: 'Featured Stocks',
    portfolioList: 'Portfolio List',
    stockUpdate: 'Stock Update',
    stockScreener: 'StockScreener',
    
    // Descriptions
    highlightedInvestmentOpportunities: 'Highlighted investment opportunities',
    manualPortfolioStocks: 'Manual portfolio stocks',
    trackStockMetricChanges: 'Track stock metric changes',
    signInToAccessDashboard: 'Sign in to access your dashboard',
    
    // Forms & Filters
    filterByDateRange: 'Filter by Date Range',
    filterByDate: 'Filter by Date',
    startDate: 'Start Date',
    endDate: 'End Date',
    selectDate: 'Select Date',
    today: 'Today',
    apply: 'Apply',
    username: 'Username',
    password: 'Password',
    enterYourUsername: 'Enter your username',
    enterYourPassword: 'Enter your password',
    rememberMe: 'Remember me for 30 days',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    
    // Table Headers
    ticker: 'Ticker',
    sentiment: 'Sentiment',
    signal: 'Signal',
    rule1: 'Rule1',
    moat: 'Moat',
    management: 'Mgmt',
    price: 'Price',
    upside: 'Upside',
    composite: 'Comp',
    growth: 'Growth',
    pbt: 'PBT',
    source: 'Source',
    date: 'Date',
    color: 'Color',
    comment: 'Comment',
    
    // Metrics
    keyMetrics: 'Key Metrics',
    financial: 'Financial',
    totalChanges: 'Total Changes',
    positive: 'Positive',
    negative: 'Negative',
    average: 'Average',
    averageSentiment: 'Average Sentiment',
    averageUpside: 'Average Upside',
    
    // Actions
    analyzeStock: 'Analyze Stock',
    addComment: 'Add Comment',
    saveComment: 'Save Comment',
    cancel: 'Cancel',
    refresh: 'Refresh',
    reloadState: 'Reload State',
    previous: 'Prev',
    next: 'Next',
    
    // Messages
    noStocksFound: 'No Stocks Found',
    noStocksAvailableForSelectedDate: 'No stocks available for selected date',
    noFeaturedStocksFound: 'No Featured Stocks Found',
    noPortfolioStocksFound: 'No Portfolio Stocks Found',
    errorLoadingStocks: 'Error Loading Stocks',
    errorLoadingFeaturedStocks: 'Error Loading Featured Stocks',
    errorLoadingPortfolio: 'Error Loading Portfolio',
    tryAgain: 'Try Again',
    loading: 'Loading...',
    noData: 'No data',
    
    // Shortcuts
    shortcuts: 'Shortcuts',
    navigate: 'Navigate',
    dates: 'Dates',
    
    // Stock Details
    signalScore: 'Signal Score',
    rule1Score: 'Rule1 Score',
    targetBuyPrice: 'Target Buy Price',
    lastPrice: 'Last Price',
    lastSavedCompositeGR: 'Last Saved Composite GR',
    analystEstimatedLongTermGR: 'Analyst Estimated Long-Term GR',
    
    // Dashboard specific
    metric: 'Metric',
    threshold: 'Threshold',
    topGainers: 'Top Gainers',
    topLosers: 'Top Losers',
    gainers: 'Gainers',
    losers: 'Losers',
    
    // Stock Update specific
    buyPrice: 'Buy Price',
    stickerPrice: 'Sticker',
    current: 'Current',
    manual: 'Manual',
    
    // Stock Scraper Management
    stockScraperManagement: 'Stock Scraper Management',
    scraperStatus: 'Scraper Status',
    nextRunCountdown: 'Next run countdown',
    idle: 'idle',
    nextRunIn: 'Next Run In',
    hoursMinutes: 'hours : minutes',
    hoursMinutesSeconds: 'hours : minutes : seconds',
    status: 'Status',
    stopped: 'Stopped',
    updates: 'Updates',
    available: 'Available',
    nextRun: 'Next Run:',
    lastRun: 'Last Run:',
    tickerManagement: 'Ticker Management',
    addOrReplaceStockSymbols: 'Add or replace stock symbols',
    manageTickers: 'Manage Tickers',
    activeTickers: 'Active Tickers',
    currentlyMonitoredSymbols: 'Currently monitored symbols',
    running: 'Running',
    locked: 'Locked',
    
    // Time
    stocks: 'stocks',
    yesterday: 'Yesterday',
    
    // Validation
    pleaseSelectBothDates: 'Please select both start and end dates',
    startDateCannotBeAfterEndDate: 'Start date cannot be after end date',
    invalidDateSelection: 'Invalid date selection. Please try again.',
    
    // Delete functionality
    deleteStock: 'Delete stock',
    confirmDeleteStock: 'Are you sure you want to delete this stock?',
    errorDeletingStock: 'Failed to delete stock. Please try again.',
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    highlighted: 'En vedette',
    portfolio: 'Portefeuille',
    manualPortfolio: 'Portefeuille Manuel',
    targetList: 'Liste Cible',
    monitor: 'Moniteur',
    guruList: 'Liste Guru',
    update: 'Mettre à jour',
    addStock: 'Ajouter Action',
    settings: 'Paramètres',
    darkMode: 'Mode sombre',
    language: 'Langue',
    english: 'Anglais',
    french: 'Français',
    logout: 'Déconnexion',
    
    // Page Titles
    featuredStocks: 'Actions en vedette',
    portfolioList: 'Liste du portefeuille',
    stockUpdate: 'Mise à jour des actions',
    stockScreener: 'StockScreener',
    
    // Descriptions
    highlightedInvestmentOpportunities: 'Opportunités d\'investissement en vedette',
    manualPortfolioStocks: 'Actions du portefeuille manuel',
    trackStockMetricChanges: 'Suivre les changements de métriques des actions',
    signInToAccessDashboard: 'Connectez-vous pour accéder à votre tableau de bord',
    
    // Forms & Filters
    filterByDateRange: 'Filtrer par plage de dates',
    filterByDate: 'Filtrer par date',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    selectDate: 'Sélectionner la date',
    today: 'Aujourd\'hui',
    apply: 'Appliquer',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    enterYourUsername: 'Entrez votre nom d\'utilisateur',
    enterYourPassword: 'Entrez votre mot de passe',
    rememberMe: 'Se souvenir de moi pendant 30 jours',
    signIn: 'Se connecter',
    signingIn: 'Connexion en cours...',
    
    // Table Headers
    ticker: 'Symbole',
    sentiment: 'Sentiment',
    signal: 'Signal',
    rule1: 'Rule1',
    moat: 'Fossé',
    management: 'Gestion',
    price: 'Prix',
    upside: 'Potentiel',
    composite: 'Composite',
    growth: 'Croissance',
    pbt: 'PBT',
    source: 'Source',
    date: 'Date',
    color: 'Couleur',
    comment: 'Commentaire',
    
    // Metrics
    keyMetrics: 'Métriques clés',
    financial: 'Financier',
    totalChanges: 'Total des changements',
    positive: 'Positif',
    negative: 'Négatif',
    average: 'Moyenne',
    averageSentiment: 'Sentiment Moyen',
    averageUpside: 'Potentiel Moyen',
    
    // Actions
    analyzeStock: 'Analyser l\'action',
    addComment: 'Ajouter un commentaire',
    saveComment: 'Enregistrer le commentaire',
    cancel: 'Annuler',
    refresh: 'Actualiser',
    reloadState: 'Recharger l\'état',
    previous: 'Précédent',
    next: 'Suivant',
    
    // Messages
    noStocksFound: 'Aucune action trouvée',
    noStocksAvailableForSelectedDate: 'Aucune action disponible pour la date sélectionnée',
    noFeaturedStocksFound: 'Aucune action en vedette trouvée',
    noPortfolioStocksFound: 'Aucune action de portefeuille trouvée',
    errorLoadingStocks: 'Erreur lors du chargement des actions',
    errorLoadingFeaturedStocks: 'Erreur lors du chargement des actions en vedette',
    errorLoadingPortfolio: 'Erreur lors du chargement du portefeuille',
    tryAgain: 'Réessayer',
    loading: 'Chargement...',
    noData: 'Aucune donnée',
    
    // Shortcuts
    shortcuts: 'Raccourcis',
    navigate: 'Naviguer',
    dates: 'Dates',
    
    // Stock Details
    signalScore: 'Score de signal',
    rule1Score: 'Score Rule1',
    targetBuyPrice: 'Prix d\'achat cible',
    lastPrice: 'Dernier prix',
    lastSavedCompositeGR: 'Dernier GR composite sauvegardé',
    analystEstimatedLongTermGR: 'GR à long terme estimé par l\'analyste',
    
    // Dashboard specific
    metric: 'Métrique',
    threshold: 'Seuil',
    topGainers: 'Meilleurs gains',
    topLosers: 'Pires pertes',
    gainers: 'Gains',
    losers: 'Pertes',
    
    // Stock Update specific
    buyPrice: 'Prix d\'achat',
    stickerPrice: 'Autocollant',
    current: 'Actuel',
    manual: 'Manuel',
    
    // Stock Scraper Management
    stockScraperManagement: 'Gestion du Scraper d\'Actions',
    scraperStatus: 'Statut du Scraper',
    nextRunCountdown: 'Compte à rebours de la prochaine exécution',
    idle: 'inactif',
    nextRunIn: 'Prochaine Exécution Dans',
    hoursMinutes: 'heures : minutes',
    hoursMinutesSeconds: 'heures : minutes : secondes',
    status: 'Statut',
    stopped: 'Arrêté',
    updates: 'Mises à jour',
    available: 'Disponibles',
    nextRun: 'Prochaine Exécution:',
    lastRun: 'Dernière Exécution:',
    tickerManagement: 'Gestion des Symboles',
    addOrReplaceStockSymbols: 'Ajouter ou remplacer les symboles d\'actions',
    manageTickers: 'Gérer les Symboles',
    activeTickers: 'Symboles Actifs',
    currentlyMonitoredSymbols: 'Symboles actuellement surveillés',
    running: 'En cours',
    locked: 'Verrouillé',
    
    // Time
    stocks: 'actions',
    yesterday: 'Hier',
    
    // Validation
    pleaseSelectBothDates: 'Veuillez sélectionner les dates de début et de fin',
    startDateCannotBeAfterEndDate: 'La date de début ne peut pas être postérieure à la date de fin',
    invalidDateSelection: 'Sélection de date invalide. Veuillez réessayer.',
    
    // Delete functionality
    deleteStock: 'Supprimer l\'action',
    confirmDeleteStock: 'Êtes-vous sûr de vouloir supprimer cette action?',
    errorDeletingStock: 'Échec de la suppression de l\'action. Veuillez réessayer.',
  },
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLanguage = localStorage.getItem('language') as Language;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const t = (key: string) => translations[language][key as keyof typeof translations.en] || key;

  return (
    <SettingsContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};