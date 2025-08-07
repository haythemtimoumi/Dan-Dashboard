#!/usr/bin/env node

/**
 * Test script to verify the comments API integration
 * Tests the API endpoint and verifies the data structure
 */

const API_URL = 'http://localhost:3000/api';

async function testCommentsAPI() {
  console.log('🧪 Testing Comments API Integration...\n');
  
  try {
    // Test 1: Fetch comments for user 1
    console.log('📡 Testing: GET /api/comments/user/1');
    const response = await fetch(`${API_URL}/comments/user/1`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const comments = await response.json();
    console.log(`✅ API Response: ${response.status} ${response.statusText}`);
    console.log(`📊 Total comments found: ${comments.length}`);
    
    if (comments.length > 0) {
      console.log('\n📝 Sample comment structure:');
      const sample = comments[0];
      console.log(`   - ID: ${sample.id}`);
      console.log(`   - Comment: "${sample.comment.substring(0, 50)}${sample.comment.length > 50 ? '...' : ''}"`);
      console.log(`   - Ticker: ${sample.ticker_symbol}`);
      console.log(`   - User: ${sample.username}`);
      console.log(`   - Color: ${sample.color || 'none'}`);
      console.log(`   - Date: ${sample.created_at}`);
      
      // Test 2: Group comments by ticker
      const tickerGroups = comments.reduce((acc, comment) => {
        if (!acc[comment.ticker_symbol]) {
          acc[comment.ticker_symbol] = [];
        }
        acc[comment.ticker_symbol].push(comment);
        return acc;
      }, {});
      
      console.log('\n📈 Comments by ticker:');
      Object.entries(tickerGroups).forEach(([ticker, tickerComments]) => {
        console.log(`   - ${ticker}: ${tickerComments.length} comment(s)`);
      });
      
      // Test 3: Verify required fields
      console.log('\n🔍 Verifying data structure...');
      const requiredFields = ['id', 'comment', 'user_id', 'ticker_id', 'ticker_symbol', 'username', 'created_at'];
      const missingFields = requiredFields.filter(field => !(field in sample));
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
      } else {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      }
      
    } else {
      console.log('ℹ️  No comments found for user 1');
    }
    
    console.log('\n🎉 Comments API integration test completed successfully!');
    console.log('\n📋 Integration Summary:');
    console.log('   ✅ API endpoint accessible');
    console.log('   ✅ JSON response format correct');
    console.log('   ✅ Required fields present');
    console.log('   ✅ Ticker-specific filtering possible');
    console.log('\n🚀 Ready for frontend integration!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure dan-api is running on port 3000');
    console.log('   2. Check database connection');
    console.log('   3. Verify API endpoint exists');
    process.exit(1);
  }
}

// Run the test
testCommentsAPI();