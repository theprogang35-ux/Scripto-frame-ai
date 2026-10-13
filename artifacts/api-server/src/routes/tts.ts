import { Router } from "express";
import { getUserId } from "../lib/auth";
import {
  getGeminiKeyCandidates,
  getGeminiKeyCount,
  markGeminiKeyFailure,
} from "../lib/geminiKeys";

const router = Router();

const CHARACTER_VOICES: Record<string, string> = {
  // JJK
  gojo: "Charon", sukuna: "Orus", yuji: "Puck", megumi: "Kore",
  nobara: "Zephyr", nanami: "Charon", toji: "Fenrir",
  // Naruto
  naruto: "Puck", sasuke: "Kore", kakashi: "Charon", itachi: "Orus",
  minato: "Charon", jiraiya: "Fenrir", sakura: "Zephyr",
  // One Piece
  luffy: "Fenrir", zoro: "Orus", nami: "Aoede", usopp: "Puck",
  sanji: "Charon", chopper: "Leda", robin: "Zephyr", franky: "Fenrir",
  brook: "Puck", jinbe: "Orus", shanks: "Charon", ace: "Fenrir",
  blackbeard: "Orus", kaido: "Orus", hancock: "Aoede",
  // Demon Slayer
  tanjiro: "Puck", nezuko: "Leda", zenitsu: "Puck", inosuke: "Fenrir",
  rengoku: "Fenrir", muzan: "Kore",
  // AOT
  eren: "Fenrir", levi: "Kore", mikasa: "Zephyr", armin: "Puck",
  hange: "Aoede", reiner: "Orus",
  // Dragon Ball
  goku: "Puck", vegeta: "Orus", piccolo: "Charon", gohan: "Puck", frieza: "Charon",
  // Bleach
  ichigo: "Fenrir", rukia: "Zephyr", aizen: "Charon", byakuya: "Kore",
  kenpachi: "Fenrir", grimmjow: "Fenrir",
  // MHA
  deku: "Puck", bakugo: "Fenrir", allmight: "Orus", todoroki: "Kore",
  // HxH
  gon: "Puck", killua: "Charon", hisoka: "Charon", kurapika: "Kore",
  // Tokyo Ghoul
  kaneki: "Charon", touka: "Zephyr",
  // Marvel
  ironman: "Charon", spiderman: "Puck", captainamerica: "Orus",
  thor: "Orus", hulk: "Fenrir", blackwidow: "Zephyr",
  blackpanther: "Charon", scarletwitch: "Aoede", groot: "Orus", loki: "Charon",
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readJson(response: Response): Promise<Record<string, any>> {
  const body = await response.text();
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return { raw: body.slice(0, 500) };
  }
}

function providerError(data: Record<string, any>, status: number) {
  const message = data?.error?.message;
  return typeof message === "string" ? message : `Voice provider request failed (${status})`;
}

function isRetryable(status: number) {
  return [401, 403, 408, 429, 500, 502, 503, 504].includes(status);
}

// Converts raw PCM (16-bit LE, mono, 24000 Hz) to a proper WAV buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const wavBuffer = Buffer.alloc(headerSize + dataSize);

  wavBuffer.write("RIFF", 0);
  wavBuffer.writeUInt32LE(36 + dataSize, 4);
  wavBuffer.write("WAVE", 8);
  wavBuffer.write("fmt ", 12);
  wavBuffer.writeUInt32LE(16, 16);           // PCM chunk size
  wavBuffer.writeUInt16LE(1, 20);            // PCM format
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(bitsPerSample, 34);
  wavBuffer.write("data", 36);
  wavBuffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wavBuffer, 44);

  return wavBuffer;
}

// POST /api/tts
router.post("/tts", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { text, characterId } = req.body;
  if (!text || typeof text !== "string") return res.status(400).json({ error: "text required" });

  const voiceName = CHARACTER_VOICES[characterId] || "Charon";
  const truncated = text.slice(0, 800);

  if (getGeminiKeyCount() === 0) {
    return res.status(503).json({ error: "Voice generation is not configured yet." });
  }

  let lastError = "Voice generation failed";
  const keyCandidates = getGeminiKeyCandidates();
  for (let attempt = 0; attempt < keyCandidates.length; attempt++) {
    const apiKey = keyCandidates[attempt].key;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: truncated }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const err = await readJson(response);
        lastError = providerError(err, response.status);
        if (isRetryable(response.status) && attempt < keyCandidates.length - 1) {
          markGeminiKeyFailure(apiKey, response.status);
          await wait(Math.min(900, 150 * 2 ** attempt));
          continue;
        }
        console.error("TTS API error:", { status: response.status, message: lastError });
        return res.status(response.status === 429 ? 429 : 502).json({ error: lastError });
      }

      const data: any = await readJson(response);
      const parts = (data?.candidates || []).flatMap((candidate: any) => candidate?.content?.parts || []);
      const part = parts.find((candidatePart: any) => {
        const inlineData = candidatePart?.inlineData || candidatePart?.inline_data;
        return typeof inlineData?.data === "string";
      });
      const inlineData = part?.inlineData || part?.inline_data;
      const audioB64 = inlineData?.data;
      const mimeType: string = inlineData?.mimeType || "audio/pcm";

      if (!audioB64) {
        lastError = "The voice provider returned no audio. Please try again.";
        console.error("No audio data in TTS response", JSON.stringify(data).slice(0, 500));
        if (attempt < keyCandidates.length - 1) continue;
        return res.status(502).json({ error: lastError });
      }

      const rawBuffer = Buffer.from(audioB64, "base64");

      // Gemini TTS returns raw PCM — convert to WAV so browsers can play it
      const isPcm = mimeType.includes("pcm") || mimeType.includes("L16");
      const sampleRate = mimeType.match(/rate=(\d+)/)?.[1]
        ? parseInt(mimeType.match(/rate=(\d+)/)![1])
        : 24000;

      const wavBuffer = isPcm ? pcmToWav(rawBuffer, sampleRate) : rawBuffer;
      const contentType = isPcm ? "audio/wav" : mimeType;

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", wavBuffer.length);
      return res.send(wavBuffer);

    } catch (err) {
      lastError = err instanceof Error ? err.message : "Voice provider request failed";
      if (attempt < keyCandidates.length - 1) {
        markGeminiKeyFailure(apiKey, 502);
        continue;
      }
      console.error("TTS error:", err);
      return res.status(502).json({ error: lastError });
    }
  }
  return res.status(502).json({ error: lastError });
});

export default router;
