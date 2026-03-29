import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClipboardFallbackModal } from './ClipboardFallbackModal';

const sampleText = `🏸 Cầu lông - 28/03/2026
Sân Tân Bình
💰 Tổng: 300.000đ (Sân: 300.000đ)
👥 2 người chơi

💸 Kết quả:
- Nam → Bách: 127.000đ`;

describe('ClipboardFallbackModal', () => {
  it('should not render when text is null', () => {
    const { container } = render(
      <ClipboardFallbackModal text={null} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render the modal with settlement text when text is provided', () => {
    render(<ClipboardFallbackModal text={sampleText} onClose={vi.fn()} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(sampleText);
  });

  it('should render the textarea as read-only', () => {
    render(<ClipboardFallbackModal text={sampleText} onClose={vi.fn()} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readOnly');
  });

  it('should call onClose when the Close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ClipboardFallbackModal text={sampleText} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ClipboardFallbackModal text={sampleText} onClose={onClose} />);

    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
