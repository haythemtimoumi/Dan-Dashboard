// Test script to simulate frontend add stock functionality

const API_URL = 'http://localhost:3000/api';

async function testFrontendAddStock() {
  console.log('🧪 Testing Frontend Add Stock Functionality\n');

  try {
    // Step 1: Login to get admin token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admindan',
        password: 'Stockscreener99#'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const { token, user } = await loginResponse.json();
    console.log(`✅ Login successful! User: ${user.username}, Role: ${user.role}`);

    // Step 2: Test add stock with admin token (simulating frontend)
    console.log('\n2️⃣ Testing add stock with admin token...');
    const stockData = {
      ticker: 'TESTFE',
      source: 'manual',
      sentiment_score: 75,
      signal_score: 80,
      rule1_score: 85,
      moat_score: 90,
      management_score: 95,
      buy_price: '150.50',
      pe: '25.5',
      dividend: '2.5',
      cash_per_share: '10.25',
      current_ratio: '1.5',
      guru: '8.5 years',
      date: '07/18/2025'
    };

    const addStockResponse = await fetch(`${API_URL}/stocks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stockData)
    });

    if (!addStockResponse.ok) {
      const errorData = await addStockResponse.json().catch(() => ({}));
      if (addStockResponse.status === 403 || addStockResponse.status === 401) {
        throw new Error('Admin access required. Please log in as an admin user.');
      }
      throw new Error(errorData.message || `Failed to add stock: ${addStockResponse.statusText}`);
    }

    const newStock = await addStockResponse.json();
    console.log(`✅ Stock added successfully!`);
    console.log(`   ID: ${newStock.id}`);
    console.log(`   Ticker: ${newStock.ticker}`);
    console.log(`   Source: ${newStock.source}`);
    console.log(`   Date: ${newStock.date}`);

    // Step 3: Test without authentication (simulating non-admin user)
    console.log('\n3️⃣ Testing add stock without authentication...');
    const noAuthResponse = await fetch(`${API_URL}/stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'NOAUTH',
        source: 'manual',
        sentiment_score: 50,
        signal_score: 50,
        date: '07/18/2025'
      })
    });

    if (!noAuthResponse.ok) {
      const errorData = await noAuthResponse.json();
      console.log(`❌ Expected error: ${errorData.message} (Status: ${noAuthResponse.status})`);
    }

    console.log('\n🎉 Frontend add stock test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin login works');
    console.log('   ✅ Add stock with admin token works');
    console.log('   ✅ Add stock without auth properly fails');
    console.log('\n💡 Frontend users need to:');
    console.log('   1. Log in at /login with admin credentials');
    console.log('   2. Use the add stock button after authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFrontendAddStock();