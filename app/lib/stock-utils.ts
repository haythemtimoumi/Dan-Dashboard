// Utility functions for handling stock data from different API endpoints

export interface GroupedStock {
  ticker: string;
  gurus: string;
  guru_count: string;
  sentiment_score: number;
  // ... other stock properties
}

export interface LatestStock {
  ticker: string;
  guru: string;
  sentiment_score: number;
  date: string;
  // ... other stock properties
}

export const isGroupedStock = (stock: any): stock is GroupedStock => {
  return stock.gurus !== undefined && stock.gurus !== null && stock.guru_count !== undefined;
};

export const getGuruDisplay = (stock: any) => {
  // Handle new API structure with gurus array
  if (stock.gurus && Array.isArray(stock.gurus)) {
    return {
      type: 'grouped' as const,
      gurus: stock.gurus,
      count: stock.gurus.length
    };
  }
  // Handle legacy grouped structure
  if (isGroupedStock(stock) && stock.gurus) {
    return {
      type: 'grouped' as const,
      gurus: stock.gurus.split(', '),
      count: parseInt(stock.guru_count || '0')
    };
  }
  // Handle comma-separated guru string
  if (stock.guru && stock.guru.includes(', ')) {
    const gurus = stock.guru.split(', ');
    return {
      type: 'grouped' as const,
      gurus: gurus,
      count: gurus.length
    };
  }
  return {
    type: 'single' as const,
    guru: stock.guru || null,
    date: stock.date
  };
};

export const formatGuruBadges = (stock: any, maxDisplay: number = 2) => {
  const guruInfo = getGuruDisplay(stock);
  
  if (guruInfo.type === 'grouped') {
    const displayGurus = guruInfo.gurus.slice(0, maxDisplay);
    const remainingCount = guruInfo.count - maxDisplay;
    
    return {
      displayGurus,
      hasMore: remainingCount > 0,
      remainingCount
    };
  }
  
  return {
    displayGurus: guruInfo.guru ? [guruInfo.guru] : [],
    hasMore: false,
    remainingCount: 0
  };
};