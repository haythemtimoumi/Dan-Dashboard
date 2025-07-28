// Debug what the frontend is actually sending
const API_URL = 'https://www.mytickerlist.com/api';

async function debugFrontendRequest() {
  console.log('🔍 Debugging Frontend Request Data\n');

  // Get admin token
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admindan',
      password: 'Stockscreener99#'
    })
  });
  const { token } = await loginResponse.json();

  // Test different data formats that frontend might send
  const testCases = [
    {
      name: 'Minimal Required Fields',
      data: {
        ticker: 'TSLA',
        source: 'manual',
        sentiment_score: 75,
        signal_score: 80,
        date: '07/18/2025'
      }
    },
    {
      name: 'All Fields (like frontend form)',
      data: {
        ticker: 'NVDA',
        source: 'manual',
        sentiment_score: 85,
        signal_score: 90,
        rule1_score: 95,
        moat_score: 88,
        management_score: 92,
        buy_price: '125.75',
        pe: '18.5',
        dividend: '3.2',
        cash_per_share: '15.50',
        current_ratio: '2.1',
        guru: '7.5 years',
        date: '07/18/2025'
      }
    },
    {
      name: 'Empty Optional Fields',
      data: {
        ticker: 'META',
        source: 'manual',
        sentiment_score: 70,
        signal_score: 75,
        rule1_score: null,
        moat_score: null,
        management_score: null,
        buy_price: '',
        pe: '',
        dividend: '',
        cash_per_share: '',
        current_ratio: '',
        guru: '',
        date: '07/18/2025'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📤 Testing: ${testCase.name}`);
    console.log('Data:', JSON.stringify(testCase.data, null, 2));

    try {
      const response = await fetch(`${API_URL}/stocks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });

      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success - ID: ${result.id}`);
      } else {
        const error = await response.text();
        console.log(`❌ Failed - Error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }

  // Test what happens with no auth token
  console.log('\n🔒 Testing without auth token...');
  const noAuthResponse = await fetch(`${API_URL}/stocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticker: 'AAPL',
      source: 'manual',
      sentiment_score: 50,
      signal_score: 50,
      date: '07/18/2025'
    })
  });
  
  console.log(`No Auth Status: ${noAuthResponse.status}`);
  if (!noAuthResponse.ok) {
    const error = await noAuthResponse.json();
    console.log(`No Auth Error: ${error.message}`);
  }
}

debugFrontendRequest();