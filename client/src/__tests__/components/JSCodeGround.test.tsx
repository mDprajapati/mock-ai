import { render, screen, fireEvent } from '@testing-library/react';
import { JSCodeGround } from '../../components/JSCodeGround';
import type { JSExercise } from '../../types';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: () => <div data-testid="sandpack-mock" />,
}));

vi.mock('@codesandbox/sandpack-themes', () => ({
  sandpackDark: {},
}));

const exercises: JSExercise[] = [
  { title: 'Task 1', description: 'Write FizzBuzz', starterCode: '// task 1' },
  { title: 'Task 2', description: 'Swap variables', starterCode: '// task 2' },
  { title: 'Task 3', description: 'Reverse a string', starterCode: '// task 3' },
];

describe('JSCodeGround', () => {
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('returns null when exercises array is empty', () => {
    const { container } = render(<JSCodeGround exercises={[]} activeIndex={0} onClose={onClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all task titles in the task list', () => {
    render(<JSCodeGround exercises={exercises} activeIndex={0} onClose={onClose} />);
    expect(screen.getAllByText('Task 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('shows correct "Task X of N" count in header', () => {
    render(<JSCodeGround exercises={exercises} activeIndex={1} onClose={onClose} />);
    expect(screen.getByText('Task 2 of 3')).toBeInTheDocument();
  });

  it('renders the sandpack editor', () => {
    render(<JSCodeGround exercises={exercises} activeIndex={0} onClose={onClose} />);
    expect(screen.getByTestId('sandpack-mock')).toBeInTheDocument();
  });

  it('calls onClose when "Back to Interview" is clicked', () => {
    render(<JSCodeGround exercises={exercises} activeIndex={0} onClose={onClose} />);
    fireEvent.click(screen.getByText('Back to Interview'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clamps activeIndex beyond bounds to last exercise', () => {
    render(<JSCodeGround exercises={exercises} activeIndex={99} onClose={onClose} />);
    expect(screen.getByText('Task 3 of 3')).toBeInTheDocument();
  });

  it('shows current task description', () => {
    render(<JSCodeGround exercises={exercises} activeIndex={0} onClose={onClose} />);
    expect(screen.getByText('Write FizzBuzz')).toBeInTheDocument();
  });
});
