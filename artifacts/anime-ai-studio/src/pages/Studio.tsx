import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Settings, ChevronRight, X, Download, Sparkles, AlertTriangle, RotateCcw, Clock, Video } from "lucide-react";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { CharacterSelector } from "@/components/CharacterSelector";
import { CharacterPortrait } from "@/components/CharacterPortrait";
import { GlobalInputBar } from "@/components/GlobalInputBar";
import { useLocation } from "wouter";
import { useCreateConversation } from "@workspace/api-client-react";
import { toast } from "sonner";

const FEATURES = [
  {
    id: "script",
    label: "Script for Social Media Content",
    desc: "Video script, title, description, tags sab milega",
    emoji: "📝",
    mode: "script",
    color: "#00f2ff",
    glow: "rgba(0,242,255,0.15)",
  },
  {
    id: "friend",
    label: "Talking with AI Friend",
    desc: "Casual baat, kuch bhi poocho",
    emoji: "💬",
    mode: "friend",
    color: "#9333ea",
    glow: "rgba(147,51,234,0.15)",
  },
  {
    id: "create",
    label: "Create and Edit",
    desc: "Image banao ya photo edit karo",
    emoji: "🎨",
    mode: "create",
    color: "#f97316",
    glow: "rgba(249,115,22,0.15)",
    isPage: true,
    page: "/create-edit",
  },
  {
    id: "video-gen",
    label: "AI Video Generation",
    desc: "Prompt se AI video banao — sabke liye available",
    emoji: "🎬",
    mode: "video-gen",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.15)",
  },
  {
    id: "writing",
    label: "Writing",
    desc: "Story, letter, notice, application — kuch bhi likhvao",
    emoji: "✍️",
    mode: "writing",
    color: "#10b981",
    glow: "rgba(16,185,129,0.15)",
  },
  {
    id: "learn",
    label: "Help to Learn",
    desc: "Padhaai, topics, questions — sab samjhao",
    emoji: "🎓",
    mode: "learn",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.15)",
  },
  {
    id: "workspace",
    label: "Scripto AI Workspace",
    desc: "Chat, writing, live search, files, images, video aur learning — sab ek jagah",
    emoji: "✨",
    mode: "chat",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.18)",
  },
];

interface SelectedCharacter {
  id: string;
  name: string;
  series: string;
  emoji: string;
}

type VideoAspectRatio = "16:9" | "9:16";
type VideoDuration = 4 | 6 | 8;

interface GeneratedVideo {
  videoUrl: string;
  expiresInSeconds: number;
  model: string;
  settings: {
    aspectRatio: string;
    durationSeconds: number;
  };
}

