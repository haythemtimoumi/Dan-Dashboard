import { render } from '@testing-library/react';
import { StocksExternalSkeleton } from '@/app/ui/stocks/stocks-external-skeleton';

describe('StocksExternalSkeleton', () => {
  it('renders correctly', () => {
    const { container } = render(<StocksExternalSkeleton />);
    
    // Check if the skeleton container is rendered
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    
    // Check if animation classes are applied
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    
    // Check if both mobile and desktop skeletons are rendered
    expect(container.querySelector('.md\\:hidden')).toBeInTheDocument();
    expect(container.querySelector('.hidden.md\\:block')).toBeInTheDocument();
  });
});