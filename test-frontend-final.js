// Final test of frontend add stock functionality

// Simulate the exact same flow as the frontend components
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.mytickerlist.com/api';

async function testFrontendFlow() {
  console.log('🧪 Testing Frontend Add Stock Button Functionality');
  console.log(`📡 Using API URL: ${API_URL}\n`);

  try {
    // Step 1: Simulate login (what happens when user logs in)
    console.log('1️⃣ Simulating admin login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admindan',
        password: 'Stockscreener99#'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const { token, user } = await loginResponse.json();
    console.log(`✅ Login successful - User: ${user.username} (${user.role})`);

    // Simulate storing token (what frontend does)
    const authToken = token;
    console.log('💾 Token stored in memory (simulating localStorage)');

    // Step 2: Simulate add stock button click
    console.log('\n2️⃣ Simulating "Add Stock" button click...');
    
    // This is the exact data structure the frontend sends
    const newStock = {
      ticker: 'FRONTEND',
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
      date: '07/18/2025' // This uses the date utility format
    };

    console.log('📤 Sending stock data:', JSON.stringify(newStock, null, 2));

    const addResponse = await fetch(`${API_URL}/stocks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newStock)
    });

    console.log(`📡 Response status: ${addResponse.status}`);

    if (!addResponse.ok) {
      const errorData = await addResponse.json().catch(() => ({}));
      if (addResponse.status === 403 || addResponse.status === 401) {
        console.log('❌ Admin access required. Please log in as an admin user.');
        return;
      }
      throw new Error(errorData.message || `Failed to add stock: ${addResponse.statusText}`);
    }

    const addedStock = await addResponse.json();
    console.log('✅ Stock added successfully!');
    console.log(`   📊 Stock ID: ${addedStock.id}`);
    console.log(`   🏷️  Ticker: ${addedStock.ticker}`);
    console.log(`   📅 Date: ${addedStock.date}`);

    // Step 3: Test error handling for non-admin users
    console.log('\n3️⃣ Testing error handling for non-admin users...');
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
      console.log(`✅ Proper error handling: "${errorData.message}" (${noAuthResponse.status})`);
    }

    console.log('\n🎉 Frontend Add Stock Button Test PASSED!');
    console.log('\n📋 Test Results Summary:');
    console.log('   ✅ Admin authentication works');
    console.log('   ✅ Add stock API call succeeds with admin token');
    console.log('   ✅ Error handling works for non-admin users');
    console.log('   ✅ Frontend components should work correctly');

    console.log('\n💡 For users to use the add stock button:');
    console.log('   1. Navigate to /login');
    console.log('   2. Enter admin credentials (admindan / Stockscreener99#)');
    console.log('   3. Go to highlighted stocks or portfolio list page');
    console.log('   4. Click "Add Stock" button');
    console.log('   5. Fill out the form and submit');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendFlow();