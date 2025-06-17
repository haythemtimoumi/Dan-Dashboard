import { formatDate } from '../utils';

describe('formatDate', () => {
  it('should format a valid date string correctly', () => {
    expect(formatDate('2023-01-15')).toBe('01/15/2023');
  });

  it('should return an empty string for undefined input', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('should return an empty string for empty input', () => {
    expect(formatDate('')).toBe('');
  });
});