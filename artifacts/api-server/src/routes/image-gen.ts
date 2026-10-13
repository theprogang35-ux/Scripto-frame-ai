import { Router } from "express";
import { getUserId } from "../lib/auth";
import { generateFluxImage, getUserFacingProviderError } from "../lib/externalAiProviders";

const router = Router();

const SIZE_PROMPTS: Record<string, string> = {
  square: "square 1:1 aspect ratio",
  portrait: "portrait 3:4 aspect ratio",
  landscape: "landscape 4:3 aspect ratio",
  wide: "wide 16:9 cinematic aspect ratio",
};

const SIZE_ASPECT_RATIOS: Record<string, string> = {
  square: "1:1",
  portrait: "3:4",
  landscape: "4:3",
  wide: "16:9",
};

router.post("/generate-image", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { description, referenceImage, size = "square", style = "anime" } = req.body;
  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "description required" });
  }
  if (referenceImage !== undefined && (
    typeof referenceImage !== "string"
    || !/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i.test(referenceImage)
  )) {
    return res.status(400).json({ error: "referenceImage must be a valid image data URL" });
  }
  if (typeof referenceImage === "string" && referenceImage.length > 9_000_000) {
    return res.status(413).json({ error: "Reference photo is too large. Please choose a smaller photo." });
  }

  const sizeHint = SIZE_PROMPTS[size] || SIZE_PROMPTS.square;
  const styleHint =
    style === "anime"
      ? "anime art style, vibrant colors, detailed illustration, manga-inspired"
      : style === "realistic"
      ? "photorealistic, hyper-detailed, cinematic lighting"
      : "digital art, concept art style";

  const fullPrompt = referenceImage
    ? `Use the attached photo as the main visual reference. Follow this instruction exactly: ${description}. Preserve important subject details unless the instruction asks to change them. ${styleHint}, ${sizeHint}, high quality, masterpiece`
    : `${description}. ${styleHint}, ${sizeHint}, high quality, masterpiece`;

  try {
    const generated = await generateFluxImage(
      fullPrompt,
      SIZE_ASPECT_RATIOS[size] || SIZE_ASPECT_RATIOS.square,
      typeof referenceImage === "string" ? referenceImage : undefined,
    );
    return res.json(generated);
  } catch (err) {
    const status = (err as { status?: number; code?: string } | null)?.status;
    const code = (err as { code?: string } | null)?.code;
    const message = err instanceof Error ? err.message : "Image generation request failed";
    console.error("OpenRouter image generation error:", { status, message });
    const httpStatus = code === "missing_api_key" ? 503 : status === 429 ? 429 : 502;
    return res.status(httpStatus).json({ error: getUserFacingProviderError(err) });
  }
});

export default router;
