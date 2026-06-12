import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Report from '../../pages/Report';
import type { EvaluationReport } from '../../types';
import { PHASE_NAMES } from '../../types';

const mockReport: EvaluationReport = {
  overall: 8.2,
  summary: 'Strong performance across all phases.',
  phase1: {
    score: 9,
    feedback: 'Excellent introduction.',
    strengths: ['Clear communication', 'Good examples'],
    improvements: ['More depth on tech stack'],
  },
  phase2: {
    score: 7,
    feedback: 'Solid coding skills.',
    strengths: ['Clean code'],
    improvements: ['Edge case handling'],
  },
  phase3: {
    score: 8,
    feedback: 'Good practical approach.',
    strengths: ['Architecture knowledge'],
    improvements: ['Performance awareness'],
  },
};

function renderReport(report?: EvaluationReport) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/report', state: report ? { report } : undefined }]}
    >
      <Report />
    </MemoryRouter>,
  );
}

describe('Report', () => {
  it('shows "No report found" when navigated to without state', () => {
    renderReport();
    expect(screen.getByText(/No report found/)).toBeInTheDocument();
  });

  it('"Back to Home" button renders in empty state', () => {
    renderReport();
    expect(screen.getByRole('button', { name: 'Back to Home' })).toBeInTheDocument();
  });

  it('renders the overall score', () => {
    renderReport(mockReport);
    expect(screen.getByText('8.2')).toBeInTheDocument();
  });

  it('renders the overall summary text', () => {
    renderReport(mockReport);
    expect(screen.getByText('Strong performance across all phases.')).toBeInTheDocument();
  });

  it('renders all three phase cards', () => {
    renderReport(mockReport);
    expect(screen.getByText(PHASE_NAMES[1])).toBeInTheDocument();
    expect(screen.getByText(PHASE_NAMES[2])).toBeInTheDocument();
    expect(screen.getByText(PHASE_NAMES[3])).toBeInTheDocument();
  });

  it('renders phase 1 feedback', () => {
    renderReport(mockReport);
    expect(screen.getByText('Excellent introduction.')).toBeInTheDocument();
  });

  it('renders phase 1 score', () => {
    renderReport(mockReport);
    // score 9 appears in the SVG ring
    expect(screen.getAllByText('9').length).toBeGreaterThanOrEqual(1);
  });

  it('renders strengths items', () => {
    renderReport(mockReport);
    expect(screen.getByText('Clear communication')).toBeInTheDocument();
  });

  it('renders improvements items', () => {
    renderReport(mockReport);
    expect(screen.getByText('Edge case handling')).toBeInTheDocument();
  });

  it('renders "Print / Save PDF" button', () => {
    renderReport(mockReport);
    expect(screen.getByText('Print / Save PDF')).toBeInTheDocument();
  });

  it('renders "Start New Interview" button', () => {
    renderReport(mockReport);
    expect(screen.getByText('Start New Interview')).toBeInTheDocument();
  });

  it('renders "Back to Home" in the report view', () => {
    renderReport(mockReport);
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('overall score uses emerald color for score >= 8', () => {
    renderReport(mockReport);
    // overall 8.2 → emerald color; the score element should have the emerald class
    const scoreEl = screen.getByText('8.2');
    expect(scoreEl.className).toMatch(/emerald/);
  });

  it('overall score uses amber color for score in 4-6 range', () => {
    const lowReport: EvaluationReport = { ...mockReport, overall: 5.0 };
    renderReport(lowReport);
    const scoreEl = screen.getByText('5.0');
    expect(scoreEl.className).toMatch(/amber/);
  });
});
