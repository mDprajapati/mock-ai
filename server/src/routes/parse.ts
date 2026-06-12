import { Router, Request, Response } from 'express';
import multer from 'multer';
import axios from 'axios';
import * as cheerio from 'cheerio';
// @ts-ignore — pdf-parse has no bundled types
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/parse-cv', upload.single('cv'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;
    let text = '';

    if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX file.' });
      return;
    }

    text = text.replace(/\s+/g, ' ').trim();
    if (!text || text.length < 50) {
      res.status(422).json({ error: 'Could not extract meaningful text from the file.' });
      return;
    }

    res.json({ text, fileName: originalname });
  } catch (err) {
    console.error('CV parse error:', err);
    res.status(500).json({ error: 'Failed to parse CV file.' });
  }
});

router.post('/fetch-jd', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body as { url: string };
    if (!url || !url.startsWith('http')) {
      res.status(400).json({ error: 'Invalid URL provided.' });
      return;
    }

    const response = await axios.get(url, {
      timeout: 12000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MockInterviewBot/1.0)' },
      maxContentLength: 2 * 1024 * 1024,
    });

    const $ = cheerio.load(response.data as string);
    $('script, style, nav, header, footer, iframe').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 100) {
      res.status(422).json({ error: 'Could not extract job description text from the URL.' });
      return;
    }

    // Limit to 8000 chars to avoid huge prompts
    res.json({ text: text.slice(0, 8000) });
  } catch (err: any) {
    console.error('JD fetch error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      res.status(422).json({ error: 'Could not reach the URL. Please paste the JD text directly.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch job description from URL.' });
    }
  }
});

export default router;
