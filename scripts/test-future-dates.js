// Simple script to test the API with future dates
const fetch = require('node-fetch');

async function testFutureDates() {
  try {
    console.log('Testing API with future dates (06/06/2025 to 07/06/2025)...');
    
    // Test with the specific date range from the request
    const response = await fetch('http://localhost:3000/api/stocks/date-range?startDate=06/06/2025&endDate=07/06/2025');
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`Found ${data.length} stocks in the date range:`);
    
    if (data.length === 0) {
      console.log('No stocks found for the selected date range.');
    } else {
      data.forEach(stock => {
        console.log(`- ${stock.ticker} (${stock.created_at})`);
      });
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFutureDates();