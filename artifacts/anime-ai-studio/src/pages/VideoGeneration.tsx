import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Clock, Download, RotateCcw, Sparkles, Video } from "lucide-react";
import { useLocation } from "wouter";

type VideoAspectRatio = "16:9" | "9:16";
type VideoDuration = 4 | 6 | 8;

interface GeneratedVideo {
  videoUrl: string;
  expiresInSeconds: number;
  model: string;
  settings: { aspectRatio: string; durationSeconds: number };
}

export function VideoGenerationPage() {
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("16:9");
  const [durationSeconds, setDurationSeconds] = useState<VideoDuration>(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [videoExpired, setVideoExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!generatedVideo || generatedVideo.expiresInSeconds <= 0) return;
    const timeout = window.setTimeout(() => setVideoExpired(true), generatedVideo.expiresInSeconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [generatedVideo]);

  async function generateVideo() {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError("Add a scene description before generating your video.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);
    setVideoExpired(false);
    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt, aspectRatio, durationSeconds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.videoUrl !== "string") {
        throw new Error(typeof data.error === "string" ? data.error : "The video provider could not complete this request.");
      }
      setGeneratedVideo({
        videoUrl: data.videoUrl,
        expiresInSeconds: typeof data.expiresInSeconds === "number" ? data.expiresInSeconds : Number(data.expiresInSeconds) || 0,
        model: typeof data.model === "string" ? data.model : "AI video model",
        settings: {
          aspectRatio: typeof data.settings?.aspectRatio === "string" ? data.settings.aspectRatio : aspectRatio,
          durationSeconds: typeof data.settings?.durationSeconds === "number" ? data.settings.durationSeconds : durationSeconds,
        },
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The video provider could not complete this request.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#060608] px-4 pb-16 text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40" aria-hidden="true">
        <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-cyan-500/[0.08] blur-3xl" />
        <div className="absolute inset-0 cyber-grid opacity-30" />
      </div>
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between border-b border-purple-900/25 py-4">
        <button
          type="button"
          onClick={() => setLocation("/studio")}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-purple-900/20 hover:text-white"
          data-testid="button-return-studio"
        >
          <ArrowLeft size={17} />
          Back to Studio
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300"><Video size={16} /></span>
          AI Character Studio
        </div>
        <span className="w-24 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">Scene lab</span>
      </header>

      <section className="relative z-10 mx-auto mt-9 grid w-full max-w-5xl gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <div className="pt-2">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
            <Sparkles size={12} /> From imagination to motion
          </div>
          <h1 className="max-w-md text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">Give your scene <span className="text-cyan-200">a heartbeat.</span></h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">Describe a moment, choose its frame, and turn your character idea into a short cinematic preview.</p>
          <div className="mt-7 border-l border-violet-400/30 pl-4">
            <p className="text-xs font-semibold text-gray-300">A strong prompt sets the shot</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">Name the subject, their movement, the setting, and the feeling of the light.</p>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-violet-400/25 bg-[#0f172a]/85 shadow-2xl shadow-violet-950/20 backdrop-blur-2xl"
          data-testid="workspace-video-generation"
        >
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-400" />
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300"><Video size={13} /> Video workspace</div>
            <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Build a moving scene</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">The generator returns a temporary preview link. Download it while it is available.</p>
            <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); void generateVideo(); }} data-testid="form-video-generation">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="video-prompt" className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">Scene prompt</label>
                  <span className="text-[11px] text-gray-600" data-testid="text-video-prompt-hint">Movement · mood · camera</span>
                </div>
                <textarea
                  id="video-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  maxLength={1200}
                  placeholder="A moonlit rooftop in Tokyo, cherry petals lifting as a lone heroine turns toward the city lights..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-violet-400/20 bg-[#0b0f19]/70 px-4 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/30"
                  data-testid="input-video-prompt"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">Aspect ratio</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["16:9", "9:16"] as VideoAspectRatio[]).map((ratio) => (
                      <button key={ratio} type="button" onClick={() => setAspectRatio(ratio)} aria-pressed={aspectRatio === ratio}
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${aspectRatio === ratio ? "border-violet-400/70 bg-violet-500/15 text-violet-200" : "border-white/10 bg-black/20 text-gray-500 hover:border-white/25 hover:text-gray-300"}`}
                        data-testid={`button-aspect-${ratio.replace(":", "-")}`}>{ratio}</button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">Duration</legend>
                  <div className="grid grid-cols-3 gap-2 sm:min-w-[210px]">
                    {([4, 6, 8] as VideoDuration[]).map((duration) => (
                      <button key={duration} type="button" onClick={() => setDurationSeconds(duration)} aria-pressed={durationSeconds === duration}
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${durationSeconds === duration ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-black/20 text-gray-500 hover:border-white/25 hover:text-gray-300"}`}
                        data-testid={`button-duration-${duration}`}>{duration}s</button>
                    ))}
                  </div>
                </fieldset>
              </div>
              <button type="submit" disabled={isGenerating || !prompt.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="button-generate-video">
                <Sparkles size={16} />{isGenerating ? "Generating your scene..." : "Generate video"}
              </button>
            </form>

            {isGenerating && (
              <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4" data-testid="status-video-generating">
                <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-cyan-200">Rendering cinematic frames</span><span className="text-cyan-300/70">This can take a moment</span></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cyan-950/70"><motion.div className="h-full w-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-pink-400" animate={{ scaleX: [0.12, 0.82, 0.28] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} /></div>
              </div>
            )}
            {error && !isGenerating && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/[0.07] p-4" data-testid="status-video-error">
                <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-rose-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-rose-200">Generation interrupted</div>
                  <p className="mt-1 text-xs leading-5 text-rose-100/65" data-testid="text-video-error">{error}</p>
                  <button type="button" onClick={() => void generateVideo()} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-rose-200 transition-colors hover:text-white" data-testid="button-retry-video"><RotateCcw size={13} />Retry generation</button>
                </div>
              </div>
            )}
            {generatedVideo && (
              <div className="mt-6 border-t border-white/10 pt-5" data-testid="section-video-result">
                {videoExpired ? (
                  <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5" data-testid="status-video-expired">
                    <div className="flex items-start gap-3"><Clock size={18} className="mt-0.5 flex-shrink-0 text-amber-300" /><div>
                      <div className="text-sm font-semibold text-amber-100">This preview link has expired</div>
                      <p className="mt-1 text-xs leading-5 text-amber-100/60">Generate a fresh preview to continue watching or downloading this scene.</p>
                      <button type="button" onClick={() => void generateVideo()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300/30 px-3 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-300/10" data-testid="button-regenerate-expired-video"><RotateCcw size={13} />Generate again</button>
                    </div></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Generation complete</div>
                      <div className="mt-1 text-sm text-gray-400" data-testid="text-video-settings">{generatedVideo.settings.aspectRatio} · {generatedVideo.settings.durationSeconds}s</div>
                    </div><div className="text-right text-[11px] text-gray-600" data-testid="text-video-model">Model · {generatedVideo.model}</div></div>
                    <video src={generatedVideo.videoUrl} controls playsInline onError={() => setVideoExpired(true)} className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-contain" data-testid="video-generated-preview" />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] text-gray-600" data-testid="status-video-expiry"><Clock size={13} />Preview URL expires in {generatedVideo.expiresInSeconds > 0 ? `${generatedVideo.expiresInSeconds}s` : "a limited time"}</div>
                      <a href={generatedVideo.videoUrl} download className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] px-3 py-2 text-xs font-bold text-cyan-200 transition-colors hover:border-cyan-300/60 hover:bg-cyan-400/[0.14]" data-testid="link-download-video"><Download size={14} />Download video</a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.section>
      </section>
    </main>
  );
}
