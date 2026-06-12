import { render, screen, fireEvent } from '@testing-library/react';
import { EndConfirmModal } from '../../components/EndConfirmModal';

describe('EndConfirmModal', () => {
  const defaultProps = {
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders the "End interview?" heading', () => {
    render(<EndConfirmModal {...defaultProps} />);
    expect(screen.getByText('End interview?')).toBeInTheDocument();
  });

  it('renders the confirm button', () => {
    render(<EndConfirmModal {...defaultProps} />);
    expect(screen.getByText('End & get report')).toBeInTheDocument();
  });

  it('renders the cancel button', () => {
    render(<EndConfirmModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when "End & get report" is clicked', () => {
    render(<EndConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('End & get report'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when "Cancel" is clicked', () => {
    render(<EndConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('confirm click does not call onCancel', () => {
    render(<EndConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('End & get report'));
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('cancel click does not call onConfirm', () => {
    render(<EndConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });
});
