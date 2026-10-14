import { Router } from "express";
import { getUserId } from "../lib/auth";
import {
  generateOpenRouterSpeech,
  getUserFacingProviderError,
} from "../lib/externalAiProviders";

const router = Router();

const CHARACTER_VOICES: Record<string, string> = {
  // JJK
  gojo: "en_paul_confident", sukuna: "en_paul_angry", yuji: "en_paul_happy", megumi: "gb_oliver_neutral",
  nobara: "gb_jane_confident", nanami: "en_paul_neutral", toji: "en_paul_frustrated",
  // Naruto
  naruto: "en_paul_excited", sasuke: "gb_oliver_neutral", kakashi: "gb_oliver_curious", itachi: "en_paul_confident",
  minato: "en_paul_neutral", jiraiya: "en_paul_happy", sakura: "gb_jane_confident",
  // One Piece
  luffy: "en_paul_excited", zoro: "en_paul_confident", nami: "gb_jane_curious", usopp: "en_paul_happy",
  sanji: "en_paul_confident", chopper: "gb_jane_neutral", robin: "gb_jane_confident", franky: "en_paul_excited",
  brook: "en_paul_happy", jinbe: "gb_oliver_neutral", shanks: "en_paul_neutral", ace: "en_paul_excited",
  blackbeard: "en_paul_angry", kaido: "en_paul_angry", hancock: "gb_jane_confident",
  // Demon Slayer
  tanjiro: "en_paul_happy", nezuko: "gb_jane_neutral", zenitsu: "en_paul_excited", inosuke: "en_paul_angry",
  rengoku: "en_paul_confident", muzan: "gb_oliver_neutral",
  // AOT
  eren: "en_paul_angry", levi: "gb_oliver_neutral", mikasa: "gb_jane_confident", armin: "en_paul_neutral",
  hange: "gb_jane_curious", reiner: "en_paul_confident",
  // Dragon Ball
  goku: "en_paul_happy", vegeta: "en_paul_confident", piccolo: "gb_oliver_neutral", gohan: "en_paul_happy", frieza: "en_paul_angry",
  // Bleach
  ichigo: "en_paul_confident", rukia: "gb_jane_confident", aizen: "gb_oliver_neutral", byakuya: "gb_oliver_confident",
  kenpachi: "en_paul_angry", grimmjow: "en_paul_frustrated",
  // MHA
  deku: "en_paul_happy", bakugo: "en_paul_angry", allmight: "en_paul_confident", todoroki: "gb_oliver_neutral",
  // HxH
  gon: "en_paul_happy", killua: "gb_oliver_curious", hisoka: "gb_oliver_confident", kurapika: "gb_jane_confident",
  // Tokyo Ghoul
  kaneki: "en_paul_neutral", touka: "gb_jane_neutral",
  // Marvel
  ironman: "en_paul_confident", spiderman: "en_paul_happy", captainamerica: "en_paul_neutral",
  thor: "en_paul_confident", hulk: "en_paul_angry", blackwidow: "gb_jane_confident",
  blackpanther: "gb_oliver_neutral", scarletwitch: "gb_jane_curious", groot: "en_paul_happy", loki: "gb_oliver_confident",
};

router.post("/tts", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { text, characterId } = req.body ?? {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text required" });
  }

  const voice = typeof characterId === "string"
    ? CHARACTER_VOICES[characterId] || "en_paul_neutral"
    : "en_paul_neutral";

  try {
    const generated = await generateOpenRouterSpeech(text.trim().slice(0, 800), voice);
    res.setHeader("Content-Type", generated.mimeType);
    res.setHeader("Content-Length", generated.audio.length);
    return res.send(generated.audio);
  } catch (error) {
    const providerError = error as { code?: string; status?: number };
    req.log.warn(
      { code: providerError.code, status: providerError.status },
      "OpenRouter speech request failed",
    );
    const status = providerError.code === "missing_api_key"
      ? 503
      : providerError.status === 429
        ? 429
        : providerError.status === 402
          ? 402
          : 502;
    return res.status(status).json({ error: getUserFacingProviderError(error) });
  }
});

export default router;
