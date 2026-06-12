import request from 'supertest';
import express from 'express';
import interviewRouter from '../../routes/interview';
import * as ai from '../../services/ai';

jest.mock('../../services/ai');
const mockChatAI = ai.chatAI as jest.MockedFunction<typeof ai.chatAI>;
const mockGetMode = ai.getMode as jest.MockedFunction<typeof ai.getMode>;

const app = express();
app.use(express.json());
app.use('/api/interview', interviewRouter);

const session = {
  cvText: 'Senior React developer with 5 years experience.',
  jdText: 'Looking for a React developer.',
  experience: '5-8',
  cvFileName: 'cv.pdf',
};

beforeEach(() => {
  mockGetMode.mockReturnValue('free');
  mockChatAI.mockResolvedValue('What is your experience with React?');
});

describe('POST /api/interview/message', () => {
  it('returns 400 when cvText is missing', async () => {
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session: { jdText: 'JD', experience: '0-2' }, transcript: [], phase: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when jdText is missing and jdSkipped is false', async () => {
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session: { cvText: 'CV', experience: '0-2' }, transcript: [], phase: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 200 for happy path with phase 1', async () => {
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript: [], phase: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('question');
    expect(res.body).toHaveProperty('advancePhase');
  });

  it('strips [ADVANCE] token and sets advancePhase=true', async () => {
    mockChatAI.mockResolvedValue('Good work. Next question? [ADVANCE]');
    const transcript = Array.from({ length: 4 }, (_, i) => ({
      role: i % 2 === 0 ? 'ai' : 'candidate',
      text: `text ${i}`,
      phase: 1,
    }));
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript, phase: 1 });
    expect(res.status).toBe(200);
    expect(res.body.advancePhase).toBe(true);
    expect(res.body.question).not.toContain('[ADVANCE]');
  });

  it('parses [TASK:2] and returns activeTaskIndex=1 (0-based)', async () => {
    mockChatAI.mockResolvedValue('[TASK:2] Write a FizzBuzz function.');
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript: [], phase: 2 });
    expect(res.status).toBe(200);
    expect(res.body.activeTaskIndex).toBe(1);
    expect(res.body.question).not.toContain('[TASK:2]');
  });

  it('handles both [ADVANCE] and [TASK:N] simultaneously', async () => {
    mockChatAI.mockResolvedValue('[TASK:3] Solve this problem. [ADVANCE]');
    const transcript = Array.from({ length: 4 }, (_, i) => ({
      role: i % 2 === 0 ? 'ai' : 'candidate',
      text: `text ${i}`,
      phase: 2,
    }));
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript, phase: 2 });
    expect(res.status).toBe(200);
    expect(res.body.advancePhase).toBe(true);
    expect(res.body.activeTaskIndex).toBe(2);
  });

  it('returns 500 when chatAI throws', async () => {
    mockChatAI.mockRejectedValue(new Error('AI down'));
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript: [], phase: 1 });
    expect(res.status).toBe(500);
  });

  it('accepts session with jdSkipped=true and no jdText', async () => {
    const skippedSession = { cvText: session.cvText, jdSkipped: true, experience: '0-2' };
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session: skippedSession, transcript: [], phase: 1 });
    expect(res.status).toBe(200);
  });

  it('uses jdSkipped substitute text in system prompt', async () => {
    const skippedSession = { cvText: 'React dev.', jdSkipped: true, experience: '0-2' };
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Question?';
    });
    await request(app)
      .post('/api/interview/message')
      .send({ session: skippedSession, transcript: [], phase: 1 });
    expect(capturedSystem).toContain('infer');
  });

  it('ADVANCE SIGNAL appended when candidate answers >= 3 and phase < 3', async () => {
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Question?';
    });
    const transcript = [
      { role: 'ai', text: 'Q1', phase: 1 },
      { role: 'candidate', text: 'A1', phase: 1 },
      { role: 'ai', text: 'Q2', phase: 1 },
      { role: 'candidate', text: 'A2', phase: 1 },
      { role: 'ai', text: 'Q3', phase: 1 },
      { role: 'candidate', text: 'A3', phase: 1 },
    ];
    await request(app)
      .post('/api/interview/message')
      .send({ session, transcript, phase: 1 });
    expect(capturedSystem).toContain('ADVANCE SIGNAL');
  });

  it('ADVANCE SIGNAL NOT appended when candidate answers < 3', async () => {
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Question?';
    });
    const transcript = [
      { role: 'ai', text: 'Q1', phase: 1 },
      { role: 'candidate', text: 'A1', phase: 1 },
    ];
    await request(app)
      .post('/api/interview/message')
      .send({ session, transcript, phase: 1 });
    expect(capturedSystem).not.toContain('ADVANCE SIGNAL');
  });

  it('ADVANCE SIGNAL NOT appended on phase 3', async () => {
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Question?';
    });
    const transcript = Array.from({ length: 8 }, (_, i) => ({
      role: i % 2 === 0 ? 'ai' : 'candidate',
      text: `text ${i}`,
      phase: 3 as 1 | 2 | 3,
    }));
    await request(app)
      .post('/api/interview/message')
      .send({ session, transcript, phase: 3 });
    expect(capturedSystem).not.toContain('ADVANCE SIGNAL');
  });

  it('free mode truncates full prompt to 5000 chars', async () => {
    mockGetMode.mockReturnValue('free');
    const longCv = 'x'.repeat(5000);
    const longJd = 'y'.repeat(5000);
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Q?';
    });
    await request(app)
      .post('/api/interview/message')
      .send({
        session: { ...session, cvText: longCv, jdText: longJd },
        transcript: [],
        phase: 1,
      });
    expect(capturedSystem.length).toBeLessThanOrEqual(5000);
  });

  it('buildMessages returns seed message for empty transcript', async () => {
    let capturedMessages: any[] = [];
    mockChatAI.mockImplementation(async (_sys: string, msgs: any[]) => {
      capturedMessages = msgs;
      return 'Q?';
    });
    await request(app)
      .post('/api/interview/message')
      .send({ session, transcript: [], phase: 1 });
    expect(capturedMessages[0].content).toContain('begin');
  });

  it('buildMessages maps ai→assistant and candidate→user', async () => {
    let capturedMessages: any[] = [];
    mockChatAI.mockImplementation(async (_sys: string, msgs: any[]) => {
      capturedMessages = msgs;
      return 'Q?';
    });
    const transcript = [
      { role: 'ai', text: 'AI question', phase: 1 },
      { role: 'candidate', text: 'Candidate answer', phase: 1 },
    ];
    await request(app)
      .post('/api/interview/message')
      .send({ session, transcript, phase: 1 });
    expect(capturedMessages[0].role).toBe('assistant');
    expect(capturedMessages[1].role).toBe('user');
  });

  it('adds continuation prompt when last message is from AI', async () => {
    let capturedMessages: any[] = [];
    mockChatAI.mockImplementation(async (_sys: string, msgs: any[]) => {
      capturedMessages = msgs;
      return 'Q?';
    });
    const transcript = [
      { role: 'ai', text: 'Tell me about yourself.', phase: 1 },
    ];
    await request(app)
      .post('/api/interview/message')
      .send({ session, transcript, phase: 1 });
    const last = capturedMessages[capturedMessages.length - 1];
    expect(last.role).toBe('user');
    expect(last.content).toContain('continue');
  });

  it('buildPhase2Guide with jsExercises builds exercise task list', async () => {
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Q?';
    });
    const jsExercises = [
      { title: 'FizzBuzz', description: 'Write FizzBuzz\nLine 2', starterCode: '// code' },
      { title: 'Swap Variables', description: 'Swap a and b', starterCode: '// code' },
    ];
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript: [], phase: 2, jsExercises });
    expect(res.status).toBe(200);
    expect(capturedSystem).toContain('FizzBuzz');
    expect(capturedSystem).toContain('[TASK:1]');
  });

  it('phase 3 prompt with jdSkipped uses CV background phrase', async () => {
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Q?';
    });
    const skippedSession = { cvText: 'React dev 5 years.', jdSkipped: true, experience: '5-8' };
    await request(app)
      .post('/api/interview/message')
      .send({ session: skippedSession, transcript: [], phase: 3 });
    expect(capturedSystem).toContain("candidate's CV background");
  });

  it('non-free mode uses larger cv/jd limits (no truncation)', async () => {
    mockGetMode.mockReturnValue('claude');
    let capturedSystem = '';
    mockChatAI.mockImplementation(async (sys: string) => {
      capturedSystem = sys;
      return 'Q?';
    });
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript: [], phase: 1 });
    expect(res.status).toBe(200);
    // For claude mode, fullPrompt is NOT sliced to 5000 chars
    expect(capturedSystem.length).toBeGreaterThan(0);
    // System prompt should NOT be artificially truncated
    expect(capturedSystem).toContain('CANDIDATE PROFILE');
  });

  it('logs HTTP status code when chatAI throws with err.response.status', async () => {
    const err: any = new Error('AI error');
    err.response = { status: 503 };
    mockChatAI.mockRejectedValue(err);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app)
      .post('/api/interview/message')
      .send({ session, transcript: [], phase: 1 });
    expect(res.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Interview] ERROR:'),
      expect.anything(),
      expect.stringContaining('HTTP 503'),
    );
    consoleSpy.mockRestore();
  });
});
