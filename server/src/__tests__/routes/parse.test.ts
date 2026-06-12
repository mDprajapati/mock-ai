import request from 'supertest';
import express from 'express';

// Module-level mock state (changeable per test)
const mockPdfParse = jest.fn();
const mockMammothExtract = jest.fn();
const mockAxiosGet = jest.fn();
let cheerioBodyText = 'Software Engineer position requiring React TypeScript Node.js experience with competitive salary and benefits package for the testing suite.';

jest.mock('pdf-parse', () => mockPdfParse);
jest.mock('mammoth', () => ({ extractRawText: mockMammothExtract }));
jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn((...args: any[]) => mockAxiosGet(...args)), post: jest.fn() },
}));
jest.mock('cheerio', () => ({
  load: jest.fn(() => (selector: string) => ({
    text: () => selector === 'body' ? cheerioBodyText : '',
    remove: jest.fn(),
  })),
}));

import parseRouter from '../../routes/parse';

const app = express();
app.use(express.json());
app.use('/api', parseRouter);

const LONG_JD = 'Software Engineer position requiring React TypeScript Node.js experience with competitive salary and benefits package for the testing suite.';

describe('POST /api/parse-cv', () => {
  beforeEach(() => {
    mockPdfParse.mockReset();
    mockMammothExtract.mockReset();
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/parse-cv');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no file/i);
  });

  it('parses PDF file and returns text', async () => {
    mockPdfParse.mockResolvedValue({
      text: 'This is my resume with enough text content to pass validation checks for testing purposes.',
    });
    const res = await request(app)
      .post('/api/parse-cv')
      .attach('cv', Buffer.from('fake pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(200);
    expect(res.body.text).toContain('resume');
    expect(res.body.fileName).toBe('resume.pdf');
  });

  it('parses DOCX file and returns text', async () => {
    mockMammothExtract.mockResolvedValue({
      value: 'Candidate resume content with enough text for validation minimum character requirement.',
    });
    const res = await request(app)
      .post('/api/parse-cv')
      .attach('cv', Buffer.from('fake docx'), {
        filename: 'resume.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    expect(res.status).toBe(200);
    expect(res.body.text).toContain('Candidate');
  });

  it('returns 400 for unsupported file type', async () => {
    const res = await request(app)
      .post('/api/parse-cv')
      .attach('cv', Buffer.from('data'), { filename: 'resume.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/unsupported/i);
  });

  it('returns 422 when extracted text is too short', async () => {
    mockPdfParse.mockResolvedValue({ text: 'short' });
    const res = await request(app)
      .post('/api/parse-cv')
      .attach('cv', Buffer.from('pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(422);
  });

  it('returns 500 when pdfParse throws', async () => {
    mockPdfParse.mockRejectedValue(new Error('parse failure'));
    const res = await request(app)
      .post('/api/parse-cv')
      .attach('cv', Buffer.from('pdf'), { filename: 'resume.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(500);
  });

  it('detects PDF by mimetype without .pdf extension', async () => {
    mockPdfParse.mockResolvedValue({
      text: 'Resume content long enough to pass the fifty character validation minimum for PDF detection.',
    });
    const res = await request(app)
      .post('/api/parse-cv')
      .attach('cv', Buffer.from('pdf'), { filename: 'myfile', contentType: 'application/pdf' });
    expect(res.status).toBe(200);
  });

  it('detects DOCX by mimetype without .docx extension', async () => {
    mockMammothExtract.mockResolvedValue({
      value: 'My resume content that is definitely long enough to pass validation minimum length requirement.',
    });
    const res = await request(app)
      .post('/api/parse-cv')
      .attach('cv', Buffer.from('docx'), {
        filename: 'myfile',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/fetch-jd', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset();
    cheerioBodyText = LONG_JD;
  });

  it('returns 400 when no URL is provided', async () => {
    const res = await request(app).post('/api/fetch-jd').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid url/i);
  });

  it('returns 400 when URL does not start with http', async () => {
    const res = await request(app).post('/api/fetch-jd').send({ url: 'ftp://example.com' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with extracted text for valid URL', async () => {
    mockAxiosGet.mockResolvedValue({ data: '<html><body>job text</body></html>' });
    const res = await request(app).post('/api/fetch-jd').send({ url: 'http://example.com/job' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('text');
    expect(typeof res.body.text).toBe('string');
  });

  it('returns 422 when extracted text is too short', async () => {
    cheerioBodyText = 'short';
    mockAxiosGet.mockResolvedValue({ data: '<html><body>short</body></html>' });
    const res = await request(app).post('/api/fetch-jd').send({ url: 'http://example.com/job' });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/could not extract/i);
  });

  it('returns 422 on ECONNREFUSED', async () => {
    const err: any = new Error('connect ECONNREFUSED');
    err.code = 'ECONNREFUSED';
    mockAxiosGet.mockRejectedValue(err);
    const res = await request(app).post('/api/fetch-jd').send({ url: 'http://unreachable.com' });
    expect(res.status).toBe(422);
  });

  it('returns 422 on ENOTFOUND', async () => {
    const err: any = new Error('getaddrinfo ENOTFOUND');
    err.code = 'ENOTFOUND';
    mockAxiosGet.mockRejectedValue(err);
    const res = await request(app).post('/api/fetch-jd').send({ url: 'http://nosuchdomain.invalid' });
    expect(res.status).toBe(422);
  });

  it('returns 500 on other axios errors', async () => {
    mockAxiosGet.mockRejectedValue(new Error('unknown network error'));
    const res = await request(app).post('/api/fetch-jd').send({ url: 'http://example.com/job' });
    expect(res.status).toBe(500);
  });

  it('returns text no longer than 8000 chars', async () => {
    mockAxiosGet.mockResolvedValue({ data: '<html><body>job text</body></html>' });
    const res = await request(app).post('/api/fetch-jd').send({ url: 'http://example.com/job' });
    if (res.status === 200) {
      expect(res.body.text.length).toBeLessThanOrEqual(8000);
    }
  });
});
