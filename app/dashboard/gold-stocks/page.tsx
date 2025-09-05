'use client';

import { useState, useEffect } from 'react';
import { fetchCompanyAnalysis, CompanyAnalysis } from '@/app/lib/gold-stocks-api';
import { useSettings } from '@/app/contexts/settings-context';

export default function GoldStocksPage() {
  const [companies, setCompanies] = useState<CompanyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('2025-09-03');
  const { t, language } = useSettings();

  useEffect(() => {
    loadCompanies();
  }, [selectedDate]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompanyAnalysis(selectedDate);
      setCompanies(data);
    } catch (err) {
      setError(language === 'fr' ? 'Erreur lors du chargement des données' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={loadCompanies}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'fr' ? 'Actions Or' : 'Gold Stocks'}
        </h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={loadCompanies}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Symbole' : 'Symbol'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Entreprise' : 'Company'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Bourse' : 'Exchange'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Prix' : 'Price'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Catégorie' : 'Category'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Hausse' : 'Upside'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Baisse' : 'Downside'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Qualité' : 'Quality'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Risque' : 'Risk'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Croissance CF' : 'CF Growth'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Multiple FCF' : 'FCF Multiple'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Signal' : 'Signal'}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Sentiment' : 'Sentiment'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {company.full_symbol}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {company.company_name}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {company.exchange}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.price} {company.currency}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {company.category}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.upside || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.downside || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.quality || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.risk || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.cash_flow_growth || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.free_cash_multiple || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.signal_score ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        company.signal_score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        company.signal_score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {company.signal_score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.sentiment_score ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        company.sentiment_score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        company.sentiment_score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {company.sentiment_score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {companies.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
          </p>
        </div>
      )}
    </div>
  );
}