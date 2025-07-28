// Script to verify the timezone fix by making API calls
// Run with: NODE_TZ='America/Toronto' node verify-canada-timezone-fix.js
const fetch = require('node-fetch');

// Force timezone to Eastern Time (Canada)
process.env.TZ = 'America/Toronto';

console.log('=== Verifying Timezone Fix for Canadian Users ===');
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

// Format dates for API calls
const highlightedApiDate = dateUtils.formatDateForHighlightedAPI(testDate);
const portfolioApiDate = dateUtils.formatDateForPortfolioAPI(testDate);

console.log('\n=== Formatted Dates for API Calls ===');
console.log('Highlighted API format:', highlightedApiDate);
console.log('Portfolio API format:', portfolioApiDate);

// API URLs
const API_BASE_URL = 'http://localhost:3000/api';
const highlightedApiUrl = `${API_BASE_URL}/stocks/highlighted/filter?startDate=${highlightedApiDate}&endDate=${highlightedApiDate}`;
const portfolioApiUrl = `${API_BASE_URL}/stocks/filter-by-date-source?date=${portfolioApiDate}&source=manual`;

console.log('\n=== API URLs ===');
console.log('Highlighted API URL:', highlightedApiUrl);
console.log('Portfolio API URL:', portfolioApiUrl);

// Function to make API calls
async function testApis() {
  try {
    console.log('\n=== Testing Highlighted Stocks API ===');
    const highlightedResponse = await fetch(highlightedApiUrl);
    
    if (!highlightedResponse.ok) {
      console.error(`API request failed with status: ${highlightedResponse.status}`);
    } else {
      const highlightedData = await highlightedResponse.json();
      console.log(`Found ${highlightedData.length} highlighted stocks for ${highlightedApiDate}`);
      
      if (highlightedData.length > 0) {
        console.log('Sample stocks:');
        highlightedData.slice(0, 3).forEach(stock => {
          console.log(`- ${stock.ticker} (created at ${stock.created_at || stock.date})`);
        });
      }
    }
    
    console.log('\n=== Testing Portfolio API ===');
    const portfolioResponse = await fetch(portfolioApiUrl);
    
    if (!portfolioResponse.ok) {
      console.error(`API request failed with status: ${portfolioResponse.status}`);
    } else {
      const portfolioData = await portfolioResponse.json();
      
      // Handle different response formats
      const stocks = portfolioData.stocks || portfolioData;
      const stocksArray = Array.isArray(stocks) ? stocks : [];
      
      console.log(`Found ${stocksArray.length} portfolio stocks for ${portfolioApiDate}`);
      
      if (stocksArray.length > 0) {
        console.log('Sample stocks:');
        stocksArray.slice(0, 3).forEach(stock => {
          console.log(`- ${stock.ticker} (created at ${stock.created_at || stock.date})`);
        });
      }
    }
    
    console.log('\n=== Verification Complete ===');
    console.log('If the fix is working correctly:');
    console.log('1. Both APIs should return data for July 18, 2025');
    console.log('2. No data from July 17 or July 19 should be included');
    console.log('3. The same results should appear regardless of timezone');
    
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

// Run the tests
testApis();