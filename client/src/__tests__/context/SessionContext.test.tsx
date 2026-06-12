import { render, screen, act } from '@testing-library/react';
import { SessionProvider, useSession } from '../../context/SessionContext';
import type { SessionData } from '../../types';

const testSession: SessionData = {
  jdText: 'Job description text',
  experience: '2-5',
  cvText: 'CV text',
  cvFileName: 'cv.pdf',
};

function Consumer() {
  const { session, setSession, clearSession } = useSession();
  return (
    <div>
      <div data-testid="session">{session ? session.cvText : 'null'}</div>
      <button onClick={() => setSession(testSession)}>set</button>
      <button onClick={() => clearSession()}>clear</button>
    </div>
  );
}

describe('SessionContext', () => {
  it('default session is null', () => {
    render(<SessionProvider><Consumer /></SessionProvider>);
    expect(screen.getByTestId('session').textContent).toBe('null');
  });

  it('setSession updates the session', () => {
    render(<SessionProvider><Consumer /></SessionProvider>);
    act(() => { screen.getByText('set').click(); });
    expect(screen.getByTestId('session').textContent).toBe('CV text');
  });

  it('clearSession resets to null', () => {
    render(<SessionProvider initialSession={testSession}><Consumer /></SessionProvider>);
    expect(screen.getByTestId('session').textContent).toBe('CV text');
    act(() => { screen.getByText('clear').click(); });
    expect(screen.getByTestId('session').textContent).toBe('null');
  });

  it('initialSession prop sets the initial value', () => {
    render(<SessionProvider initialSession={testSession}><Consumer /></SessionProvider>);
    expect(screen.getByTestId('session').textContent).toBe('CV text');
  });

  it('throws when useSession is used outside SessionProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow('useSession must be used within SessionProvider');
    spy.mockRestore();
  });
});
