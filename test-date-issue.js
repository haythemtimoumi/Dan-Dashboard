// Test script to verify date formatting and timezone issues

console.log('=== Date Formatting Test ===');

// Test date: July 17, 2025
const testDate = new Date(2025, 6, 17); // Month is 0-indexed, so 6 = July
console.log('Original date object:', testDate);
console.log('toString():', testDate.toString());
console.log('toISOString():', testDate.toISOString());
console.log('toLocaleDateString():', testDate.toLocaleDateString());

// Test formatting functions
function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForPortfolioApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

console.log('\n=== Formatted Dates ===');
console.log('Highlighted API format (YYYY-MM-DD):', formatDateForApi(testDate));
console.log('Portfolio API format (MM/DD/YYYY):', formatDateForPortfolioApi(testDate));

// Test with different timezone scenarios
console.log('\n=== Timezone Test ===');
console.log('Current timezone offset (minutes):', testDate.getTimezoneOffset());
console.log('UTC date parts:', {
  year: testDate.getUTCFullYear(),
  month: testDate.getUTCMonth() + 1,
  day: testDate.getUTCDate()
});
console.log('Local date parts:', {
  year: testDate.getFullYear(),
  month: testDate.getMonth() + 1,
  day: testDate.getDate()
});

// Test date parsing from string
console.log('\n=== Date Parsing Test ===');
const dateString = '07/17/2025';
const parsedDate = new Date(dateString);
console.log('Parsed from "07/17/2025":', parsedDate);
console.log('Formatted back:', formatDateForPortfolioApi(parsedDate));

// Test with current date
console.log('\n=== Current Date Test ===');
const now = new Date();
console.log('Current date:', now);
console.log('Highlighted format:', formatDateForApi(now));
console.log('Portfolio format:', formatDateForPortfolioApi(now));