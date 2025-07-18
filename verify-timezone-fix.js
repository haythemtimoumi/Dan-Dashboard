// Simple Node.js script to verify the timezone fix works correctly
// This script tests the date handling in different timezones

// Set timezone to Eastern Time (Canada)
process.env.TZ = 'America/Toronto';

console.log('=== Timezone Fix Verification ===');
console.log('Current timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Current timezone offset:', new Date().getTimezoneOffset() / -60, 'hours from UTC');

// Test dates
const testDates = [
  new Date(2025, 6, 17), // July 17, 2025
  new Date(2025, 6, 18)  // July 18, 2025
];

// UTC noon approach for formatting dates
function formatDateISO(date) {
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0
  ));
  return utcDate.toISOString().split('T')[0];
}

function formatDateSlash(date) {
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0
  ));
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

console.log('\n=== Testing Date Formatting ===');
testDates.forEach(date => {
  console.log(`\nOriginal date: ${date.toString()}`);
  console.log(`Local date parts: ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
  console.log(`ISO format (UTC noon): ${formatDateISO(date)}`);
  console.log(`Slash format (UTC noon): ${formatDateSlash(date)}`);
});

console.log('\n=== API URL Generation ===');
testDates.forEach(date => {
  const isoDate = formatDateISO(date);
  const slashDate = formatDateSlash(date);
  
  console.log(`\nFor date: ${date.toDateString()}`);
  console.log(`Highlighted API URL: /api/stocks/highlighted/filter?startDate=${isoDate}&endDate=${isoDate}`);
  console.log(`Portfolio API URL: /api/stocks/filter-by-date-source?date=${encodeURIComponent(slashDate)}&source=manual`);
});

console.log('\n=== Verification Complete ===');
console.log('If the dates are formatted correctly, the timezone fix is working properly.');
console.log('The API URLs should use the correct date format regardless of timezone.');