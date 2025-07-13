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