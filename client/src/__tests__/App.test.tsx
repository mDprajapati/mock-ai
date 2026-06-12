import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import type { EvaluationReport } from '../types';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: () => <div data-testid="sandpack-mock" />,
}));

vi.mock('@codesandbox/sandpack-themes', () => ({
  sandpackDark: {},
}));

const mockReport: EvaluationReport = {
  overall: 7.5,
  summary: 'Good candidate.',
  phase1: { score: 7, feedback: 'OK', strengths: ['A'], improvements: ['B'] },
  phase2: { score: 8, feedback: 'Good', strengths: ['C'], improvements: ['D'] },
  phase3: { score: 7, feedback: 'Fine', strengths: ['E'], improvements: ['F'] },
};

describe('App routing', () => {
  beforeEach(() => {
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ stop: vi.fn(), enabled: true }],
    });
  });

  it('renders Landing at "/"', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText('Coding / Technical')).toBeInTheDocument(),
    );
  });

  it('renders Intake at "/intake"', () => {
    render(
      <MemoryRouter initialEntries={['/intake']}>
        <App />
      </MemoryRouter>,
    );
    // Use heading role to avoid matching the step indicator span
    expect(screen.getByRole('heading', { name: 'Job Description' })).toBeInTheDocument();
  });

  it('renders DeviceCheck at "/device-check" (no session → redirects to intake)', () => {
    render(
      <MemoryRouter initialEntries={['/device-check']}>
        <App />
      </MemoryRouter>,
    );
    // No session → useEffect navigates to /intake
    // The page initially renders, then redirects; either way intake ends up visible
    expect(
      screen.queryByText('Ready to join?') ||
      screen.queryByRole('heading', { name: 'Job Description' }),
    ).not.toBeNull();
  });

  it('renders Interview at "/interview" (no session → returns null)', () => {
    render(
      <MemoryRouter initialEntries={['/interview']}>
        <App />
      </MemoryRouter>,
    );
    // Interview returns null when no session
    // Nothing Interview-specific should appear (Phase 1 badge etc.)
    // The container may have nothing or may redirect, but Phase 1 shouldn't be present
    expect(screen.queryByText('Introduction & Career')).toBeNull();
  });

  it('renders Report at "/report" with location state', () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/report', state: { report: mockReport } }]}
      >
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText('7.5')).toBeInTheDocument();
  });

  it('redirects unknown path to Landing', async () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText('Coding / Technical')).toBeInTheDocument(),
    );
  });

  it('SessionContext is available at /intake route (no throw)', () => {
    // Intake uses useSession — if SessionProvider is missing it throws
    expect(() =>
      render(
        <MemoryRouter initialEntries={['/intake']}>
          <App />
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });
});
