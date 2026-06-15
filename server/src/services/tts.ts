import axios from 'axios';

// Azure Cognitive Services — Neural Text-to-Speech.
// Produces natural, human-sounding Indian English audio (en-IN-PrabhatNeural).
// Requires AZURE_SPEECH_KEY + AZURE_SPEECH_REGION in server/.env.
//
//   AZURE_SPEECH_KEY     your Azure Speech resource key
//   AZURE_SPEECH_REGION  the resource region, e.g. "centralindia" or "eastus"
//   AZURE_SPEECH_VOICE   optional voice name (default: en-IN-PrabhatNeural)

export function hasAzureTTS(): boolean {
  return !!(process.env.AZURE_SPEECH_KEY?.trim() && process.env.AZURE_SPEECH_REGION?.trim());
}

function getVoice(): string {
  return process.env.AZURE_SPEECH_VOICE?.trim() || 'en-IN-PrabhatNeural';
}

// Derive the BCP-47 locale from the voice name (e.g. "en-IN-PrabhatNeural" -> "en-IN").
function localeFromVoice(voice: string): string {
  const m = voice.match(/^([a-z]{2}-[A-Z]{2})/);
  return m ? m[1] : 'en-IN';
}

const XML_ESCAPES: Record<string, string> = {
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
};
const escapeXml = (s: string): string => s.replace(/[<>&'"]/g, (c) => XML_ESCAPES[c]);

/** Synthesize speech and return MP3 audio bytes. Throws if Azure is misconfigured or the call fails. */
export async function synthesize(text: string): Promise<Buffer> {
  const key = process.env.AZURE_SPEECH_KEY!.trim();
  const region = process.env.AZURE_SPEECH_REGION!.trim();
  const voice = getVoice();
  const locale = localeFromVoice(voice);

  const ssml =
    `<speak version='1.0' xml:lang='${locale}'>` +
    `<voice xml:lang='${locale}' name='${voice}'>${escapeXml(text)}</voice>` +
    `</speak>`;

  const response = await axios.post(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    ssml,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'MockInterview',
      },
      responseType: 'arraybuffer',
      timeout: 30_000,
    },
  );

  return Buffer.from(response.data as ArrayBuffer);
}
