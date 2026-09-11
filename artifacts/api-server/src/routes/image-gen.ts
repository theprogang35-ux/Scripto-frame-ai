import { Router } from "express";
import { getUserId } from "../lib/auth";

const router = Router();

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean) as string[];

let imgKeyIndex = 0;
function getNextKey(): string {
  if (GEMINI_KEYS.length === 0) throw new Error("No Gemini API keys configured");
  const key = GEMINI_KEYS[imgKeyIndex % GEMINI_KEYS.length];
  imgKeyIndex = (imgKeyIndex + 1) % GEMINI_KEYS.length;
  return key;
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

  for (let attempt = 0; attempt < Math.max(GEMINI_KEYS.length, 1); attempt++) {
    const apiKey = getNextKey();
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
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
        const err = await response.json().catch(() => ({}));
        if ([403, 429, 500, 503].includes(response.status) && attempt < GEMINI_KEYS.length - 1) continue;
        console.error("Image gen API error:", err);
        return res.status(500).json({ error: "Image generation failed", detail: err });
      }

      const data: any = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

      if (!imgPart) {
        console.error("No image in response", JSON.stringify(data).slice(0, 400));
        return res.status(500).json({ error: "No image in response" });
      }

      const mimeType = imgPart.inlineData.mimeType;
      const b64 = imgPart.inlineData.data;
      const imageUrl = `data:${mimeType};base64,${b64}`;

      return res.json({ imageUrl, mimeType });
    } catch (err) {
      if (attempt < GEMINI_KEYS.length - 1) continue;
      console.error("Image gen error:", err);
      return res.status(500).json({ error: "Image generation error" });
    }
  }

  return res.status(500).json({ error: "All keys failed" });
});

export default router;