export function StudioPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<SelectedCharacter | null>(null);
  const [videoWorkspaceOpen, setVideoWorkspaceOpen] = useState(false);
  const [, setLocation] = useLocation();
  const createConversation = useCreateConversation();

  function handleFeatureClick(feat: typeof FEATURES[0]) {
    if (feat.id === "video-gen") {
      setVideoWorkspaceOpen(true);
      return;
    }
    if ((feat as { isComingSoon?: boolean }).isComingSoon) {
      toast.info(`${feat.label} — Coming Soon! 🚀`, { description: "Yeh feature jald hi aayega" });
      return;
    }
    if (feat.isPage) { setLocation((feat as { page: string }).page); return; }
    const charId = selectedCharacter?.id || "default";
    const charName = selectedCharacter?.name || "AI Assistant";
    const charSeries = selectedCharacter?.series || "General";
    createConversation.mutate(
      { data: { characterId: charId, characterName: charName, animeSeries: charSeries, mode: feat.mode, title: `${charName} — ${feat.label}` } },
      { onSuccess: (conv) => setLocation(`/chat/${conv.id}`) },
    );
  }

  return (
    <div className="min-h-screen pb-28 relative overflow-hidden" style={{ background: "#060608" }}>

      {/* ── Animated Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">

        {/* Base radial glow — top center */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />

        {/* Bottom right glow */}
        <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00f2ff 0%, transparent 70%)" }} />

        {/* Left glow */}
        <div className="absolute top-1/2 -left-24 w-[300px] h-[300px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #9333ea 0%, transparent 70%)" }} />

        {/* Anime-style energy lines */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px opacity-10"
            style={{
              top: `${15 + i * 14}%`,
              left: 0,
              right: 0,
              background: `linear-gradient(90deg, transparent, ${i % 2 === 0 ? "#7c3aed" : "#00f2ff"}, transparent)`,
            }}
            animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.04, 0.14, 0.04] }}
            transition={{ duration: 4 + i * 0.7, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
          />
        ))}

        {/* Floating particles */}
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? "3px" : "2px",
              height: i % 3 === 0 ? "3px" : "2px",
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 23 + 10) % 90}%`,
              background: i % 2 === 0 ? "#7c3aed" : "#00f2ff",
            }}
            animate={{
              y: [-8, 8, -8],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.4, 1],
            }}
            transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: (i * 0.4) % 3, ease: "easeInOut" }}
          />
        ))}

        {/* Floating character emojis in background */}
        {[
          { emoji: "⚡", x: "82%", y: "8%", size: 48, delay: 0 },
          { emoji: "🗡️", x: "5%", y: "18%", size: 36, delay: 0.5 },
          { emoji: "🔥", x: "90%", y: "40%", size: 40, delay: 1 },
          { emoji: "💫", x: "12%", y: "55%", size: 32, delay: 1.5 },
          { emoji: "🌀", x: "75%", y: "68%", size: 44, delay: 0.8 },
          { emoji: "⚔️", x: "3%", y: "78%", size: 36, delay: 1.2 },
          { emoji: "🕷️", x: "88%", y: "85%", size: 38, delay: 0.3 },
          { emoji: "👁️", x: "50%", y: "5%", size: 30, delay: 1.8 },
        ].map((item, i) => (
          <motion.div
            key={`char-${i}`}
            className="absolute pointer-events-none select-none"
            style={{ left: item.x, top: item.y, fontSize: item.size, opacity: 0.06 }}
            animate={{ y: [-6, 6, -6], rotate: [-5, 5, -5], opacity: [0.04, 0.09, 0.04] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
          >
            {item.emoji}
          </motion.div>
        ))}

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(147,51,234,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.5) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b border-purple-900/20 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(6,6,8,0.85)" }}>
        <button
          onClick={() => setHistoryOpen(true)}
          className="w-9 h-9 rounded-xl hover:bg-purple-900/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <MoreHorizontal size={20} />
        </button>

        <div className="flex items-center gap-2">
          <motion.div
            animate={{ boxShadow: ["0 0 8px #7c3aed", "0 0 16px #00f2ff", "0 0 8px #7c3aed"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center"
          >
            <span className="text-white text-xs font-black">AI</span>
          </motion.div>
          <span className="text-white font-bold text-sm tracking-wide">AI Character Studio</span>
        </div>

        <button
          onClick={() => setLocation("/settings")}
          className="w-9 h-9 rounded-xl hover:bg-purple-900/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* ── Hero banner (when character selected) ── */}
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(0,242,255,0.1) 100%)", border: "1px solid rgba(147,51,234,0.3)" }}
        >
          <div className="flex items-center gap-4 p-4">
            <CharacterPortrait
              id={selectedCharacter.id}
              name={selectedCharacter.name}
              emoji={selectedCharacter.emoji}
              className="h-16 w-16 rounded-2xl"
            />
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base">{selectedCharacter.name}</div>
              <div className="text-purple-300 text-xs">{selectedCharacter.series} • Active</div>
              <div className="flex items-center gap-1 mt-1">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                <span className="text-emerald-400 text-xs">Ready to chat</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCharacter(null)}
              className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0"
            >
              <X size={13} />
            </button>
          </div>
          {/* Accent line */}
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #7c3aed, #00f2ff, transparent)" }} />
        </motion.div>
      )}

      {/* ── Options List ── */}
      <div className="relative z-10 px-4 pt-4 space-y-2.5">

        {/* Select Assistant Voice */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectorOpen(true)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left"
          style={{
            background: selectedCharacter ? "rgba(124,58,237,0.12)" : "rgba(13,13,13,0.9)",
            border: `1px solid ${selectedCharacter ? "rgba(147,51,234,0.5)" : "rgba(147,51,234,0.2)"}`,
            borderLeft: "3px solid #a855f7",
          }}
        >
          {selectedCharacter ? (
            <CharacterPortrait
              id={selectedCharacter.id}
              name={selectedCharacter.name}
              emoji={selectedCharacter.emoji}
              className="h-12 w-12 rounded-xl"
            />
          ) : (
            <span className="text-2xl flex-shrink-0">🎭</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold">
              {selectedCharacter ? selectedCharacter.name : "Select Assistant Voice"}
            </div>
            <div className="text-xs mt-0.5" style={{ color: selectedCharacter ? "#a78bfa" : "#4b5563" }}>
              {selectedCharacter ? selectedCharacter.series : "Character choose karo (optional)"}
            </div>
          </div>
          {selectedCharacter ? (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedCharacter(null); }}
              className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 hover:text-white flex-shrink-0"
            >
              <X size={12} />
            </button>
          ) : (
            <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
          )}
        </motion.button>

        {/* Feature Buttons */}
        {FEATURES.map((feat, i) => {
          const isComingSoon = !!(feat as { isComingSoon?: boolean }).isComingSoon;
          return (
            <motion.button
              key={feat.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 1) * 0.07 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFeatureClick(feat)}
              disabled={createConversation.isPending}
              className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left disabled:opacity-50"
              data-testid={`button-feature-${feat.id}`}
              style={{
                background: isComingSoon ? "rgba(10,10,10,0.7)" : "rgba(13,13,13,0.9)",
                border: isComingSoon ? `1px solid ${feat.color}30` : "1px solid rgba(255,255,255,0.06)",
                borderLeft: `3px solid ${feat.color}`,
                opacity: isComingSoon ? 0.75 : 1,
              }}
            >
              <span className="text-2xl flex-shrink-0">{feat.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold">{feat.label}</span>
                  {isComingSoon && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${feat.color}25`, color: feat.color, border: `1px solid ${feat.color}50` }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
                <div className="text-gray-500 text-xs mt-0.5">{isComingSoon ? "Jald hi aayega — stay tuned! 🚀" : feat.desc}</div>
              </div>
              <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {videoWorkspaceOpen && (
        <AIVideoGenerationWorkspace onClose={() => setVideoWorkspaceOpen(false)} />
      )}

      {/* Overlays */}
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <CharacterSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(char) => setSelectedCharacter(char)}
      />

      {/* Bottom Input Bar */}
      <GlobalInputBar
        selectedCharacter={selectedCharacter}
        onCharacterNeeded={() => setSelectorOpen(true)}
      />
    </div>
  );
}

