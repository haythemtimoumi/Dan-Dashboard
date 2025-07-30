'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    symbol: '',
    list_type: 'manual',
    scrape_type: 'daily',
    current_step: 'pending',
    scrape_status: 'pending',
    guru_id: '',
    active: true
  });
  const [addSaving, setAddSaving] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tickersRes, statsRes, gurusRes] = await Promise.all([
          fetch(`${API_URL}/tickers`),
          fetch(`${API_URL}/tickers/stats`),
          fetch(`${API_URL}/tickers/gurus`)
        ]);

        if (!tickersRes.ok || !statsRes.ok || !gurusRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [tickersData, statsData, gurusData] = await Promise.all([
          tickersRes.json(),
          statsRes.json(),
          gurusRes.json()
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
        // Extract dynamic filter values from actual ticker data
        const uniqueStatuses = Array.from(new Set(cleanedTickers.map(t => t.scrape_status).filter(Boolean)));
        const uniqueSteps = Array.from(new Set(cleanedTickers.map(t => t.current_step).filter(Boolean)));
        const uniqueScrapeTypes = Array.from(new Set(cleanedTickers.map(t => t.scrape_type).filter(Boolean)));
        
        setFilterValues({
          statuses: uniqueStatuses,
          steps: uniqueSteps,
          scrapeTypes: uniqueScrapeTypes
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

  // Filter tickers - only show data when filters are applied
  useEffect(() => {
    // Check if any filter is applied
    const hasFilters = searchTerm || selectedGuru || selectedSource || selectedStatus || selectedStep || selectedScrapeType || showActiveOnly;
    
    if (!hasFilters) {
      setFilteredTickers([]);
      setCurrentPage(1);
      return;
    }

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
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Gestion des Tickers' : 'Ticker Management'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {language === 'fr' ? 'Affichage:' : 'Showing:'} <span className="font-medium text-gray-900 dark:text-white">{filteredTickers.length}</span> {language === 'fr' ? 'résultats' : 'results'}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === 'fr' ? 'Ajouter Ticker' : 'Add Ticker'}
            </button>
          )}
          {selectedTickers.size > 0 && isAdmin && (
            <button
              onClick={() => setShowBulkEdit(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {language === 'fr' ? `Modifier ${selectedTickers.size}` : `Edit ${selectedTickers.size}`}
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'fr' ? 'Filtres:' : 'Filters:'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
                className="bg-transparent border-0 text-sm focus:ring-0 p-0 min-w-[120px]"
              />
            </div>
            
            <select
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'fr' ? '👤 Tous les gurus' : '👤 All Gurus'}</option>
              {gurus.map(guru => (
                <option key={guru} value={guru}>{guru}</option>
              ))}
            </select>
            
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'fr' ? '📊 Toutes sources' : '📊 All Sources'}</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'fr' ? '🔄 Tous statuts' : '🔄 All Status'}</option>
              {filterValues.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'fr' ? '⚡ Toutes étapes' : '⚡ All Steps'}</option>
              {filterValues.steps.map(step => (
                <option key={step} value={step}>{step}</option>
              ))}
            </select>
            
            <select
              value={selectedScrapeType}
              onChange={(e) => setSelectedScrapeType(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'fr' ? '🔧 Tous types' : '🔧 All Types'}</option>
              {filterValues.scrapeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            
            <label className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {language === 'fr' ? '✅ Actifs' : '✅ Active'}
              </span>
            </label>
            
            {(searchTerm || selectedGuru || selectedSource || selectedStatus || selectedStep || selectedScrapeType || showActiveOnly) && (
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
                className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {language === 'fr' ? '✕ Effacer' : '✕ Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
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
                  <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </th>
                )}
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  {language === 'fr' ? 'Ticker' : 'Ticker'}
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Guru
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Src
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Step
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Type
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Active
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedTickers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center h-20 w-20 bg-blue-100 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {language === 'fr' ? 'Utilisez les filtres pour voir les données' : 'Use filters to view data'}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {language === 'fr' 
                        ? 'Sélectionnez un filtre ou effectuez une recherche pour afficher les tickers.'
                        : 'Select a filter or search to display tickers.'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTickers.map((ticker, index) => (
                <tr key={ticker.id} className={clsx(
                  "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700",
                  index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-750"
                )}>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedTickers.has(ticker.id)}
                      onChange={(e) => handleSelectTicker(ticker.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(ticker)}
                          className="w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                          title={language === 'fr' ? 'Modifier' : 'Edit'}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTicker(ticker.id)}
                          disabled={deletingTickers.has(ticker.id)}
                          className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                          title={language === 'fr' ? 'Supprimer' : 'Delete'}
                        >
                          {deletingTickers.has(ticker.id) ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => router.push(`/dashboard/tickers/${ticker.symbol}`)}
                      className="font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      {ticker.symbol}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white text-xs">
                    {ticker.guru_name || '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs">
                      {ticker.list_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      getStepColor(ticker.current_step)
                    )}>
                      {ticker.current_step}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      getStatusColor(ticker.scrape_status)
                    )}>
                      {ticker.scrape_status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 dark:text-white text-xs">
                    {ticker.scrape_type}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      ticker.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    )}>
                      {ticker.active ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                    {new Date(ticker.last_updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600 sm:px-6">
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
                    <option value="pending">Pending</option>
                    <option value="not active">Not Active</option>
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
      
      {/* Add Ticker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{language === 'fr' ? 'Ajouter un Ticker' : 'Add Ticker'}</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{language === 'fr' ? 'Symbole' : 'Symbol'}</label>
                  <input
                    type="text"
                    value={addForm.symbol}
                    onChange={(e) => setAddForm({...addForm, symbol: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="AAPL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guru</label>
                  <select
                    value={addForm.guru_id}
                    onChange={(e) => setAddForm({...addForm, guru_id: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    value={addForm.list_type}
                    onChange={(e) => setAddForm({...addForm, list_type: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {sources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="addActive"
                    checked={addForm.active}
                    onChange={(e) => setAddForm({...addForm, active: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="addActive" className="ml-2 text-sm text-gray-700">
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={async () => {
                    if (!addForm.symbol.trim()) return;
                    setAddSaving(true);
                    try {
                      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                      const response = await fetch(`${API_URL}/tickers`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(addForm)
                      });
                      if (response.ok) {
                        const newTicker = await response.json();
                        setTickers(prev => [newTicker, ...prev]);
                        setShowAddModal(false);
                        setAddForm({
                          symbol: '',
                          list_type: 'manual',
                          scrape_type: 'daily',
                          current_step: 'pending',
                          scrape_status: 'pending',
                          guru_id: '',
                          active: true
                        });
                      }
                    } catch (error) {
                      console.error('Error adding ticker:', error);
                    } finally {
                      setAddSaving(false);
                    }
                  }}
                  disabled={addSaving || !addForm.symbol.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {addSaving ? (language === 'fr' ? 'Ajout...' : 'Adding...') : (language === 'fr' ? 'Ajouter' : 'Add')}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
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
                    <option value="pending">Pending</option>
                    <option value="not active">Not Active</option>
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