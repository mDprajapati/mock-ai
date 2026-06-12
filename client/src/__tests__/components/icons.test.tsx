import { render, screen } from '@testing-library/react';
import { CodeIcon, SalesIcon, MarketingIcon, ArrowRight, LockIcon } from '../../components/icons';

describe('Icon components', () => {
  it('CodeIcon renders an svg element', () => {
    const { container } = render(<CodeIcon />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('SalesIcon renders an svg element', () => {
    const { container } = render(<SalesIcon />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('MarketingIcon renders an svg element', () => {
    const { container } = render(<MarketingIcon />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('ArrowRight renders an svg element', () => {
    const { container } = render(<ArrowRight />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('LockIcon renders an svg element', () => {
    const { container } = render(<LockIcon />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('icons have aria-hidden="true"', () => {
    const { container } = render(<CodeIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('icons do not render visible text', () => {
    render(<LockIcon />);
    // LockIcon should have no user-visible text
    expect(screen.queryByRole('img')).toBeNull();
  });
});
