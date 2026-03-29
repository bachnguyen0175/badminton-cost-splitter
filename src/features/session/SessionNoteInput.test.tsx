import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SessionNoteInput } from './SessionNoteInput';

describe('SessionNoteInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  describe('Req 4.1 — Optional free-text input field', () => {
    it('renders a text input field', () => {
      render(<SessionNoteInput {...defaultProps} />);
      expect(screen.getByPlaceholderText(/note|location|occasion/i)).toBeInTheDocument();
    });

    it('displays the current value', () => {
      render(<SessionNoteInput {...defaultProps} value="Sân Tân Bình" />);
      expect(screen.getByDisplayValue('Sân Tân Bình')).toBeInTheDocument();
    });

    it('renders with an appropriate label', () => {
      render(<SessionNoteInput {...defaultProps} />);
      expect(screen.getByText(/note/i)).toBeInTheDocument();
    });
  });

  describe('Req 4.2 — Persist note value in session form state', () => {
    it('calls onChange when the user types in the input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SessionNoteInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByPlaceholderText(/note|location|occasion/i);
      await user.type(input, 'A');
      expect(onChange).toHaveBeenCalledWith('A');
    });

    it('calls onChange with the full input value on each keystroke', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SessionNoteInput {...defaultProps} value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText(/note|location|occasion/i);
      await user.type(input, 'Hi');
      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });
});
