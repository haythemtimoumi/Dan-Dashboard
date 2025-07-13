'use client';

import { Fragment } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/app/contexts/settings-context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, language, toggleTheme, setLanguage, t } = useSettings();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('settings')}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t('darkMode')}
                      </span>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                      className={`${
                        theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    >
                      <span
                        className={`${
                          theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                      {t('language')}
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setLanguage('en')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          language === 'en'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {t('english')}
                      </button>
                      <button
                        onClick={() => setLanguage('fr')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          language === 'fr'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {t('french')}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}