import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../../context/SessionContext';
import type { SessionData } from '../../types';

interface Options {
  route?: string;
  session?: SessionData | null;
}

export function renderWithProviders(ui: ReactNode, { route = '/', session }: Options = {}) {
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <SessionProvider initialSession={session ?? null}>
        {ui}
      </SessionProvider>
    </MemoryRouter>,
  );
  return result;
}
