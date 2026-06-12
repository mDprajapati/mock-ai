import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/mode', () =>
    HttpResponse.json({
      mode: 'free',
      model: 'GPT-4o-mini via Pollinations (Free)',
      requiresKey: false,
      claudeKeyAvailable: false,
    }),
  ),

  http.post('/api/mode', () =>
    HttpResponse.json({
      mode: 'claude',
      model: 'Claude Sonnet (Anthropic)',
      requiresKey: true,
      claudeKeyAvailable: true,
    }),
  ),

  http.post('/api/fetch-jd', () =>
    HttpResponse.json({ text: 'Sample job description text from URL.' }),
  ),

  http.post('/api/parse-cv', () =>
    HttpResponse.json({ text: 'Sample CV text parsed from PDF.', fileName: 'resume.pdf' }),
  ),

  http.get('/api/phase2/exercises', () =>
    HttpResponse.json({
      exercises: [
        { title: 'FizzBuzz', description: 'Write FizzBuzz', starterCode: '// code here' },
        { title: 'Swap Variables', description: 'Swap two variables', starterCode: '// code here' },
      ],
    }),
  ),

  http.post('/api/interview/message', () =>
    HttpResponse.json({ question: 'Tell me about yourself.', advancePhase: false }),
  ),

  http.post('/api/evaluate', () =>
    HttpResponse.json({
      report: {
        phase1: { score: 8, feedback: 'Good', strengths: ['Clear'], improvements: ['More detail'] },
        phase2: { score: 7, feedback: 'OK', strengths: ['Solid'], improvements: ['Speed'] },
        phase3: { score: 9, feedback: 'Great', strengths: ['Creative'], improvements: ['None'] },
        overall: 8,
        summary: 'Strong candidate overall.',
      },
    }),
  ),
];
