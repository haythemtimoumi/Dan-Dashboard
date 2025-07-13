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
    dashboard: 'Dashboard',
    highlighted: 'Highlighted',
    portfolio: 'Portfolio',
    update: 'Update',
    addStock: 'Add Stock',
    settings: 'Settings',
    darkMode: 'Dark Mode',
    language: 'Language',
    english: 'English',
    french: 'French',
    logout: 'Logout',
    featuredStocks: 'Featured Stocks',
    portfolioList: 'Portfolio List',
    stockUpdate: 'Stock Update',
    highlightedInvestmentOpportunities: 'Highlighted investment opportunities',
    manualPortfolioStocks: 'Manual portfolio stocks',
    filterByDateRange: 'Filter by Date Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    today: 'Today',
    apply: 'Apply',
    noStocksFound: 'No Stocks Found',
    errorLoadingStocks: 'Error Loading Stocks',
    tryAgain: 'Try Again',
    loading: 'Loading...',
    keyMetrics: 'Key Metrics',
    financial: 'Financial',
    analyzeStock: 'Analyze Stock',
    shortcuts: 'Shortcuts',
    navigate: 'Navigate',
    dates: 'Dates',
  },
  fr: {
    dashboard: 'Tableau de bord',
    highlighted: 'En vedette',
    portfolio: 'Portefeuille',
    update: 'Mettre à jour',
    addStock: 'Ajouter Action',
    settings: 'Paramètres',
    darkMode: 'Mode sombre',
    language: 'Langue',
    english: 'Anglais',
    french: 'Français',
    logout: 'Déconnexion',
    featuredStocks: 'Actions en vedette',
    portfolioList: 'Liste du portefeuille',
    stockUpdate: 'Mise à jour des actions',
    highlightedInvestmentOpportunities: 'Opportunités d\'investissement en vedette',
    manualPortfolioStocks: 'Actions du portefeuille manuel',
    filterByDateRange: 'Filtrer par plage de dates',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    today: 'Aujourd\'hui',
    apply: 'Appliquer',
    noStocksFound: 'Aucune action trouvée',
    errorLoadingStocks: 'Erreur lors du chargement des actions',
    tryAgain: 'Réessayer',
    loading: 'Chargement...',
    keyMetrics: 'Métriques clés',
    financial: 'Financier',
    analyzeStock: 'Analyser l\'action',
    shortcuts: 'Raccourcis',
    navigate: 'Naviguer',
    dates: 'Dates',
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