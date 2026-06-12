import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import Landing from '../../pages/Landing';
import { server } from '../../test/mocks/server';

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );
}

describe('Landing', () => {
  it('renders the MockInterview brand name', () => {
    renderLanding();
    expect(screen.getAllByText('MockInterview').length).toBeGreaterThan(0);
  });

  it('renders the Coding / Technical card', () => {
    renderLanding();
    expect(screen.getByText('Coding / Technical')).toBeInTheDocument();
  });

  it('renders coming soon cards for Sales and Marketing', () => {
    renderLanding();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    const comingSoon = screen.getAllByText('Coming soon');
    expect(comingSoon.length).toBeGreaterThanOrEqual(2);
  });

  it('shows free mode badge after fetching mode', async () => {
    renderLanding();
    await waitFor(() =>
      expect(screen.getByText('◈ Free Mode')).toBeInTheDocument(),
    );
  });

  it('shows active model name after mode fetch', async () => {
    renderLanding();
    await waitFor(() =>
      expect(screen.getByText(/Pollinations/)).toBeInTheDocument(),
    );
  });

  it('renders the Start Interview button', async () => {
    renderLanding();
    expect(screen.getByText('Start Interview')).toBeInTheDocument();
  });

  it('falls back to free mode when API call fails', async () => {
    server.use(http.get('/api/mode', () => HttpResponse.error()));
    renderLanding();
    await waitFor(() =>
      expect(screen.getByText('◈ Free Mode')).toBeInTheDocument(),
    );
  });

  it('renders Free Mode radio option', () => {
    renderLanding();
    expect(screen.getByText('Free Mode')).toBeInTheDocument();
  });

  it('renders Premium Claude radio option', () => {
    renderLanding();
    expect(screen.getByText(/Premium.*Claude|Premium — Claude/)).toBeInTheDocument();
  });

  it('shows AI Engine section heading', () => {
    renderLanding();
    expect(screen.getByText('AI Engine')).toBeInTheDocument();
  });

  it('shows "Key required" badge when claudeKeyAvailable is false', async () => {
    // default handler returns claudeKeyAvailable: false
    renderLanding();
    await waitFor(() => screen.getByText('◈ Free Mode'));
    expect(screen.getByText(/Key required/)).toBeInTheDocument();
  });
});
