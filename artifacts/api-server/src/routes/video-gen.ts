import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { getUserId } from "../lib/auth";
import {
  getGeminiKeyCandidates,
  getGeminiKeyCount,
  markGeminiKeyFailure,
} from "../lib/geminiKeys";

const router: IRouter = Router();

const VIDEO_MODELS = [
  process.env.GEMINI_VIDEO_MODEL,
  "veo-3.1-generate-preview",
  "veo-3.0-generate-001",
].filter((model, index, models): model is string => Boolean(model) && models.indexOf(model) === index);

const VIDEO_TTL_MS = 15 * 60 * 1000;
const MAX_PROMPT_LENGTH = 1_200;
const videos = new Map<string, { userId: string; data: Buffer; mimeType: string; expiresAt: number }>();

function cleanupExpiredVideos() {
  const now = Date.now();
  for (const [id, video] of videos) {
    if (video.expiresAt <= now) videos.delete(id);
  }
}

function getErrorMessage(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "error" in value) {
    const error = (value as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string") return error.message;
  }
  return fallback;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, any>>;
}

async function waitForVideoOperation(operationName: string, apiKey: string): Promise<Record<string, any>> {
  const operationUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${encodeURIComponent(apiKey)}`;

  for (let attempt = 0; attempt < 45; attempt += 1) {
    const response = await fetch(operationUrl);
    const data = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(data, `Video status check failed (${response.status})`));
    }
    if (data.done) {
      if (data.error) throw new Error(getErrorMessage(data, "The video provider could not complete this request."));
      return data.response ?? data;
    }
    await new Promise((resolve) => setTimeout(resolve, 4_000));
  }

  throw new Error("Video generation timed out. Please try again with a shorter or simpler prompt.");
}

async function fetchGeneratedVideo(uri: string, apiKey: string) {
  const separator = uri.includes("?") ? "&" : "?";
  const response = await fetch(`${uri}${separator}key=${encodeURIComponent(apiKey)}`);
  if (!response.ok) {
    const data = await readJson(response);
    throw new Error(getErrorMessage(data, `Video download failed (${response.status})`));
  }
  return {
    data: Buffer.from(await response.arrayBuffer()),
    mimeType: response.headers.get("content-type")?.split(";")[0] || "video/mp4",
  };
}

function findVideoUri(operation: Record<string, any>) {
  const samples = [
    ...(operation?.generateVideoResponse?.generatedSamples ?? []),
    ...(operation?.generateVideoResponse?.generatedVideos ?? []),
    ...(operation?.generatedVideos ?? []),
  ];
  return samples.find((sample: any) => typeof sample?.video?.uri === "string")?.video?.uri as string | undefined;
}

router.post("/generate-video", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }

  const { prompt, aspectRatio = "16:9", durationSeconds = 8 } = req.body ?? {};
  if (typeof prompt !== "string" || prompt.trim().length < 3) {
    res.status(400).json({ error: "Enter a video prompt with at least 3 characters." });
    return;
  }
  if (prompt.trim().length > MAX_PROMPT_LENGTH) {
    res.status(400).json({ error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` });
    return;
  }
  if (!["16:9", "9:16"].includes(aspectRatio)) {
    res.status(400).json({ error: "aspectRatio must be 16:9 or 9:16." });
    return;
  }
  if (![4, 6, 8].includes(Number(durationSeconds))) {
    res.status(400).json({ error: "durationSeconds must be 4, 6, or 8." });
    return;
  }

  if (getGeminiKeyCount() === 0) {
    res.status(503).json({ error: "AI video generation is not configured yet." });
    return;
  }

  let lastError = "The video provider could not start this request.";
  const keyCandidates = getGeminiKeyCandidates();
  for (let keyIndex = 0; keyIndex < keyCandidates.length; keyIndex += 1) {
    const apiKey = keyCandidates[keyIndex].key;
    for (let modelIndex = 0; modelIndex < VIDEO_MODELS.length; modelIndex += 1) {
      const model = VIDEO_MODELS[modelIndex];
      try {
        const startResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: prompt.trim() }],
              parameters: {
                aspectRatio,
                durationSeconds: Number(durationSeconds),
                sampleCount: 1,
              },
            }),
          },
        );
        const startData = await readJson(startResponse);
        if (!startResponse.ok) {
          lastError = getErrorMessage(startData, `Video provider rejected the request (${startResponse.status}).`);
          if ([401, 403, 408, 429, 500, 502, 503, 504].includes(startResponse.status)) {
            markGeminiKeyFailure(apiKey, startResponse.status);
          }
          if ([401, 403, 429, 500, 503].includes(startResponse.status)) break;
          continue;
        }

        const operationName = startData.name;
        if (typeof operationName !== "string") {
          lastError = "The video provider returned an invalid operation.";
          continue;
        }

        const operation = await waitForVideoOperation(operationName, apiKey);
        const uri = findVideoUri(operation);
        if (!uri) throw new Error("The provider completed without returning a video.");

        const generated = await fetchGeneratedVideo(uri, apiKey);
        cleanupExpiredVideos();
        const id = randomUUID();
        videos.set(id, {
          userId,
          data: generated.data,
          mimeType: generated.mimeType,
          expiresAt: Date.now() + VIDEO_TTL_MS,
        });

        res.json({
          videoUrl: `/api/generated-videos/${id}`,
          expiresInSeconds: VIDEO_TTL_MS / 1000,
          model,
          settings: { aspectRatio, durationSeconds: Number(durationSeconds) },
        });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "The video provider failed unexpectedly.";
        req.log.warn({ err: error, model, keyIndex }, "Video generation attempt failed");
        if (modelIndex === VIDEO_MODELS.length - 1 && keyIndex < keyCandidates.length - 1) continue;
      }
    }
  }

  req.log.error({ message: lastError }, "Video generation failed");
  res.status(502).json({ error: lastError });
});

router.get("/generated-videos/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required" });
    return;
  }

  cleanupExpiredVideos();
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const video = videos.get(id);
  if (!video || video.userId !== userId) {
    res.status(404).json({ error: "Video not found or expired." });
    return;
  }

  res.setHeader("Content-Type", video.mimeType);
  res.setHeader("Content-Length", video.data.length);
  res.setHeader("Cache-Control", "private, max-age=900");
  res.send(video.data);
});

export default router;