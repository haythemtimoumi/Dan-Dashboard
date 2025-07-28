'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import clsx from 'clsx';

interface Ticker {
  id: string;
  symbol: string;
  guru_name?: string;
  list_type: string;
  current_step: string;
  active: boolean;
  scrape_status: string;
  scrape_type: string;
  last_action?: string;
  per_portfolio?: boolean;
  last_updated_at: string;
}

interface TickerStats {
  total: number;
  active: number;
}

const API_URL = 'https://www.mytickerlist.com/api';

export default function TickersPage() {
  const { t, language } = useSettings();
  const { isAdmin } = useAuth();
  
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [filteredTickers, setFilteredTickers] = useState<Ticker[]>([]);
  const [stats, setStats] = useState<TickerStats>({ total: 0, active: 0 });
  const [gurus, setGurus] = useState<string[]>([]);
  const [guruObjects, setGuruObjects] = useState<{id: string, guru_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuru, setSelectedGuru] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStep, setSelectedStep] = useState('');
  const [selectedScrapeType, setSelectedScrapeType] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
  // Delete/Edit states
  const [deletingTickers, setDeletingTickers] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<{
    statuses: string[];
    steps: string[];
    scrapeTypes: string[];
  }>({ statuses: [], steps: [], scrapeTypes: [] });
  const [editingTicker, setEditingTicker] = useState<Ticker | null>(null);
  const [editForm, setEditForm] = useState({
    symbol: '',
    list_type: '',
    scrape_type: '',
    current_step: '',
    scrape_status: '',
    guru_id: '',
    active: true
  });
  const [saving, setSaving] = useState(false);
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    scrape_type: 'daily',
    scrape_status: 'pending',
    active: true
  });
  const [bulkSaving, setBulkSaving] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tickersRes, statsRes, gurusRes, filterRes] = await Promise.all([
          fetch(`${API_URL}/tickers`),
          fetch(`${API_URL}/tickers/stats`),
          fetch(`${API_URL}/tickers/gurus`),
          fetch(`${API_URL}/stocks/filter-values`)
        ]);

        if (!tickersRes.ok || !statsRes.ok || !gurusRes.ok || !filterRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [tickersData, statsData, gurusData, filterData] = await Promise.all([
          tickersRes.json(),
          statsRes.json(),
          gurusRes.json(),
          filterRes.json()
        ]);

        // Ensure all data is properly formatted
        const cleanedTickers = Array.isArray(tickersData) ? tickersData : [];
        const cleanedGurus = Array.isArray(gurusData) ? gurusData.map(g => g.guru_name) : [];
        const cleanedGuruObjects = Array.isArray(gurusData) ? gurusData : [];
        const uniqueSources = Array.from(new Set(cleanedTickers.map(t => t.list_type).filter(Boolean)));
        
        setTickers(cleanedTickers);
        setStats(statsData);
        setGurus(cleanedGurus);
        setGuruObjects(cleanedGuruObjects);
        setSources(uniqueSources);
        setFilterValues({
          statuses: filterData.statuses || [],
          steps: filterData.current_steps || [],
          scrapeTypes: filterData.scrape_types || []
        });
      } catch (err) {
        setError('Failed to load tickers data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tickers
  useEffect(() => {
    let filtered = tickers;

    if (searchTerm) {
      filtered = filtered.filter(ticker => 
        ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGuru) {
      filtered = filtered.filter(ticker => ticker.guru_name === selectedGuru);
    }

    if (selectedSource) {
      filtered = filtered.filter(ticker => ticker.list_type === selectedSource);
    }

    if (selectedStatus) {
      filtered = filtered.filter(ticker => ticker.scrape_status === selectedStatus);
    }

    if (selectedStep) {
      filtered = filtered.filter(ticker => ticker.current_step === selectedStep);
    }

    if (selectedScrapeType) {
      filtered = filtered.filter(ticker => ticker.scrape_type === selectedScrapeType);
    }

    if (showActiveOnly) {
      filtered = filtered.filter(ticker => ticker.active);
    }

    setFilteredTickers(filtered);
    setCurrentPage(1);
  }, [tickers, searchTerm, selectedGuru, selectedSource, selectedStatus, selectedStep, selectedScrapeType, showActiveOnly]);

  // Delete handler
  const handleDeleteTicker = async (tickerId: string) => {
    setDeletingTickers(prev => new Set(prev).add(tickerId));
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/tickers/${tickerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ticker: ${response.statusText}`);
      }

      setTickers(prev => prev.filter(t => t.id !== tickerId));
    } catch (error) {
      console.error('Error deleting ticker:', error);
    } finally {
      setDeletingTickers(prev => {
        const newSet = new Set(prev);
        newSet.delete(tickerId);
        return newSet;
      });
    }
  };

  // Edit handlers
  const openEditModal = (ticker: Ticker) => {
    const guruObj = guruObjects.find(g => g.guru_name === ticker.guru_name);
    setEditingTicker(ticker);
    setEditForm({
      symbol: ticker.symbol,
      list_type: ticker.list_type,
      scrape_type: ticker.scrape_type,
      current_step: ticker.current_step,
      scrape_status: ticker.scrape_status,
      guru_id: guruObj?.id || '',
      active: ticker.active
    });
  };

  const handleEditSave = async () => {
    if (!editingTicker) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/tickers/${editingTicker.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error(`Failed to update ticker: ${response.statusText}`);
      }

      const updatedTicker = await response.json();
      setTickers(prev => prev.map(t => t.id === editingTicker.id ? updatedTicker : t));
      setEditingTicker(null);
    } catch (error) {
      console.error('Error updating ticker:', error);
    } finally {
      setSaving(false);
    }
  };

  // Paginated data
  const paginatedTickers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickers, currentPage]);

  const totalPages = Math.ceil(filteredTickers.length / itemsPerPage);

  // Select all functionality
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickers(new Set(paginatedTickers.map(t => t.id)));
    } else {
      setSelectedTickers(new Set());
    }
  };

  const handleSelectTicker = (tickerId: string, checked: boolean) => {
    const newSelected = new Set(selectedTickers);
    if (checked) {
      newSelected.add(tickerId);
    } else {
      newSelected.delete(tickerId);
    }
    setSelectedTickers(newSelected);
  };

  const isAllSelected = paginatedTickers.length > 0 && paginatedTickers.every(t => selectedTickers.has(t.id));
  const isIndeterminate = paginatedTickers.some(t => selectedTickers.has(t.id)) && !isAllSelected;

  // Bulk edit handler
  const handleBulkEdit = async () => {
    setBulkSaving(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const updatePromises = Array.from(selectedTickers).map(tickerId => 
        fetch(`${API_URL}/tickers/${tickerId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scrape_type: bulkEditForm.scrape_type,
            scrape_status: bulkEditForm.scrape_status,
            active: bulkEditForm.active
          })
        })
      );

      await Promise.all(updatePromises);
      
      // Update local state
      setTickers(prev => prev.map(ticker => 
        selectedTickers.has(ticker.id) 
          ? { ...ticker, scrape_type: bulkEditForm.scrape_type, scrape_status: bulkEditForm.scrape_status, active: bulkEditForm.active }
          : ticker
      ));
      
      setShowBulkEdit(false);
      setSelectedTickers(new Set());
    } catch (error) {
      console.error('Error bulk updating tickers:', error);
    } finally {
      setBulkSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'rule1': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-purple-100 text-purple-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Gestion des Tickers' : 'Ticker Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' ? 'Gérer et surveiller tous les tickers' : 'Manage and monitor all tickers'}
          </p>
        </div>
        {selectedTickers.size > 0 && isAdmin && (
          <button
            onClick={() => setShowBulkEdit(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {language === 'fr' ? `Modifier ${selectedTickers.size}` : `Edit ${selectedTickers.size}`}
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">{language === 'fr' ? 'Total' : 'Total'}</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{language === 'fr' ? 'Actifs' : 'Active'}</p>
              <p className="text-3xl font-bold">{stats.active}</p>
            </div>
            <div className="h-12 w-12 bg-green-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">{language === 'fr' ? 'Gurus' : 'Gurus'}</p>
              <p className="text-3xl font-bold">{gurus.length}</p>
            </div>
            <div className="h-12 w-12 bg-purple-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">{language === 'fr' ? 'Filtrés' : 'Filtered'}</p>
              <p className="text-3xl font-bold">{filteredTickers.length}</p>
            </div>
            <div className="h-12 w-12 bg-orange-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Rechercher' : 'Search'}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'fr' ? 'Symbole...' : 'Symbol...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guru</label>
            <select
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{language === 'fr' ? 'Tous' : 'All'}</option>
              {gurus.map(guru => (
                <option key={guru} value={guru}>{guru}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'fr' ? 'Source' : 'Source'}</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{language === 'fr' ? 'Toutes' : 'All'}</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{language === 'fr' ? 'Tous' : 'All'}</option>
              {filterValues.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Étape' : 'Step'}
            </label>
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{language === 'fr' ? 'Toutes' : 'All'}</option>
              {filterValues.steps.map(step => (
                <option key={step} value={step}>{step}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'fr' ? 'Type de Scraping' : 'Scrape Type'}
            </label>
            <select
              value={selectedScrapeType}
              onChange={(e) => setSelectedScrapeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{language === 'fr' ? 'Tous' : 'All'}</option>
              {filterValues.scrapeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {language === 'fr' ? 'Actifs seulement' : 'Active only'}
              </span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGuru('');
                setSelectedSource('');
                setSelectedStatus('');
                setSelectedStep('');
                setSelectedScrapeType('');
                setShowActiveOnly(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {language === 'fr' ? 'Réinitialiser' : 'Reset'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {language === 'fr' ? 'Actions' : 'Actions'}
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Symbole' : 'Symbol'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Guru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Source' : 'Source'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Étape' : 'Step'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Type' : 'Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Actif' : 'Active'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {language === 'fr' ? 'Mis à jour' : 'Updated'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTickers.map((ticker) => (
                <tr key={ticker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedTickers.has(ticker.id)}
                      onChange={(e) => handleSelectTicker(ticker.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(ticker)}
                          className="p-1 rounded-lg hover:bg-blue-100 transition-colors text-blue-600 shadow-sm"
                          title={language === 'fr' ? 'Modifier' : 'Edit'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTicker(ticker.id)}
                          disabled={deletingTickers.has(ticker.id)}
                          className="p-1 rounded-lg hover:bg-red-100 transition-colors text-red-500 shadow-sm disabled:opacity-50"
                          title={language === 'fr' ? 'Supprimer' : 'Delete'}
                        >
                          {deletingTickers.has(ticker.id) ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {ticker.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {ticker.guru_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {ticker.list_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStepColor(ticker.current_step)
                    )}>
                      {ticker.current_step}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusColor(ticker.scrape_status)
                    )}>
                      {ticker.scrape_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {ticker.scrape_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      ticker.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    )}>
                      {ticker.active ? (language === 'fr' ? 'Oui' : 'Yes') : (language === 'fr' ? 'Non' : 'No')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(ticker.last_updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {language === 'fr' ? 'Précédent' : 'Previous'}
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {language === 'fr' ? 'Suivant' : 'Next'}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'fr' ? 'Affichage' : 'Showing'}{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
                    {language === 'fr' ? 'à' : 'to'}{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredTickers.length)}
                    </span>{' '}
                    {language === 'fr' ? 'de' : 'of'}{' '}
                    <span className="font-medium">{filteredTickers.length}</span>{' '}
                    {language === 'fr' ? 'résultats' : 'results'}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={clsx(
                            'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {editingTicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditingTicker(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{language === 'fr' ? 'Modifier le Ticker' : 'Edit Ticker'}</h3>
                  <p className="text-sm text-gray-500">{editingTicker.symbol}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{language === 'fr' ? 'Symbole' : 'Symbol'}</label>
                  <input
                    type="text"
                    value={editForm.symbol}
                    onChange={(e) => setEditForm({...editForm, symbol: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guru</label>
                  <select
                    value={editForm.guru_id}
                    onChange={(e) => setEditForm({...editForm, guru_id: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'fr' ? 'Aucun' : 'None'}</option>
                    {guruObjects.map(guru => (
                      <option key={guru.id} value={guru.id}>{guru.guru_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{language === 'fr' ? 'Source' : 'Source'}</label>
                  <select
                    value={editForm.list_type}
                    onChange={(e) => setEditForm({...editForm, list_type: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{language === 'fr' ? 'Type de Scraping' : 'Scrape Type'}</label>
                  <select
                    value={editForm.scrape_type}
                    onChange={(e) => setEditForm({...editForm, scrape_type: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{language === 'fr' ? 'Étape' : 'Step'}</label>
                  <select
                    value={editForm.current_step}
                    onChange={(e) => setEditForm({...editForm, current_step: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {filterValues.steps.map(step => (
                      <option key={step} value={step}>{step}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editForm.scrape_status}
                    onChange={(e) => setEditForm({...editForm, scrape_status: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not active">{language === 'fr' ? 'Non actif' : 'Not Active'}</option>
                    <option value="pending">{language === 'fr' ? 'En attente' : 'Pending'}</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editForm.active}
                    onChange={(e) => setEditForm({...editForm, active: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? (language === 'fr' ? 'Enregistrement...' : 'Saving...') : (language === 'fr' ? 'Enregistrer' : 'Save')}
                </button>
                <button
                  onClick={() => setEditingTicker(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBulkEdit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{language === 'fr' ? 'Modification en Lot' : 'Bulk Edit'}</h3>
                  <p className="text-sm text-gray-500">{selectedTickers.size} {language === 'fr' ? 'tickers sélectionnés' : 'tickers selected'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{language === 'fr' ? 'Type de Scraping' : 'Scrape Type'}</label>
                  <select
                    value={bulkEditForm.scrape_type}
                    onChange={(e) => setBulkEditForm({...bulkEditForm, scrape_type: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={bulkEditForm.scrape_status}
                    onChange={(e) => setBulkEditForm({...bulkEditForm, scrape_status: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not active">{language === 'fr' ? 'Non actif' : 'Not Active'}</option>
                    <option value="pending">{language === 'fr' ? 'En attente' : 'Pending'}</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="bulkActive"
                    checked={bulkEditForm.active}
                    onChange={(e) => setBulkEditForm({...bulkEditForm, active: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="bulkActive" className="ml-2 text-sm text-gray-700">
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleBulkEdit}
                  disabled={bulkSaving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {bulkSaving ? (language === 'fr' ? 'Enregistrement...' : 'Saving...') : (language === 'fr' ? 'Appliquer à Tous' : 'Apply to All')}
                </button>
                <button
                  onClick={() => setShowBulkEdit(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}