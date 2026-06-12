import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithProviders } from '../../test/helpers/renderWithProviders';
import Interview from '../../pages/Interview';
import type { SessionData } from '../../types';

vi.mock('@codesandbox/sandpack-react', () => ({
  Sandpack: () => <div data-testid="sandpack-mock" />,
}));

vi.mock('@codesandbox/sandpack-themes', () => ({
  sandpackDark: {},
}));

// Mock useCamera — avoids getUserMedia side-effects per test
vi.mock('../../hooks/useCamera', () => ({
  useCamera: () => ({ permission: 'granted', error: '', stream: null, stop: vi.fn() }),
}));

// Mock useInterviewPhase — avoids a real setInterval running in every test
const mockStartAdvanceCountdown = vi.fn();
vi.mock('../../hooks/useInterviewPhase', () => ({
  useInterviewPhase: () => ({
    timeLeft: 600,
    setTimeLeft: vi.fn(),
    showAdvanceModal: false,
    setShowAdvanceModal: vi.fn(),
    advanceCountdown: 8,
    pendingNextPhaseRef: { current: null },
    advanceCountdownRef: { current: null },
    startAdvanceCountdown: mockStartAdvanceCountdown,
    resetTimer: vi.fn(),
  }),
}));

// Mock axios for synchronous, deterministic responses
const mockAxiosPost = vi.fn();
const mockAxiosGet = vi.fn();
vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => mockAxiosPost(...args),
    get:  (...args: any[]) => mockAxiosGet(...args),
  },
}));

const mockSession: SessionData = {
  jdText: 'We are looking for a software engineer with React experience.',
  experience: '2-5',
  cvText: 'I have 3 years of React and TypeScript experience.',
  cvFileName: 'resume.pdf',
};

function renderInterview(session: SessionData | null = mockSession) {
  return renderWithProviders(<Interview />, { session, route: '/interview' });
}

/** Flush all pending microtasks and React state updates */
async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Fire the onend callback on the most recent utterance */
function triggerSpeakEnd() {
  const mockSpeak = window.speechSynthesis.speak as ReturnType<typeof vi.fn>;
  const calls = mockSpeak.mock.calls;
  if (calls.length > 0) {
    const utterance = calls[calls.length - 1][0];
    act(() => { utterance?.onend?.(); });
  }
}

describe('Interview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosPost.mockResolvedValue({
      data: { question: 'Tell me about yourself.', advancePhase: false },
    });
    mockAxiosGet.mockResolvedValue({
      data: {
        exercises: [{ title: 'FizzBuzz', description: 'Write FizzBuzz', starterCode: '// code' }],
      },
    });
  });

  // ── Static renders (no async needed) ─────────────────────────────────────

  it('renders null when no session is provided', () => {
    const { container } = renderInterview(null);
    expect(container.firstChild).toBeNull();
  });

  it('shows Phase 1 text in the header', () => {
    renderInterview();
    expect(screen.getAllByText(/Phase 1/).length).toBeGreaterThan(0);
  });

  it('shows Introduction & Career phase name', () => {
    renderInterview();
    expect(screen.getByText('Introduction & Career')).toBeInTheDocument();
  });

  it('shows timer from mocked hook (10:00)', () => {
    renderInterview();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders the End Early header button', () => {
    renderInterview();
    expect(screen.getByText('End Early')).toBeInTheDocument();
  });

  it('renders the End Interview control bar button', () => {
    renderInterview();
    expect(screen.getByText('End Interview')).toBeInTheDocument();
  });

  it('shows AI Interviewer label', () => {
    renderInterview();
    expect(screen.getByText('AI Interviewer')).toBeInTheDocument();
  });

  it('renders transcript panel header', () => {
    renderInterview();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
  });

  it('shows "Conversation will appear here…" initially', () => {
    renderInterview();
    expect(screen.getByText('Conversation will appear here…')).toBeInTheDocument();
  });

  it('shows loading state (Connecting…) on initial mount', () => {
    renderInterview();
    expect(screen.getByText(/Connecting to AI interviewer/)).toBeInTheDocument();
  });

  it('clicking End Interview shows EndConfirmModal', () => {
    renderInterview();
    fireEvent.click(screen.getByText('End Interview'));
    expect(screen.getByText('End interview?')).toBeInTheDocument();
  });

  it('clicking Cancel in EndConfirmModal closes it', () => {
    renderInterview();
    fireEvent.click(screen.getByText('End Interview'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('End interview?')).not.toBeInTheDocument();
  });

  it('clicking End Early shows EndConfirmModal', () => {
    renderInterview();
    fireEvent.click(screen.getByText('End Early'));
    expect(screen.getByText('End interview?')).toBeInTheDocument();
  });

  it('camera toggle button is present', () => {
    renderInterview();
    expect(screen.getByTitle(/Turn off camera|Turn on camera/)).toBeInTheDocument();
  });

  it('toggle camera button fires without error', () => {
    renderInterview();
    expect(() =>
      fireEvent.click(screen.getByTitle(/Turn off camera|Turn on camera/)),
    ).not.toThrow();
  });

  it('renders "You" PiP label', () => {
    renderInterview();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  // ── Async renders (flush microtasks + React state) ─────────────────────────

  it('shows question text after API call resolves', async () => {
    renderInterview();
    await flushAsync();
    // Text appears in both the AI tile and the transcript entry
    expect(screen.getAllByText('Tell me about yourself.').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Speaking…" status while AI is speaking', async () => {
    renderInterview();
    await flushAsync();
    expect(screen.getByText(/Speaking…/)).toBeInTheDocument();
  });

  it('shows AI question in transcript after load', async () => {
    renderInterview();
    await flushAsync();
    expect(screen.getAllByText('Tell me about yourself.').length).toBeGreaterThanOrEqual(1);
  });

  it('shows mic button after speak callback fires', async () => {
    renderInterview();
    await flushAsync();
    triggerSpeakEnd();
    await flushAsync();
    // Two mic buttons appear (AI panel + control bar), both titled "Stop listening"
    expect(screen.getAllByTitle(/Stop|Speak/).length).toBeGreaterThan(0);
  });

  it('shows retry button when API call fails', async () => {
    mockAxiosPost.mockRejectedValue({
      response: { data: { error: 'Server error' }, status: 500 },
    });
    renderInterview();
    await flushAsync();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    mockAxiosPost.mockRejectedValue({
      response: { data: { error: 'Check your API key.' }, status: 500 },
    });
    renderInterview();
    await flushAsync();
    expect(screen.getByText('Check your API key.')).toBeInTheDocument();
  });

  it('calls startAdvanceCountdown when advancePhase is true', async () => {
    mockAxiosPost.mockResolvedValue({
      data: { question: 'Great intro!', advancePhase: true },
    });
    renderInterview();
    await flushAsync();
    triggerSpeakEnd();
    expect(mockStartAdvanceCountdown).toHaveBeenCalledWith(2);
  });

  it('mockAxiosPost is called with phase 1 interview message payload', async () => {
    renderInterview();
    await flushAsync();
    expect(mockAxiosPost).toHaveBeenCalledWith(
      '/api/interview/message',
      expect.objectContaining({ phase: 1 }),
    );
  });
});
