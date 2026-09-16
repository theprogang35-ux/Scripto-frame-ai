import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MoreHorizontal, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useGetConversation, getGetConversationQueryKey } from "@workspace/api-client-react";
import { GlobalInputBar } from "@/components/GlobalInputBar";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { CHARACTER_EMOJI, CHARACTER_COLORS, MODES } from "@/data/characters";
import { toast } from "sonner";
import type { ChatAttachment } from "@/types/chat";

interface LocalMessage {
  id: number;
  role: string;
  content: string;
  conversationId: number;
  createdAt: string;
  imageUrl: string | null;
  isStreaming?: boolean;
}

function playBrowserVoice(
  text: string,
  onStart: () => void,
  onEnd: () => void,
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 1_500));
    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.onstart = onStart;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function ChatPage() {
  const params = useParams<{ conversationId: string }>();
  const convId = Number(params.conversationId);
  const [, setLocation] = useLocation();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [playingMsgId, setPlayingMsgId] = useState<number | null>(null);
  const [loadingTTSId, setLoadingTTSId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: conv, isLoading } = useGetConversation(convId, {
    query: { enabled: !!convId, queryKey: getGetConversationQueryKey(convId) },
  });

  useEffect(() => {
    if (conv && !initialized) {
      setLocalMessages(
        conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          conversationId: m.conversationId,
          createdAt: m.createdAt,
          imageUrl: m.imageUrl ?? null,
        })),
      );
      setInitialized(true);
    }
  }, [conv, initialized]);

  useEffect(() => {
    if (!conv || !initialized) return;
    try {
      const pending = sessionStorage.getItem("scripto-pending-message");
      if (!pending) return;
      const parsed = JSON.parse(pending) as {
        text?: string;
        attachment?: ChatAttachment;
        liveSearch?: boolean;
      };
      sessionStorage.removeItem("scripto-pending-message");
      if (parsed.text) {
        void sendMessage(parsed.text, parsed.attachment, parsed.liveSearch);
      }
    } catch {
      sessionStorage.removeItem("scripto-pending-message");
    }
  }, [conv, initialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  async function playTTS(msg: LocalMessage) {
    if (!conv) return;

    // Stop if already playing this message
    if (playingMsgId === msg.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      window.speechSynthesis?.cancel();
      setPlayingMsgId(null);
      return;
    }

    // Stop any current audio
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlayingMsgId(null);

    setLoadingTTSId(msg.id);
    try {
      const useBrowserFallback = () => {
        const started = playBrowserVoice(
          msg.content,
          () => setPlayingMsgId(msg.id),
          () => setPlayingMsgId(null),
        );
        if (started) {
          toast.info("AI voice limit reached, browser voice is playing.");
        } else {
          toast.error("Voice unavailable. Please try again later.");
        }
        return started;
      };

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.content, characterId: conv.characterId }),
      });

      if (!response.ok) {
        useBrowserFallback();
        return;
      }

      const blob = await response.blob();
      if (!blob.size || !blob.type.startsWith("audio/")) {
        useBrowserFallback();
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingMsgId(msg.id);
      audio.onended = () => {
        setPlayingMsgId(null);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setPlayingMsgId(null);
        URL.revokeObjectURL(url);
        useBrowserFallback();
      };
      await audio.play();
    } catch {
      const started = playBrowserVoice(
        msg.content,
        () => setPlayingMsgId(msg.id),
        () => setPlayingMsgId(null),
      );
      if (started) toast.info("AI voice unavailable, browser voice is playing.");
      else toast.error("Voice unavailable. Please try again later.");
    } finally {
      setLoadingTTSId(null);
    }
  }

  async function sendMessage(text: string, attachment?: ChatAttachment, liveSearch = false) {
    if (isStreaming || !conv) return;

    const userMsg: LocalMessage = {
      id: Date.now(),
      role: "user",
      content: text,
      conversationId: convId,
      createdAt: new Date().toISOString(),
      imageUrl: null,
    };

    const aiMsg: LocalMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
      conversationId: convId,
      createdAt: new Date().toISOString(),
      imageUrl: null,
      isStreaming: true,
    };

    setLocalMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          characterId: conv.characterId,
          characterName: conv.characterName,
          animeSeries: conv.animeSeries,
          mode: conv.mode,
            imageUrl: attachment?.dataUrl || null,
            liveSearch,
          adultMode: localStorage.getItem("adultMode") === "true",
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        toast.error("Failed to get response");
        setLocalMessages((prev) => prev.filter((m) => m.id !== aiMsg.id));
        setIsStreaming(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsStreaming(false);
              setLocalMessages((prev) =>
                prev.map((m) => (m.id === aiMsg.id ? { ...m, isStreaming: false } : m)),
              );
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                aiContent += parsed.content;
                const captured = aiContent;
                setLocalMessages((prev) =>
                  prev.map((m) => (m.id === aiMsg.id ? { ...m, content: captured } : m)),
                );
              }
              if (parsed.error) {
                toast.error("AI error: " + parsed.error);
              }
            } catch {}
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Connection error. Try again.");
      }
    } finally {
      setIsStreaming(false);
    }
  }

  const modeInfo = MODES.find((m) => m.id === conv?.mode);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-900/30 animate-pulse" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Conversation not found</p>
          <button onClick={() => setLocation("/studio")} className="text-purple-400 hover:text-purple-300">
            Back to Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl border-b border-purple-900/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/studio")}
          className="w-9 h-9 rounded-xl hover:bg-purple-900/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl border-2"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${CHARACTER_COLORS[conv.characterId]?.from || "#7c3aed"}, ${CHARACTER_COLORS[conv.characterId]?.to || "#1e1b4b"})`,
              borderColor: CHARACTER_COLORS[conv.characterId]?.from || "#7c3aed",
              boxShadow: `0 0 12px ${CHARACTER_COLORS[conv.characterId]?.glow || "rgba(147,51,234,0.4)"}`,
            }}
          >
            {CHARACTER_EMOJI[conv.characterId] || "🤖"}
          </div>
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">{conv.characterName}</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs truncate">{conv.animeSeries}</span>
              {modeInfo && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${modeInfo.color}20`, color: modeInfo.color }}>
                  {modeInfo.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setHistoryOpen(true)}
          className="w-9 h-9 rounded-xl hover:bg-purple-900/20 flex items-center justify-center text-gray-400 flex-shrink-0"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-4">
        {localMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-16 text-center"
          >
            <div className="text-5xl mb-4">{CHARACTER_EMOJI[conv.characterId] || "🤖"}</div>
            <h3 className="text-white font-bold text-lg mb-1">{conv.characterName}</h3>
            <p className="text-gray-500 text-sm">Start the conversation!</p>
          </motion.div>
        )}

        <AnimatePresence>
          {localMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-base flex-shrink-0 mb-1">
                    {CHARACTER_EMOJI[conv.characterId] || "🤖"}
                  </div>
                  <div>
                    <div className="text-purple-400 text-xs font-medium mb-1 ml-1">{conv.characterName}</div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#0d0d0d] border border-purple-900/30 text-white text-sm leading-relaxed">
                      {msg.isStreaming && !msg.content ? (
                        <div className="flex gap-1 items-center h-5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 rounded-full bg-purple-400"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                    {/* TTS Button — shown only after message is complete */}
                    {!msg.isStreaming && msg.content && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => playTTS(msg)}
                        disabled={loadingTTSId === msg.id}
                        className="mt-1 ml-1 flex items-center gap-1 text-xs text-gray-500 hover:text-purple-400 transition-colors"
                      >
                        {loadingTTSId === msg.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : playingMsgId === msg.id ? (
                          <VolumeX size={12} />
                        ) : (
                          <Volume2 size={12} />
                        )}
                        <span>{loadingTTSId === msg.id ? "Loading..." : playingMsgId === msg.id ? "Stop" : "Listen"}</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              )}

              {msg.role === "user" && (
                <div className="max-w-[80%] space-y-2 rounded-2xl rounded-br-sm bg-gradient-to-br from-purple-600 to-purple-700 px-4 py-3 text-sm leading-relaxed text-white">
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Attached file" className="max-h-56 max-w-full rounded-xl object-contain" />
                  )}
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <GlobalInputBar
        conversationId={convId}
        onSendMessage={sendMessage}
        selectedCharacter={{ id: conv.characterId, name: conv.characterName, series: conv.animeSeries }}
      />
    </div>
  );
}
