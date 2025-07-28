// Debug script to see exact error from add stock API

const API_URL = 'https://www.mytickerlist.com/api';

async function debugAddStock() {
  try {
    // Login first
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admindan',
        password: 'Stockscreener99#'
      })
    });

    const { token } = await loginResponse.json();
    console.log('Token obtained:', token.substring(0, 50) + '...');

    // Try add stock with detailed error logging
    const stockData = {
      ticker: 'DEBUG',
      source: 'manual',
      sentiment_score: 50,
      signal_score: 50,
      date: '07/18/2025'
    };

    console.log('Sending stock data:', JSON.stringify(stockData, null, 2));

    const response = await fetch(`${API_URL}/stocks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stockData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('✅ Success!');
    } else {
      console.log('❌ Failed');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugAddStock();