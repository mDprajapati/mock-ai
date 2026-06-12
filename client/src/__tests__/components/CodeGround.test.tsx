import { render, screen, fireEvent } from '@testing-library/react';
import { CodeGround } from '../../components/CodeGround';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: () => <div data-testid="sandpack-mock" />,
}));

vi.mock('@codesandbox/sandpack-themes', () => ({
  sandpackDark: {},
}));

describe('CodeGround', () => {
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders the sandpack editor', () => {
    render(<CodeGround challenge="Build a counter" onClose={onClose} />);
    expect(screen.getByTestId('sandpack-mock')).toBeInTheDocument();
  });

  it('displays the challenge text', () => {
    render(<CodeGround challenge="Build a counter component" onClose={onClose} />);
    expect(screen.getByText('Build a counter component')).toBeInTheDocument();
  });

  it('calls onClose when "Back to Interview" is clicked', () => {
    render(<CodeGround challenge="test" onClose={onClose} />);
    fireEvent.click(screen.getByText('Back to Interview'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders "React Coding Environment" label', () => {
    render(<CodeGround challenge="test" onClose={onClose} />);
    expect(screen.getByText('React Coding Environment')).toBeInTheDocument();
  });

  it('renders "Challenge" section label', () => {
    render(<CodeGround challenge="test" onClose={onClose} />);
    expect(screen.getByText('Challenge')).toBeInTheDocument();
  });
});
