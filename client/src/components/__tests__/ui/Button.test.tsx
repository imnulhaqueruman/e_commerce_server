import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '../../ui/button';

describe('<Button />', () => {
  it('renders children', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when the disabled prop is set', () => {
    renderWithProviders(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
  });
});
