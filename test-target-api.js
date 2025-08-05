const fetch = require('node-fetch');

async function testTargetAPI() {
  try {
    // Get current date for testing
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Testing Target API...');
    console.log('Date:', today);
    
    const response = await fetch(`http://localhost:3001/api/stocks/target?startDate=${today}&endDate=${today}`);
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n=== API Response ===');
    console.log('Total records:', data.length);
    
    if (data.length > 0) {
      console.log('\n=== Sample Records ===');
      data.slice(0, 3).forEach((stock, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        console.log('Ticker:', stock.ticker);
        console.log('Target:', stock.target);
        console.log('Sentiment Score:', stock.sentiment_score);
        console.log('Rule1 Score:', stock.rule1_score);
        console.log('Moat Score:', stock.moat_score);
        console.log('Management Score:', stock.management_score);
        console.log('Buy Price:', stock.buy_price);
        console.log('Last Price:', stock.last_price);
        console.log('Per Upside:', stock.per_upside);
        console.log('Guru:', stock.guru);
        console.log('Source:', stock.source);
        console.log('Created At:', stock.created_at);
      });
      
      // Check for AMZN specifically
      const amzn = data.find(stock => stock.ticker === 'AMZN');
      if (amzn) {
        console.log('\n=== AMZN Data ===');
        console.log(JSON.stringify(amzn, null, 2));
      } else {
        console.log('\n=== AMZN not found in results ===');
      }
      
      // Check for stocks with 0 values
      const zeroStocks = data.filter(stock => 
        stock.sentiment_score == 0 && 
        stock.rule1_score == 0 && 
        stock.moat_score == 0 && 
        stock.management_score == 0
      );
      
      console.log('\n=== Stocks with all zero scores ===');
      console.log('Count:', zeroStocks.length);
      if (zeroStocks.length > 0) {
        zeroStocks.slice(0, 5).forEach(stock => {
          console.log(`${stock.ticker}: sentiment=${stock.sentiment_score}, rule1=${stock.rule1_score}, moat=${stock.moat_score}, mgmt=${stock.management_score}`);
        });
      }
    } else {
      console.log('No target stocks found');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTargetAPI();