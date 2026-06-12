import { render, screen, fireEvent } from '@testing-library/react';
import { PhaseAdvanceModal } from '../../components/PhaseAdvanceModal';

describe('PhaseAdvanceModal', () => {
  const defaultProps = {
    currentPhase: 1 as const,
    nextPhase: 2 as const,
    countdown: 5,
    onContinue: vi.fn(),
    onStay: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows current phase number', () => {
    render(<PhaseAdvanceModal {...defaultProps} />);
    expect(screen.getByText(/Phase 1 Complete!/i)).toBeInTheDocument();
  });

  it('shows next phase name', () => {
    render(<PhaseAdvanceModal {...defaultProps} />);
    expect(screen.getByText(/JS Coding Round/i)).toBeInTheDocument();
  });

  it('shows countdown value', () => {
    render(<PhaseAdvanceModal {...defaultProps} countdown={8} />);
    expect(screen.getByText('8s')).toBeInTheDocument();
  });

  it('calls onContinue when "Continue Now" is clicked', () => {
    render(<PhaseAdvanceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Continue Now'));
    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onStay when stay button is clicked', () => {
    render(<PhaseAdvanceModal {...defaultProps} />);
    fireEvent.click(screen.getByText(/Stay in Phase 1/i));
    expect(defaultProps.onStay).toHaveBeenCalledTimes(1);
  });

  it('onContinue does not call onStay', () => {
    render(<PhaseAdvanceModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Continue Now'));
    expect(defaultProps.onStay).not.toHaveBeenCalled();
  });

  it('onStay does not call onContinue', () => {
    render(<PhaseAdvanceModal {...defaultProps} />);
    fireEvent.click(screen.getByText(/Stay in Phase 1/i));
    expect(defaultProps.onContinue).not.toHaveBeenCalled();
  });

  it('renders both action buttons', () => {
    render(<PhaseAdvanceModal {...defaultProps} />);
    expect(screen.getByText('Continue Now')).toBeInTheDocument();
    expect(screen.getByText(/Stay in Phase/)).toBeInTheDocument();
  });
});
