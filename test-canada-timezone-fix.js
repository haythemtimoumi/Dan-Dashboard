// Test script to verify date handling in Eastern Time (Canada)
// Run with: NODE_TZ='America/Toronto' node test-canada-timezone-fix.js

// Force timezone to Eastern Time (Canada)
process.env.TZ = 'America/Toronto';

console.log('=== Testing with Canadian Eastern Time ===');
console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current timezone offset:', new Date().getTimezoneOffset() / -60, 'hours from UTC');

// Import date utility functions
const dateUtils = require('./app/lib/date-utils');

// Test date: July 18, 2025
const testDate = new Date(2025, 6, 18); // Month is 0-indexed, so 6 = July
console.log('\n=== Test Date ===');
console.log('Original date object:', testDate);
console.log('Local time string:', testDate.toString());
console.log('UTC time string:', testDate.toUTCString());
console.log('ISO string:', testDate.toISOString());

// Test our utility functions
console.log('\n=== Testing Date Utility Functions ===');
console.log('formatDateForHighlightedAPI:', dateUtils.formatDateForHighlightedAPI(testDate));
console.log('formatDateForPortfolioAPI:', dateUtils.formatDateForPortfolioAPI(testDate));

// Test parsing dates
console.log('\n=== Testing Date Parsing ===');
const dateStr1 = '07/18/2025'; // MM/DD/YYYY
const dateStr2 = '2025-07-18'; // YYYY-MM-DD
const parsed1 = dateUtils.parseDateString(dateStr1);
const parsed2 = dateUtils.parseDateString(dateStr2);

console.log(`Parsed "${dateStr1}":`, parsed1);
console.log(`Formatted back to highlighted API:`, dateUtils.formatDateForHighlightedAPI(parsed1));
console.log(`Formatted back to portfolio API:`, dateUtils.formatDateForPortfolioAPI(parsed1));

console.log(`Parsed "${dateStr2}":`, parsed2);
console.log(`Formatted back to highlighted API:`, dateUtils.formatDateForHighlightedAPI(parsed2));
console.log(`Formatted back to portfolio API:`, dateUtils.formatDateForPortfolioAPI(parsed2));

// Test API URL construction
console.log('\n=== Testing API URL Construction ===');

// For highlighted stocks API
const highlightedApiUrl = `https://www.mytickerlist.com/api/stocks/highlighted/filter?startDate=${dateUtils.formatDateForHighlightedAPI(testDate)}&endDate=${dateUtils.formatDateForHighlightedAPI(testDate)}`;
console.log('Highlighted API URL:', highlightedApiUrl);

// For portfolio API
const portfolioApiUrl = `https://www.mytickerlist.com/api/stocks/filter-by-date-source?date=${dateUtils.formatDateForPortfolioAPI(testDate)}&source=manual`;
console.log('Portfolio API URL:', portfolioApiUrl);

// Simulate API date filtering
console.log('\n=== Simulating API Date Filtering ===');

// Mock stock data with various timestamps
const mockStocks = [
  { 
    id: '1', 
    ticker: 'AAPL', 
    created_at: '2025-07-17T20:00:00.000Z', // July 17 8PM UTC (July 17 4PM in Toronto)
    source: 'manual'
  },
  { 
    id: '2', 
    ticker: 'MSFT', 
    created_at: '2025-07-18T02:00:00.000Z', // July 18 2AM UTC (July 17 10PM in Toronto)
    source: 'manual'
  },
  { 
    id: '3', 
    ticker: 'GOOGL', 
    created_at: '2025-07-18T14:00:00.000Z', // July 18 2PM UTC (July 18 10AM in Toronto)
    source: 'manual'
  },
  { 
    id: '4', 
    ticker: 'AMZN', 
    created_at: '2025-07-19T01:00:00.000Z', // July 19 1AM UTC (July 18 9PM in Toronto)
    source: 'manual'
  }
];

// Test filtering for July 18, 2025
const targetDate = dateUtils.formatDateForHighlightedAPI(testDate);
console.log(`\n=== Filtering stocks for date: ${targetDate} ===`);

// Filter stocks using our UTC noon approach
const filteredStocks = mockStocks.filter(stock => {
  const stockDate = new Date(stock.created_at);
  const stockUTC = new Date(Date.UTC(
    stockDate.getFullYear(),
    stockDate.getMonth(),
    stockDate.getDate(),
    12, 0, 0
  ));
  const stockDateStr = stockUTC.toISOString().split('T')[0];
  
  console.log(`Stock ${stock.ticker}: created_at=${stock.created_at}, stockDateStr=${stockDateStr}, match=${stockDateStr === targetDate}`);
  
  return stockDateStr === targetDate;
});

console.log('\n=== Filtered Results ===');
console.log('Found', filteredStocks.length, 'stocks for', targetDate);
filteredStocks.forEach(stock => {
  console.log(`- ${stock.ticker} (created at ${stock.created_at})`);
});

// Test with local date creation
console.log('\n=== Testing Local Date Creation ===');
const localDate = new Date(2025, 6, 18);
console.log('Local date:', localDate);
console.log('Formatted for API:', dateUtils.formatDateForHighlightedAPI(localDate));

// Test with UTC date creation
console.log('\n=== Testing UTC Date Creation ===');
const utcDate = new Date(Date.UTC(2025, 6, 18, 12, 0, 0));
console.log('UTC date:', utcDate);
console.log('Formatted for API:', dateUtils.formatDateForHighlightedAPI(utcDate));

console.log('\nTest completed. If the fix works correctly:');
console.log('1. Both date formats should consistently show "2025-07-18" and "07/18/2025"');
console.log('2. API URLs should use the correct date format');
console.log('3. Filtered results should include MSFT and GOOGL (both July 18 in UTC)');
console.log('4. AAPL should be excluded (July 17 in UTC)');
console.log('5. AMZN should be excluded (July 19 in UTC)');