function AIVideoGenerationWorkspace({ onClose }: { onClose: () => void }) {
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
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 mx-4 mt-5 overflow-hidden rounded-3xl border border-pink-400/30 bg-[#100b15]/95 shadow-2xl shadow-pink-950/20"
      data-testid="workspace-video-generation"
    >
      <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-pink-300">
              <Video size={13} />
              Free video workspace
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">AI Video Generation</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">
              Describe the moment. The generator will return a short video preview ready to download.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-400 transition-colors hover:border-pink-400/40 hover:text-white"
            aria-label="Close AI video workspace"
            data-testid="button-close-video-workspace"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void generateVideo();
          }}
          data-testid="form-video-generation"
        >
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="video-prompt" className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
                Scene prompt
              </label>
              <span className="text-[11px] text-gray-600" data-testid="text-video-prompt-hint">Be specific about movement and mood</span>
            </div>
            <textarea
              id="video-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={1200}
              placeholder="A moonlit rooftop in Tokyo, cherry petals lifting as a lone heroine turns toward the city lights..."
              rows={4}
              className="w-full resize-none rounded-2xl border border-pink-400/20 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-gray-600 focus:border-pink-400/60 focus:ring-1 focus:ring-pink-400/30"
              data-testid="input-video-prompt"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">Aspect ratio</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["16:9", "9:16"] as VideoAspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    aria-pressed={aspectRatio === ratio}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      aspectRatio === ratio
                        ? "border-pink-400/70 bg-pink-500/15 text-pink-200"
                        : "border-white/10 bg-black/20 text-gray-500 hover:border-white/25 hover:text-gray-300"
                    }`}
                    data-testid={`button-aspect-${ratio.replace(":", "-")}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">Duration</legend>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[210px]">
                {([4, 6, 8] as VideoDuration[]).map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setDurationSeconds(duration)}
                    aria-pressed={durationSeconds === duration}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                      durationSeconds === duration
                        ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-black/20 text-gray-500 hover:border-white/25 hover:text-gray-300"
                    }`}
                    data-testid={`button-duration-${duration}`}
                  >
                    {duration}s
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-950/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="button-generate-video"
          >
            <Sparkles size={16} />
            {isGenerating ? "Generating your scene..." : "Generate video"}
          </button>
        </form>

        {isGenerating && (
          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4" data-testid="status-video-generating">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-cyan-200">Rendering cinematic frames</span>
              <span className="text-cyan-300/70">This can take a moment</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cyan-950/70">
              <motion.div
                className="h-full w-full origin-left rounded-full bg-gradient-to-r from-cyan-400 to-pink-400"
                animate={{ scaleX: [0.12, 0.82, 0.28] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}

        {error && !isGenerating && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/[0.07] p-4" data-testid="status-video-error">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-rose-300" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-rose-200">Generation interrupted</div>
              <p className="mt-1 text-xs leading-5 text-rose-100/65" data-testid="text-video-error">{error}</p>
              <button
                type="button"
                onClick={() => void generateVideo()}
                className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-rose-200 transition-colors hover:text-white"
                data-testid="button-retry-video"
              >
                <RotateCcw size={13} />
                Retry generation
              </button>
            </div>
          </div>
        )}

        {generatedVideo && (
          <div className="mt-6 border-t border-white/10 pt-5" data-testid="section-video-result">
            {videoExpired ? (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5" data-testid="status-video-expired">
                <div className="flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 flex-shrink-0 text-amber-300" />
                  <div>
                    <div className="text-sm font-semibold text-amber-100">This preview link has expired</div>
                    <p className="mt-1 text-xs leading-5 text-amber-100/60">Generate a fresh preview to continue watching or downloading this scene.</p>
                    <button
                      type="button"
                      onClick={() => void generateVideo()}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300/30 px-3 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-300/10"
                      data-testid="button-regenerate-expired-video"
                    >
                      <RotateCcw size={13} />
                      Generate again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Generation complete</div>
                    <div className="mt-1 text-sm text-gray-400" data-testid="text-video-settings">
                      {generatedVideo.settings.aspectRatio} · {generatedVideo.settings.durationSeconds}s
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-600" data-testid="text-video-model">
                    Model · {generatedVideo.model}
                  </div>
                </div>
                <video
                  src={generatedVideo.videoUrl}
                  controls
                  playsInline
                  onError={() => setVideoExpired(true)}
                  className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-contain"
                  data-testid="video-generated-preview"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-gray-600" data-testid="status-video-expiry">
                    <Clock size={13} />
                    Preview URL expires in {generatedVideo.expiresInSeconds > 0 ? `${generatedVideo.expiresInSeconds}s` : "a limited time"}
                  </div>
                  <a
                    href={generatedVideo.videoUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] px-3 py-2 text-xs font-bold text-cyan-200 transition-colors hover:border-cyan-300/60 hover:bg-cyan-400/[0.14]"
                    data-testid="link-download-video"
                  >
                    <Download size={14} />
                    Download video
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}
