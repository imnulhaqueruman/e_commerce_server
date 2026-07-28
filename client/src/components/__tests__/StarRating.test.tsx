import { describe, it, expect, vi } from 'vitest';
import {
  renderWithProviders,
  screen,
  userEvent,
} from '@/test/test-utils';
import { StarRating } from '../StarRating';

describe('<StarRating />', () => {
  it('renders 5 buttons regardless of value', () => {
    renderWithProviders(<StarRating value={3} readOnly />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('uses 1-star and 5-star aria labels', () => {
    renderWithProviders(<StarRating value={0} readOnly />);
    expect(screen.getByLabelText('1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('5 stars')).toBeInTheDocument();
  });

  it('forwards a click to onChange when not readOnly', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<StarRating value={0} onChange={onChange} />);
    await user.click(screen.getByLabelText('4 stars'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange when readOnly', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<StarRating value={2} readOnly onChange={onChange} />);
    await user.click(screen.getByLabelText('5 stars'));
    expect(onChange).not.toHaveBeenCalled();
  });
});