/**
 * @jest-environment node
 */

// Import the Next.js configuration
const nextConfig = require('../../next.config.js');

describe('Next.js Configuration', () => {
  it('should have www.stockscores.com in the allowed image remotePatterns', () => {
    // Check if the images configuration exists
    expect(nextConfig.images).toBeDefined();
    
    // Check if remotePatterns array exists
    expect(nextConfig.images.remotePatterns).toBeDefined();
    expect(Array.isArray(nextConfig.images.remotePatterns)).toBe(true);
    
    // Check if www.stockscores.com is in the remotePatterns array
    const stockscoresPattern = nextConfig.images.remotePatterns.find(
      pattern => pattern.hostname === 'www.stockscores.com'
    );
    expect(stockscoresPattern).toBeDefined();
    expect(stockscoresPattern.protocol).toBe('https');
    expect(stockscoresPattern.pathname).toBe('/**');
  });

  it('should have the required experimental configuration', () => {
    // Check if experimental configuration exists
    expect(nextConfig.experimental).toBeDefined();
    
    // Check if serverComponentsExternalPackages is configured
    expect(nextConfig.experimental.serverComponentsExternalPackages).toBeDefined();
    expect(Array.isArray(nextConfig.experimental.serverComponentsExternalPackages)).toBe(true);
    expect(nextConfig.experimental.serverComponentsExternalPackages).toContain('@vercel/postgres');
  });
});