// Test script to verify date handling in Eastern Time (Canada)
// Run with: NODE_TZ='America/Toronto' node test-canada-timezone.js

// Force timezone to Eastern Time (Canada)
process.env.TZ = 'America/Toronto';

console.log('=== Testing with Canadian Eastern Time ===');
console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current timezone offset:', new Date().getTimezoneOffset() / -60, 'hours from UTC');

// Import date utility functions
const dateUtils = require('./app/lib/date-utils');

// Test date: July 17, 2025
const testDate = new Date(2025, 6, 17); // Month is 0-indexed, so 6 = July
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
const dateStr1 = '07/17/2025'; // MM/DD/YYYY
const dateStr2 = '2025-07-17'; // YYYY-MM-DD
const parsed1 = dateUtils.parseDateString(dateStr1);
const parsed2 = dateUtils.parseDateString(dateStr2);

console.log(`Parsed "${dateStr1}":`, parsed1);
console.log(`Formatted back to highlighted API:`, dateUtils.formatDateForHighlightedAPI(parsed1));
console.log(`Formatted back to portfolio API:`, dateUtils.formatDateForPortfolioAPI(parsed1));

console.log(`Parsed "${dateStr2}":`, parsed2);
console.log(`Formatted back to highlighted API:`, dateUtils.formatDateForHighlightedAPI(parsed2));
console.log(`Formatted back to portfolio API:`, dateUtils.formatDateForPortfolioAPI(parsed2));

// Test today's date
console.log('\n=== Testing Today\'s Date ===');
const today = dateUtils.getTodayLocal();
console.log('getTodayLocal():', today);
console.log('Formatted for highlighted API:', dateUtils.formatDateForHighlightedAPI(today));
console.log('Formatted for portfolio API:', dateUtils.formatDateForPortfolioAPI(today));

// Simulate API date filtering
console.log('\n=== Simulating API Date Filtering ===');

// Mock stock data
const mockStocks = [
  { 
    id: '1', 
    ticker: 'AAPL', 
    created_at: '2025-07-16T20:00:00.000Z', // This is July 16 8PM UTC, which is July 16 in Toronto
    source: 'manual'
  },
  { 
    id: '2', 
    ticker: 'MSFT', 
    created_at: '2025-07-17T02:00:00.000Z', // This is July 17 2AM UTC, which is July 16 10PM in Toronto
    source: 'manual'
  },
  { 
    id: '3', 
    ticker: 'GOOGL', 
    created_at: '2025-07-17T14:00:00.000Z', // This is July 17 2PM UTC, which is July 17 10AM in Toronto
    source: 'manual'
  },
  { 
    id: '4', 
    ticker: 'AMZN', 
    created_at: '2025-07-18T10:00:00.000Z', // This is July 18 10AM UTC, which is July 18 6AM in Toronto
    source: 'manual'
  }
];

// Test both dates: July 17 and July 18, 2025
const testDates = [
  new Date(Date.UTC(2025, 6, 17, 12, 0, 0)),
  new Date(Date.UTC(2025, 6, 18, 12, 0, 0))
];

// Test each date separately
testDates.forEach(testDateUTC => {
  const testDateStr = testDateUTC.toISOString().split('T')[0];
  console.log('\n=== Testing Date:', testDateStr, '===');
  
  // Filter stocks using our new approach
  const filteredStocks = mockStocks.filter(stock => {
    const stockDate = new Date(stock.created_at);
    const stockUTC = new Date(Date.UTC(
      stockDate.getFullYear(),
      stockDate.getMonth(),
      stockDate.getDate(),
      12, 0, 0
    ));
    const stockDateStr = stockUTC.toISOString().split('T')[0];
    
    console.log(`Stock ${stock.ticker}: created_at=${stock.created_at}, stockDateStr=${stockDateStr}, match=${stockDateStr === testDateStr}`);
    
    return stockDateStr === testDateStr;
  });
  
  console.log('\n=== Filtered Results for', testDateStr, '===');
  console.log('Found', filteredStocks.length, 'stocks:');
  filteredStocks.forEach(stock => {
    console.log(`- ${stock.ticker} (created at ${stock.created_at})`);
  });
});

console.log('\nTest completed. If the fix works correctly:');
console.log('- For 2025-07-17: Only MSFT and GOOGL should be in the results');
console.log('- For 2025-07-18: Only AMZN should be in the results');