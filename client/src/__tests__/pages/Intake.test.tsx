import { screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '../../test/helpers/renderWithProviders';
import Intake from '../../pages/Intake';
import { server } from '../../test/mocks/server';

function renderIntake() {
  return renderWithProviders(<Intake />, { session: null });
}

describe('Intake', () => {
  it('renders Step 1 Job Description heading', () => {
    renderIntake();
    expect(screen.getByRole('heading', { name: 'Job Description' })).toBeInTheDocument();
  });

  it('shows "Optional" badge on step 1', () => {
    renderIntake();
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });

  it('Continue button is disabled when JD is short', () => {
    renderIntake();
    const btn = screen.getByRole('button', { name: /^Continue$/ });
    expect(btn).toBeDisabled();
  });

  it('Continue button enables when JD has >50 chars', () => {
    renderIntake();
    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    fireEvent.change(textarea, { target: { value: 'A'.repeat(51) } });
    expect(screen.getByRole('button', { name: /^Continue$/ })).toBeEnabled();
  });

  it('"Skip — AI decides" advances to step 2 without JD', () => {
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    expect(screen.getByText('Years of Experience')).toBeInTheDocument();
  });

  it('switching to URL mode shows input and Fetch button', () => {
    renderIntake();
    fireEvent.click(screen.getByText('From URL'));
    expect(screen.getByPlaceholderText(/https:\/\/company/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fetch' })).toBeInTheDocument();
  });

  it('fetching a JD from URL populates the textarea', async () => {
    renderIntake();
    fireEvent.click(screen.getByText('From URL'));
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/company/), {
      target: { value: 'https://example.com/job' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch' }));
    await waitFor(() =>
      expect(screen.getByText(/Sample job description text from URL/)).toBeInTheDocument(),
    );
  });

  it('shows error when JD fetch fails', async () => {
    server.use(
      http.post('/api/fetch-jd', () =>
        HttpResponse.json({ error: 'Could not fetch URL.' }, { status: 422 }),
      ),
    );
    renderIntake();
    fireEvent.click(screen.getByText('From URL'));
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/company/), {
      target: { value: 'https://bad.url/job' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fetch' }));
    await waitFor(() =>
      expect(screen.getByText(/Could not fetch URL|Failed to fetch/)).toBeInTheDocument(),
    );
  });

  it('step 2 shows experience options', () => {
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    expect(screen.getByText('0 – 2 years')).toBeInTheDocument();
    expect(screen.getByText('2 – 5 years')).toBeInTheDocument();
    expect(screen.getByText('5 – 8 years')).toBeInTheDocument();
    expect(screen.getByText('8+ years')).toBeInTheDocument();
  });

  it('step 2 Continue is always enabled (experience always selected)', () => {
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    expect(screen.getByRole('button', { name: /^Continue$/ })).toBeEnabled();
  });

  it('Back button on step 2 returns to step 1', () => {
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Job Description' })).toBeInTheDocument();
  });

  it('step 3 shows Upload Your CV heading', () => {
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
    expect(screen.getByText('Upload Your CV')).toBeInTheDocument();
  });

  it('"Continue to Device Check" is disabled before CV upload', () => {
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));
    expect(screen.getByRole('button', { name: 'Continue to Device Check' })).toBeDisabled();
  });

  it('shows CV parse success after file upload', async () => {
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));

    const file = new File(['%PDF-1.4 content here'], 'resume.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText('resume.pdf')).toBeInTheDocument(),
    );
  });

  it('shows CV parse error when API fails', async () => {
    server.use(
      http.post('/api/parse-cv', () =>
        HttpResponse.json({ error: 'Unsupported file type.' }, { status: 400 }),
      ),
    );
    renderIntake();
    fireEvent.click(screen.getByText('Skip — AI decides'));
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }));

    const file = new File(['data'], 'resume.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText(/Unsupported file type|Failed to parse/)).toBeInTheDocument(),
    );
  });
});
