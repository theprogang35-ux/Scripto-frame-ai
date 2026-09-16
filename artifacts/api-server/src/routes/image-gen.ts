import { Router } from "express";
import { getUserId } from "../lib/auth";
import {
  getGeminiKeyCandidates,
  getGeminiKeyCount,
  markGeminiKeyFailure,
} from "../lib/geminiKeys";

const router = Router();

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

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
  return typeof message === "string" ? message : `Image provider request failed (${status})`;
}

function userFacingProviderError(data: Record<string, any>, status: number) {
  const message = providerError(data, status);
  if (status === 429 || /quota|rate limit|limit:\s*0/i.test(message)) {
    return "Gemini image quota is unavailable for this project. Add billing or use a Gemini project with image generation enabled.";
  }
  if (status === 401 || status === 403) {
    return "The Gemini key cannot access image generation. Check its project permissions and billing.";
  }
  return message;
}

function isRetryable(status: number) {
  return [401, 403, 408, 429, 500, 502, 503, 504].includes(status);
}

const SIZE_PROMPTS: Record<string, string> = {
  square: "square 1:1 aspect ratio",
  portrait: "portrait 3:4 aspect ratio",
  landscape: "landscape 4:3 aspect ratio",
  wide: "wide 16:9 cinematic aspect ratio",
};

router.post("/generate-image", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { description, size = "square", style = "anime" } = req.body;
  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "description required" });
  }

  const sizeHint = SIZE_PROMPTS[size] || SIZE_PROMPTS.square;
  const styleHint =
    style === "anime"
      ? "anime art style, vibrant colors, detailed illustration, manga-inspired"
      : style === "realistic"
      ? "photorealistic, hyper-detailed, cinematic lighting"
      : "digital art, concept art style";

  const fullPrompt = `${description}. ${styleHint}, ${sizeHint}, high quality, masterpiece`;

  if (getGeminiKeyCount() === 0) {
    return res.status(503).json({ error: "Image generation is not configured yet." });
  }

  let lastError = "Image generation failed";
  const keyCandidates = getGeminiKeyCandidates();
  for (let attempt = 0; attempt < keyCandidates.length; attempt++) {
    const apiKey = keyCandidates[attempt].key;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
          }),
        }
      );

      if (!response.ok) {
        const err = await readJson(response);
        lastError = userFacingProviderError(err, response.status);
        if (isRetryable(response.status) && attempt < keyCandidates.length - 1) {
          markGeminiKeyFailure(apiKey, response.status);
          continue;
        }
        console.error("Image gen API error:", { status: response.status, message: lastError });
        return res.status(response.status === 429 ? 429 : 502).json({ error: lastError });
      }

      const data: any = await readJson(response);
      const parts = (data?.candidates || []).flatMap((candidate: any) => candidate?.content?.parts || []);
      const imgPart = parts.find((part: any) => {
        const inlineData = part?.inlineData || part?.inline_data;
        return typeof inlineData?.data === "string" && inlineData?.mimeType?.startsWith("image/");
      });

      if (!imgPart) {
        lastError = "The image provider returned no image. Please try a more detailed prompt.";
        console.error("No image in response", JSON.stringify(data).slice(0, 500));
        if (attempt < keyCandidates.length - 1) continue;
        return res.status(502).json({ error: lastError });
      }

      const inlineData = imgPart.inlineData || imgPart.inline_data;
      const mimeType = inlineData.mimeType;
      const b64 = inlineData.data;
      const imageUrl = `data:${mimeType};base64,${b64}`;

      return res.json({ imageUrl, mimeType });
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Image provider request failed";
      if (attempt < keyCandidates.length - 1) {
        markGeminiKeyFailure(apiKey, 502);
        continue;
      }
      console.error("Image gen error:", err);
      return res.status(502).json({ error: lastError });
    }
  }

  return res.status(502).json({ error: lastError });
});

export default router;
