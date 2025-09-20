'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchCompanyAnalysis, fetchRecentDate, CompanyAnalysis } from '@/app/lib/gold-stocks-api';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import { ChevronUpIcon, ChevronDownIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { EnhancedCommentModal } from '@/app/ui/stocks/enhanced-comment-modal';
import { TickerViewModal } from '@/app/ui/stocks/ticker-view-modal';

type SortField = keyof CompanyAnalysis | 'top25' | 'mormons' | 'top_picks';
type SortDirection = 'asc' | 'desc';

export default function GoldStocksPage() {
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<CompanyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('cash_flow_growth');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [tooltip, setTooltip] = useState<{ company: CompanyAnalysis; position: { x: number; y: number } } | null>(null);
  const [stockComments, setStockComments] = useState<{[key: string]: string}>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [stocksWithComments, setStocksWithComments] = useState<Set<string>>(new Set());
  const [lastComments, setLastComments] = useState<{[key: string]: string}>({});
  const [commentTooltip, setCommentTooltip] = useState<{ ticker: string; comment: string; position: { x: number; y: number } } | null>(null);
  const [allUserComments, setAllUserComments] = useState<any[]>([]);
  const [showTickerViewModal, setShowTickerViewModal] = useState<string | null>(null);
  const [tickerFilter, setTickerFilter] = useState<string>('');
  const [targetFilter, setTargetFilter] = useState<boolean>(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize sorting state from URL parameters
  useEffect(() => {
    const urlSortBy = searchParams.get('sortBy');
    const urlSortOrder = searchParams.get('sortOrder');
    const urlCategory = searchParams.get('category');
    const urlTickerFilter = searchParams.get('tickerFilter');
    const urlTargetFilter = searchParams.get('targetFilter');
    
    if (urlSortBy) setSortField(urlSortBy as SortField);
    if (urlSortOrder) setSortDirection(urlSortOrder as SortDirection);
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlTickerFilter) setTickerFilter(urlTickerFilter);
    if (urlTargetFilter === 'true') setTargetFilter(true);
  }, [searchParams]);
  const { t, language } = useSettings();
  const { user } = useAuth();

  useEffect(() => {
    loadRecentDate();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadCompanies();
    }
  }, [selectedDate]);

  // Load comments from localStorage on mount
  useEffect(() => {
    const savedComments = localStorage.getItem('stockComments');
    if (savedComments) setStockComments(JSON.parse(savedComments));
  }, []);

  // Check comments for companies when user changes
  useEffect(() => {
    if (companies.length > 0 && user?.id) {
      checkCommentsForStocks(companies);
    }
  }, [user?.id]);

  const loadRecentDate = async () => {
    try {
      // Check if date is provided in URL params first
      const urlDate = searchParams.get('date');
      if (urlDate) {
        console.log('Using date from URL params:', urlDate);
        setSelectedDate(urlDate);
        return;
      }
      
      console.log('Fetching recent date...');
      const recentDate = await fetchRecentDate();
      console.log('Recent date fetched:', recentDate);
      setSelectedDate(recentDate);
    } catch (error) {
      console.error('Error fetching recent date:', error);
      setSelectedDate('2025-09-03'); // Fallback to default
    }
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading companies with date:', selectedDate);
      const data = await fetchCompanyAnalysis(selectedDate);
      console.log('Companies loaded:', data.length);
      setCompanies(data);
      
      // Auto-load comments for all companies
      await checkCommentsForStocks(data);
    } catch (err) {
      console.error('Error loading companies:', err);
      setError(language === 'fr' ? 'Erreur lors du chargement des données' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Comment functionality
  const handleCommentSave = (companyId: string, comment: string) => {
    const company = companies.find(c => c.id.toString() === companyId);
    const ticker = company?.full_symbol.includes(':') ? company.full_symbol.split(':')[1] : company?.full_symbol;
    const key = ticker || companyId;
    const newComments = { ...stockComments, [key]: comment };
    setStockComments(newComments);
    localStorage.setItem('stockComments', JSON.stringify(newComments));
    
    if (company && ticker) {
      const newStocksWithComments = new Set(stocksWithComments);
      const newLastComments = { ...lastComments };
      
      if (comment.trim()) {
        newStocksWithComments.add(ticker);
        newLastComments[ticker] = comment;
      } else {
        newStocksWithComments.delete(ticker);
        delete newLastComments[ticker];
      }
      
      setStocksWithComments(newStocksWithComments);
      setLastComments(newLastComments);
    }
    
    setCurrentComment('');
    setShowCommentModal(null);
  };

  const openCommentModal = (companyId: string) => {
    setCurrentComment('');
    setShowCommentModal(companyId);
  };

  const handleCommentIconEnter = (event: React.MouseEvent, ticker: string) => {
    const lastComment = lastComments[ticker];
    if (lastComment) {
      setCommentTooltip({
        ticker,
        comment: lastComment,
        position: { x: event.clientX, y: event.clientY }
      });
    }
  };

  const handleCommentIconLeave = () => {
    setCommentTooltip(null);
  };

  // Function to check comments for all companies using user API
  // Color management using same API as portfolio
  const cycleColor = async (companyId: string) => {
    const company = companies.find(c => c.id.toString() === companyId);
    if (!company) return;
    
    const ticker = company.full_symbol.includes(':') ? company.full_symbol.split(':')[1] : company.full_symbol;
    const colors = ['neutral', 'red', 'green', 'yellow'];
    const currentIndex = colors.indexOf((company as any).color || 'neutral');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    
    // Update local state immediately for instant feedback
    setCompanies(companies.map(c => 
      c.id.toString() === companyId ? { ...c, color: nextColor } as any : c
    ));
    
    // Update via proxy API
    try {
      const response = await fetch(`/api/proxy/stocks/${ticker}/color`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ color: nextColor })
      });
      
      if (!response.ok) {
        console.error('Failed to update color:', response.statusText);
        // Revert local state on API failure
        setCompanies(companies.map(c => 
          c.id.toString() === companyId ? { ...c, color: (company as any).color } as any : c
        ));
      }
    } catch (error) {
      console.error('Error updating color:', error);
      // Revert local state on error
      setCompanies(companies.map(c => 
        c.id.toString() === companyId ? { ...c, color: (company as any).color } as any : c
      ));
    }
  };

  const checkCommentsForStocks = async (companiesList?: CompanyAnalysis[]) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/proxy/comments/user/${user.id}?t=${Date.now()}`);
      
      if (response.ok) {
        const allComments = await response.json();
        const newStocksWithComments = new Set<string>();
        const newLastComments: {[key: string]: string} = {};
        
        // Group comments by ticker and get the latest comment for each
        const commentsByTicker: {[key: string]: any[]} = {};
        allComments.forEach((comment: any) => {
          if (!commentsByTicker[comment.ticker_symbol]) {
            commentsByTicker[comment.ticker_symbol] = [];
          }
          commentsByTicker[comment.ticker_symbol].push(comment);
        });
        
        // Process each ticker's comments
        Object.entries(commentsByTicker).forEach(([ticker, comments]) => {
          if (comments.length > 0) {
            newStocksWithComments.add(ticker);
            // Get the most recent comment
            const latestComment = comments.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            newLastComments[ticker] = latestComment.comment;
          }
        });
        
        setStocksWithComments(newStocksWithComments);
        setLastComments(newLastComments);
        setAllUserComments(allComments);
      }
    } catch (error) {
      console.error('Error checking comments:', error);
    }
  };



  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredCompanies = companies.filter(company => {
    // Filter by category
    const categoryMatch = selectedCategory === 'all' || 
      (company.categories && Array.isArray(company.categories) && company.categories.includes(selectedCategory));
    
    // Filter by ticker (extract ticker from full_symbol)
    const ticker = company.full_symbol.includes(':') ? company.full_symbol.split(':')[1] : company.full_symbol;
    const tickerMatch = !tickerFilter || ticker.toLowerCase().includes(tickerFilter.toLowerCase());
    
    return categoryMatch && tickerMatch;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    // If target filter is active, prioritize target stocks
    if (targetFilter) {
      const aTarget = a.target ? 1 : 0;
      const bTarget = b.target ? 1 : 0;
      if (aTarget !== bTarget) {
        return bTarget - aTarget; // target=true comes first
      }
    }
    
    let aVal, bVal;
    
    // Handle category sorting
    if (sortField === 'top25' || sortField === 'mormons' || sortField === 'top_picks') {
      aVal = a.categories && a.categories.includes(sortField) ? 1 : 0;
      bVal = b.categories && b.categories.includes(sortField) ? 1 : 0;
    } else {
      aVal = a[sortField as keyof CompanyAnalysis];
      bVal = b[sortField as keyof CompanyAnalysis];
    }
    
    if (aVal === null || aVal === undefined || aVal === '') return 1;
    if (bVal === null || bVal === undefined || bVal === '') return -1;
    
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      // For cash_flow_growth field with percentages and commas
      if (sortField === 'cash_flow_growth') {
        const aNum = aVal === 'n/a' ? -Infinity : parseFloat(aVal.replace(/[,%]/g, '')) || 0;
        const bNum = bVal === 'n/a' ? -Infinity : parseFloat(bVal.replace(/[,%]/g, '')) || 0;
        comparison = aNum - bNum;
      }
      // For numeric fields like upside/downside
      else if (sortField === 'upside' || sortField === 'downside') {
        const aNum = parseFloat(aVal) || 0;
        const bNum = parseFloat(bVal) || 0;
        comparison = aNum - bNum;
      }
      // For text fields like quality and risk
      else {
        comparison = aVal.localeCompare(bVal);
      }
    } else {
      comparison = Number(aVal) - Number(bVal);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUpIcon className="w-3 h-3" /> : 
            <ChevronDownIcon className="w-3 h-3" />
        )}
      </div>
    </th>
  );

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Actions Or' : 'Gold Stocks'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {language === 'fr' ? `${sortedCompanies.length} enregistrement${sortedCompanies.length !== 1 ? 's' : ''} sur ${companies.length}` : `${sortedCompanies.length} record${sortedCompanies.length !== 1 ? 's' : ''} of ${companies.length}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTargetFilter(!targetFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
              targetFilter
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            title={language === 'fr' ? 'Filtrer le portefeuille en haut' : 'Filter portfolio on top'}
          >
            <StarIcon className="w-4 h-4" />
            {language === 'fr' ? 'Portefeuille' : 'Portfolio'}
          </button>
          <input
            type="text"
            placeholder={language === 'fr' ? 'Filtrer par ticker...' : 'Filter by ticker...'}
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">{language === 'fr' ? 'Toutes les catégories' : 'All Categories'}</option>
            <option value="top25">TOP25</option>
            <option value="mormons">Mormons</option>
            <option value="top_picks">{language === 'fr' ? 'Choix Principaux' : 'Top Picks'}</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => {
              console.log('Force refresh clicked');
              loadCompanies();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {t('refresh')}
          </button>
          <button
            onClick={() => {
              console.log('Force reload recent date');
              setSelectedDate('');
              loadRecentDate();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            {language === 'fr' ? 'Date Récente' : 'Recent Date'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  #
                </th>
                <SortableHeader field="company_name">
                  {language === 'fr' ? 'Entreprise' : 'Company'}
                </SortableHeader>
                <SortableHeader field="full_symbol">
                  {language === 'fr' ? 'Symbole' : 'Symbol'}
                </SortableHeader>
                <SortableHeader field="price">
                  {language === 'fr' ? 'Prix' : 'Price'}
                </SortableHeader>

                <SortableHeader field="downside">
                  {language === 'fr' ? 'Baisse' : 'Downside'}
                </SortableHeader>
                <SortableHeader field="quality">
                  {language === 'fr' ? 'Qualité' : 'Quality'}
                </SortableHeader>
                <SortableHeader field="risk">
                  {language === 'fr' ? 'Risque' : 'Risk'}
                </SortableHeader>
                <SortableHeader field="cash_flow_growth">
                  {language === 'fr' ? 'Hausse' : 'Upside'}
                </SortableHeader>
                <SortableHeader field="signal_score">
                  {language === 'fr' ? 'Signal' : 'Signal'}
                </SortableHeader>
                <SortableHeader field="sentiment_score">
                  {language === 'fr' ? 'Sentiment' : 'Sentiment'}
                </SortableHeader>
                <SortableHeader field="top25">
                  TOP25
                </SortableHeader>
                <SortableHeader field="mormons">
                  Mormons
                </SortableHeader>
                <SortableHeader field="top_picks">
                  {language === 'fr' ? 'Choix Principaux' : 'Top Picks'}
                </SortableHeader>


                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Actions' : 'Actions'}
                </th>
                <SortableHeader field="category">
                  {language === 'fr' ? 'Catégorie' : 'Category'}
                </SortableHeader>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedCompanies.map((company, index) => {
                const companyColor = (company as any).color || '';
                const ticker = company.full_symbol.includes(':') ? company.full_symbol.split(':')[1] : company.full_symbol;
                const hasComment = stocksWithComments.has(ticker);
                
                return (
                <tr 
                  key={company.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    companyColor === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
                    companyColor === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                    companyColor === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                  }`}
                  onClick={() => {
                    const params = new URLSearchParams({
                      date: selectedDate,
                      sortBy: sortField,
                      sortOrder: sortDirection,
                      category: selectedCategory,
                      tickerFilter: tickerFilter,
                      targetFilter: targetFilter.toString(),
                      position: (index + 1).toString()
                    });
                    // Extract ticker symbol from full_symbol (e.g., "A1G" from "ASX:A1G")
                    const tickerSymbol = company.full_symbol.includes(':') ? company.full_symbol.split(':')[1] : company.full_symbol;
                    window.location.href = `/dashboard/gold-stocks/${encodeURIComponent(tickerSymbol)}?${params.toString()}`;
                  }}
                >
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.company_name}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await cycleColor(company.id.toString());
                        }}
                        className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                        style={{ backgroundColor: companyColor === 'neutral' ? 'transparent' : companyColor || 'transparent' }}
                      />
                      {company.target && (
                        <StarIconSolid className="w-4 h-4 text-yellow-500" title={language === 'fr' ? 'Cible' : 'Target'} />
                      )}
                      {company.full_symbol}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {company.price} {company.currency}
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
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    {company.categories && company.categories.includes('top25') ? (
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    {company.categories && company.categories.includes('mormons') ? (
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                    {company.categories && company.categories.includes('top_picks') ? (
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>


                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTickerViewModal(company.full_symbol.includes(':') ? company.full_symbol.split(':')[1] : company.full_symbol);
                        }}
                        className="p-1 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 rounded transition-all duration-200"
                        title={language === 'fr' ? 'Voir les informations du ticker' : 'View ticker information'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCommentModal(company.id.toString());
                        }}
                        onMouseEnter={(e) => handleCommentIconEnter(e, ticker)}
                        onMouseLeave={handleCommentIconLeave}
                        className={`p-1 rounded transition-all duration-200 ${
                          hasComment
                            ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transform hover:scale-110' 
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <svg className={`${hasComment ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-200`} 
                             fill={hasComment ? 'currentColor' : 'none'} 
                             stroke="currentColor" 
                             viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {company.category}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedCompanies.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {selectedCategory === 'all' 
              ? (language === 'fr' ? 'Aucune donnée disponible' : 'No data available')
              : (language === 'fr' ? 'Aucune entreprise trouvée pour cette catégorie' : 'No companies found for this category')
            }
          </p>
        </div>
      )}



      {/* Comment Tooltip */}
      {commentTooltip && (
        <div
          className="fixed z-50 bg-blue-900 text-white p-3 rounded-lg shadow-xl text-sm max-w-xs border-2 border-blue-600 pointer-events-none"
          style={{
            left: Math.min(commentTooltip.position.x + 10, window.innerWidth - 320),
            top: commentTooltip.position.y - 60,
          }}
        >
          <div className="font-bold text-blue-200 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {language === 'fr' ? 'Dernier commentaire' : 'Last Comment'}
          </div>
          <div className="text-blue-100 italic">
            &quot;{commentTooltip.comment.length > 100 
              ? commentTooltip.comment.substring(0, 100) + '...' 
              : commentTooltip.comment}&quot;
          </div>
        </div>
      )}

      {/* Ticker View Modal */}
      {showTickerViewModal && (
        <TickerViewModal
          isOpen={!!showTickerViewModal}
          onClose={() => setShowTickerViewModal(null)}
          ticker={showTickerViewModal}
        />
      )}

      {/* Enhanced Comment Modal */}
      {showCommentModal && (
        <EnhancedCommentModal
          isOpen={!!showCommentModal}
          onClose={() => setShowCommentModal(null)}
          ticker={(() => {
            const company = companies.find(c => c.id.toString() === showCommentModal);
            return company?.full_symbol.includes(':') ? company.full_symbol.split(':')[1] : company?.full_symbol || '';
          })()}
          onSave={(comment) => handleCommentSave(showCommentModal, comment)}
          currentComment={currentComment}
          setCurrentComment={setCurrentComment}
          tickerColor="neutral"
          userComments={allUserComments}
          onRefreshComments={() => checkCommentsForStocks()}
        />
      )}
    </div>
  );
}