const { execSync } = require('child_process');

try {
  console.log('Running TypeScript type check...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('Type check passed!');
} catch (error) {
  console.error('Type check failed:', error.message);
  process.exit(1);
}