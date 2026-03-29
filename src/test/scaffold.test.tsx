import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Project Scaffold', () => {
  it('renders the main screen at root route', () => {
    render(<App />);
    expect(screen.getByText('Badminton Cost Splitter')).toBeInTheDocument();
  });

  it('renders a link to history from main screen', () => {
    render(<App />);
    const historyLink = screen.getByRole('link', { name: /history/i });
    expect(historyLink).toBeInTheDocument();
    expect(historyLink).toHaveAttribute('href', '/history');
  });

  it('uses Tailwind CSS classes on main screen', () => {
    render(<App />);
    const heading = screen.getByText('Badminton Cost Splitter');
    expect(heading.className).toContain('text-xl');
  });
});
