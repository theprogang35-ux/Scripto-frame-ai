import { Router } from "express";
import { getUserId } from "../lib/auth";

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

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean) as string[];

let ttsKeyIndex = 0;

function getNextKey(): string {
  if (GEMINI_KEYS.length === 0) throw new Error("No Gemini API keys configured");
  const key = GEMINI_KEYS[ttsKeyIndex % GEMINI_KEYS.length];
  ttsKeyIndex = (ttsKeyIndex + 1) % GEMINI_KEYS.length;
  return key;
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

  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const apiKey = getNextKey();
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
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
        const err = await response.json().catch(() => ({}));
        if (response.status === 429 && attempt < GEMINI_KEYS.length - 1) continue;
        console.error("TTS API error:", err);
        return res.status(500).json({ error: "TTS failed", detail: err });
      }

      const data: any = await response.json();
      const part = data?.candidates?.[0]?.content?.parts?.[0];
      const audioB64 = part?.inlineData?.data;
      const mimeType: string = part?.inlineData?.mimeType || "audio/pcm";

      if (!audioB64) {
        console.error("No audio data in TTS response", JSON.stringify(data).slice(0, 300));
        return res.status(500).json({ error: "No audio in response" });
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
      if (attempt < GEMINI_KEYS.length - 1) continue;
      console.error("TTS error:", err);
      return res.status(500).json({ error: "TTS error" });
    }
  }
  return res.status(500).json({ error: "All keys failed" });
});

export default router;
