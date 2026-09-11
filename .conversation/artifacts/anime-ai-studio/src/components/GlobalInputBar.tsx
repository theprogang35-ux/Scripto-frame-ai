import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Monitor, Send, Image, Video, FileText, X } from "lucide-react";
import { useLocation } from "wouter";
import { useCreateConversation } from "@workspace/api-client-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

interface GlobalInputBarProps {
  selectedCharacter?: {
    id: string;
    name: string;
    series: string;
  } | null;
  onCharacterNeeded?: () => void;
  conversationId?: number;
  onSendMessage?: (text: string) => void;
}

export function GlobalInputBar({ selectedCharacter, onCharacterNeeded, conversationId, onSendMessage }: GlobalInputBarProps) {
  const [text, setText] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [, setLocation] = useLocation();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const createConversation = useCreateConversation();

  async function handleScreenCapture() {
    try {
      await navigator.mediaDevices.getDisplayMedia({ video: true });
      toast.success("Screen captured! Ready to share with AI.");
    } catch {
      toast.error("Screen capture cancelled.");
    }
  }

  function handleSend() {
    if (!text.trim()) return;

    if (conversationId && onSendMessage) {
      onSendMessage(text.trim());
      setText("");
      return;
    }

    const charId = selectedCharacter?.id || "default";
    const charName = selectedCharacter?.name || "AI Assistant";
    const charSeries = selectedCharacter?.series || "General";

    createConversation.mutate(
      {
        data: {
          characterId: charId,
          characterName: charName,
          animeSeries: charSeries,
          mode: "chat",
          title: `${charName} — Chat`,
        },
      },
      {
        onSuccess: (conv) => {
          setLocation(`/chat/${conv.id}`);
          setText("");
        },
        onError: () => {
          toast.error("Failed to start conversation.");
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      <AnimatePresence>
        {uploadOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setUploadOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-24 left-4 right-4 bg-[#0d0d0d] border border-purple-900/40 rounded-2xl p-4 z-40 shadow-2xl shadow-purple-900/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-semibold">Upload</span>
                <button onClick={() => setUploadOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => { photoRef.current?.click(); setUploadOpen(false); }}
                  data-testid="btn-upload-photo"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#111] border border-purple-900/20 hover:border-purple-600/40 transition-all"
                >
                  <Image size={22} className="text-purple-400" />
                  <span className="text-gray-300 text-xs">Photo</span>
                </button>
                <button
                  onClick={() => { videoRef.current?.click(); setUploadOpen(false); }}
                  data-testid="btn-upload-video"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#111] border border-purple-900/20 hover:border-purple-600/40 transition-all"
                >
                  <Video size={22} className="text-cyan-400" />
                  <span className="text-gray-300 text-xs">Video</span>
                </button>
                <button
                  onClick={() => { docRef.current?.click(); setUploadOpen(false); }}
                  data-testid="btn-upload-doc"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#111] border border-purple-900/20 hover:border-purple-600/40 transition-all"
                >
                  <FileText size={22} className="text-emerald-400" />
                  <span className="text-gray-300 text-xs">Document</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={() => toast.success("Photo uploaded!")} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={() => toast.success("Video uploaded!")} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={() => toast.success("Document uploaded!")} />

      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-2 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none">
        <motion.div
          animate={{ boxShadow: text ? "0 0 30px rgba(147,51,234,0.4)" : "0 0 15px rgba(147,51,234,0.15)" }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 bg-[#0d0d0d] border border-purple-900/40 rounded-2xl px-3 py-2.5 pointer-events-auto"
        >
          <button
            onClick={() => setUploadOpen(!uploadOpen)}
            data-testid="btn-upload-plus"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-purple-900/20 transition-colors flex-shrink-0"
          >
            <Plus size={18} className="text-purple-400" />
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or pick a character..."
            data-testid="input-global-message"
            className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-600 text-sm min-w-0"
          />

          {text.trim() ? (
            <button
              onClick={handleSend}
              data-testid="btn-send-message"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-600 hover:bg-purple-500 transition-colors flex-shrink-0"
            >
              <Send size={14} className="text-white" />
            </button>
          ) : (
            <button
              onClick={handleScreenCapture}
              data-testid="btn-screen-capture"
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-cyan-900/20 transition-colors flex-shrink-0"
            >
              <Monitor size={18} className="text-cyan-400" />
            </button>
          )}
        </motion.div>
      </div>
    </>
  );
}
