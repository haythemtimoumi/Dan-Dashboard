// Test script to verify the date handling fix

// Function to format date in YYYY-MM-DD format using local date parts
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to format date in MM/DD/YYYY format using local date parts
function formatDateForPortfolio(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

// Test with a specific date: July 17, 2023
const testDate = new Date(2023, 6, 17); // Month is 0-indexed, so 6 = July

console.log('=== Date Handling Test ===');
console.log('Test date:', testDate);
console.log('Local date string:', testDate.toString());
console.log('UTC date string:', testDate.toUTCString());
console.log('ISO date string:', testDate.toISOString());

console.log('\n=== Formatted Dates ===');
console.log('Using toISOString().split("T")[0]:', testDate.toISOString().split('T')[0]);
console.log('Using local date parts (YYYY-MM-DD):', formatDateLocal(testDate));
console.log('Using local date parts (MM/DD/YYYY):', formatDateForPortfolio(testDate));

console.log('\n=== Date Comparison ===');
// Create two dates with the same year, month, day but in different timezones
const date1 = new Date(2023, 6, 17);
const date2 = new Date(Date.UTC(2023, 6, 17));

console.log('Date 1 (local):', date1.toString());
console.log('Date 2 (UTC):', date2.toString());
console.log('Date 1 ISO:', date1.toISOString());
console.log('Date 2 ISO:', date2.toISOString());

// Compare using toISOString()
console.log('\nComparing with toISOString():');
console.log('date1.toISOString() === date2.toISOString():', date1.toISOString() === date2.toISOString());

// Compare using local date parts
console.log('\nComparing with local date parts:');
console.log('formatDateLocal(date1) === formatDateLocal(date2):', formatDateLocal(date1) === formatDateLocal(date2));

// This demonstrates why using toISOString() for date comparison can cause issues with timezones