// Test script to verify the specific issue with July 17 data showing as July 16 in Canada
// Run with: NODE_TZ='America/Toronto' node test-canada-july17-issue.js

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

// Format dates for API calls
const highlightedApiDate = dateUtils.formatDateForHighlightedAPI(testDate);
const portfolioApiDate = dateUtils.formatDateForPortfolioAPI(testDate);

console.log('\n=== Formatted Dates for API Calls ===');
console.log('Highlighted API format:', highlightedApiDate);
console.log('Portfolio API format:', portfolioApiDate);

// Simulate the issue by creating a date without the UTC noon approach
const problematicDate = new Date(testDate);
const problematicHighlightedDate = problematicDate.toISOString().split('T')[0];
const month = String(problematicDate.getMonth() + 1).padStart(2, '0');
const day = String(problematicDate.getDate()).padStart(2, '0');
const year = problematicDate.getFullYear();
const problematicPortfolioDate = `${month}/${day}/${year}`;

console.log('\n=== Problematic Date Formatting (without UTC noon) ===');
console.log('Problematic highlighted format:', problematicHighlightedDate);
console.log('Problematic portfolio format:', problematicPortfolioDate);

// Compare with the fixed approach
console.log('\n=== Comparison ===');
console.log('Fixed highlighted format matches expected?', highlightedApiDate === '2025-07-17');
console.log('Fixed portfolio format matches expected?', portfolioApiDate === '07/17/2025');

// Test with a direct UTC date creation to simulate the issue
console.log('\n=== Testing with Direct UTC Conversion ===');
const utcDate = new Date(Date.UTC(
  testDate.getFullYear(),
  testDate.getMonth(),
  testDate.getDate()
));
console.log('UTC date without noon adjustment:', utcDate);
console.log('UTC date ISO string:', utcDate.toISOString());
console.log('UTC date formatted for API:', utcDate.toISOString().split('T')[0]);

// Show the fix
console.log('\n=== The Fix (UTC noon approach) ===');
const fixedUtcDate = new Date(Date.UTC(
  testDate.getFullYear(),
  testDate.getMonth(),
  testDate.getDate(),
  12, 0, 0
));
console.log('UTC date with noon adjustment:', fixedUtcDate);
console.log('Fixed UTC date ISO string:', fixedUtcDate.toISOString());
console.log('Fixed UTC date formatted for API:', fixedUtcDate.toISOString().split('T')[0]);

console.log('\n=== Conclusion ===');
console.log('The issue occurs when converting dates without accounting for timezone differences.');
console.log('The fix uses UTC noon (12:00) to ensure the date remains the same regardless of timezone.');
console.log('This prevents the date from shifting to the previous day in timezones west of UTC.');