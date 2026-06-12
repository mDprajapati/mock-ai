import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/helpers/renderWithProviders';
import DeviceCheck from '../../pages/DeviceCheck';
import type { SessionData } from '../../types';

const mockSession: SessionData = {
  jdText: 'Job description',
  experience: '2-5',
  cvText: 'CV text here for candidate',
  cvFileName: 'resume.pdf',
};

const mockStop = vi.fn();
const mockStream = {
  getTracks: () => [{ stop: mockStop }],
  getVideoTracks: () => [{ stop: mockStop }],
};

function renderDeviceCheck(session: SessionData | null = mockSession) {
  return renderWithProviders(<DeviceCheck />, { session });
}

describe('DeviceCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(mockStream);
  });

  it('renders "Ready to join?" heading', () => {
    renderDeviceCheck();
    expect(screen.getByText('Ready to join?')).toBeInTheDocument();
  });

  it('renders "Camera" device label', () => {
    renderDeviceCheck();
    expect(screen.getAllByText('Camera').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Microphone" device label', () => {
    renderDeviceCheck();
    expect(screen.getAllByText('Microphone').length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Allow Camera & Microphone" button initially', () => {
    renderDeviceCheck();
    expect(screen.getByText('Allow Camera & Microphone')).toBeInTheDocument();
  });

  it('"Join now →" button is disabled before permissions granted', () => {
    renderDeviceCheck();
    expect(screen.getByText('Join now →')).toBeDisabled();
  });

  it('calls getUserMedia with video and audio on button click', async () => {
    renderDeviceCheck();
    fireEvent.click(screen.getByText('Allow Camera & Microphone'));
    await waitFor(() =>
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true,
      }),
    );
  });

  it('enables "Join now →" after permissions granted', async () => {
    renderDeviceCheck();
    fireEvent.click(screen.getByText('Allow Camera & Microphone'));
    await waitFor(() =>
      expect(screen.getByText('Join now →')).toBeEnabled(),
    );
  });

  it('shows error message when NotAllowedError occurs', async () => {
    const err = Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    renderDeviceCheck();
    fireEvent.click(screen.getByText('Allow Camera & Microphone'));
    await waitFor(() =>
      expect(screen.getByText(/Camera\/microphone access was denied/)).toBeInTheDocument(),
    );
  });

  it('shows error message when NotFoundError occurs', async () => {
    const err = Object.assign(new Error('no device'), { name: 'NotFoundError' });
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    renderDeviceCheck();
    fireEvent.click(screen.getByText('Allow Camera & Microphone'));
    await waitFor(() =>
      expect(screen.getByText(/No camera or microphone found/)).toBeInTheDocument(),
    );
  });

  it('shows generic error message for unknown error', async () => {
    const err = new Error('hardware fault');
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    renderDeviceCheck();
    fireEvent.click(screen.getByText('Allow Camera & Microphone'));
    await waitFor(() =>
      expect(screen.getByText(/Could not access your devices/)).toBeInTheDocument(),
    );
  });

  it('renders Device Check header label', () => {
    renderDeviceCheck();
    expect(screen.getByText('Device Check')).toBeInTheDocument();
  });

  it('stops tracks and navigates on "Join now →" click after grant', async () => {
    renderDeviceCheck();
    fireEvent.click(screen.getByText('Allow Camera & Microphone'));
    await waitFor(() => expect(screen.getByText('Join now →')).toBeEnabled());
    fireEvent.click(screen.getByText('Join now →'));
    expect(mockStop).toHaveBeenCalled();
  });
});
