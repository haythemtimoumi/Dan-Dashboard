// Test script to verify the API endpoints for both screens with specific dates
// This simulates making API requests to both the highlighted stocks and portfolio list endpoints

// Import required modules
const https = require('https');

// Base API URL
const API_BASE_URL = 'https://www.mytickerlist.com/api';

// Test dates
const TEST_DATES = [
  { year: 2025, month: 7, day: 17 }, // July 17, 2025
  { year: 2025, month: 7, day: 18 }  // July 18, 2025
];

// Format dates for API requests
const formattedDates = TEST_DATES.map(date => {
  const isoDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  const slashDate = `${String(date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}/${date.year}`;
  return { isoDate, slashDate };
});

// Function to make an API request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
  });
}

// Test the highlighted stocks API
async function testHighlightedStocksAPI() {
  console.log('=== Testing Highlighted Stocks API ===');
  
  for (const date of formattedDates) {
    const url = `${API_BASE_URL}/stocks/highlighted/filter?startDate=${date.isoDate}&endDate=${date.isoDate}`;
    console.log(`Testing URL: ${url}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`Status: ${response.status}`);
      console.log(`Found ${Array.isArray(response.data) ? response.data.length : 0} stocks for ${date.isoDate}`);
      
      // Log a sample of the data if available
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('Sample stock:', {
          ticker: response.data[0].ticker,
          date: response.data[0].date || response.data[0].created_at,
          source: response.data[0].source
        });
      }
    } catch (error) {
      console.error(`Error testing highlighted stocks for ${date.isoDate}:`, error.message);
    }
    
    console.log('---');
  }
}

// Test the portfolio list API
async function testPortfolioListAPI() {
  console.log('\n=== Testing Portfolio List API ===');
  
  for (const date of formattedDates) {
    const url = `${API_BASE_URL}/stocks/filter-by-date-source?date=${encodeURIComponent(date.slashDate)}&source=manual`;
    console.log(`Testing URL: ${url}`);
    
    try {
      const response = await makeRequest(url);
      console.log(`Status: ${response.status}`);
      
      // Handle different response formats
      let stocks = [];
      if (response.data && response.data.stocks) {
        stocks = response.data.stocks;
      } else if (Array.isArray(response.data)) {
        stocks = response.data;
      }
      
      console.log(`Found ${stocks.length} stocks for ${date.slashDate}`);
      
      // Log a sample of the data if available
      if (stocks.length > 0) {
        console.log('Sample stock:', {
          ticker: stocks[0].ticker,
          date: stocks[0].date || stocks[0].created_at,
          source: stocks[0].source
        });
      }
    } catch (error) {
      console.error(`Error testing portfolio list for ${date.slashDate}:`, error.message);
    }
    
    console.log('---');
  }
}

// Run the tests
async function runTests() {
  console.log('Starting API tests for specific dates...');
  console.log('Testing dates:', formattedDates.map(d => `${d.isoDate} (${d.slashDate})`).join(', '));
  
  try {
    await testHighlightedStocksAPI();
    await testPortfolioListAPI();
    console.log('\nTests completed successfully!');
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Execute the tests
runTests();