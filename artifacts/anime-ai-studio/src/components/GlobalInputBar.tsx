import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Monitor, Send, Upload, X, File as FileIcon, Globe2 } from "lucide-react";
import { useLocation } from "wouter";
import { useCreateConversation } from "@workspace/api-client-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import type { ChatAttachment } from "@/types/chat";

interface GlobalInputBarProps {
  selectedCharacter?: {
    id: string;
    name: string;
    series: string;
  } | null;
  onCharacterNeeded?: () => void;
  conversationId?: number;
  onSendMessage?: (text: string, attachment?: ChatAttachment, liveSearch?: boolean) => void;
}

export function GlobalInputBar({ selectedCharacter, onCharacterNeeded, conversationId, onSendMessage }: GlobalInputBarProps) {
  const [text, setText] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [liveSearch, setLiveSearch] = useState(false);
  const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
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
    if (!text.trim() && !attachment) return;
    const attachmentLabel = attachment ? `[Attached file: ${attachment.name}]` : "";
    const fileContext = attachment?.textContent
      ? `\n\n[File contents]\n${attachment.textContent}`
      : "";
    const messageText = [text.trim(), attachmentLabel].filter(Boolean).join("\n\n") + fileContext;

    if (conversationId && onSendMessage) {
      onSendMessage(messageText, attachment || undefined, liveSearch);
      setText("");
      setAttachment(null);
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
          if (messageText) {
            try {
              sessionStorage.setItem("scripto-pending-message", JSON.stringify({
                text: messageText,
                attachment,
                liveSearch,
              }));
            } catch {
              toast.error("Attachment could not be prepared.");
            }
          }
          setLocation(`/chat/${conv.id}`);
          setText("");
          setAttachment(null);
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

  function handleFileUpload(file: globalThis.File | undefined) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File must be smaller than 15 MB.");
      return;
    }

    const baseAttachment: ChatAttachment = { name: file.name, type: file.type || "application/octet-stream", size: file.size };
    const isText = file.type.startsWith("text/")
      || /\.(txt|md|csv|json|js|ts|tsx|jsx|html|css|xml|yaml|yml)$/i.test(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          toast.error("File could not be read.");
          return;
        }
        setAttachment({ ...baseAttachment, dataUrl: reader.result });
        toast.success(`${file.name} attached.`);
      };
      reader.onerror = () => toast.error("File could not be read.");
      reader.readAsDataURL(file);
      return;
    }

    if (!isText) {
      setAttachment(baseAttachment);
      toast.success(`${file.name} attached. Send a message to share it with the chat.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("File could not be read.");
        return;
      }
      setAttachment({ ...baseAttachment, textContent: reader.result.slice(0, 60_000) });
      toast.success(`${file.name} attached.`);
    };
    reader.onerror = () => toast.error("File could not be read.");
    reader.readAsText(file);
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
              <button
                onClick={() => { fileRef.current?.click(); setUploadOpen(false); }}
                data-testid="btn-upload-file"
                className="flex w-full items-center gap-3 rounded-xl border border-purple-900/20 bg-[#111] p-4 text-left transition-all hover:border-purple-600/40"
              >
                <Upload size={22} className="text-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Upload files</p>
                  <p className="mt-0.5 text-xs text-gray-500">Photos, videos, PDFs, documents and more · up to 15 MB</p>
                </div>
              </button>
              <p className="mt-3 text-center text-[11px] text-gray-600">Files stay attached to this conversation until you send them.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        multiple={false}
        className="hidden"
        onChange={(event) => {
          handleFileUpload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

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

          {attachment && (
            <div className="absolute bottom-full left-0 right-0 mb-2 flex items-center gap-2 rounded-xl border border-purple-900/30 bg-[#111] px-3 py-2">
              <FileIcon size={15} className="shrink-0 text-purple-300" />
              <span className="min-w-0 flex-1 truncate text-xs text-gray-300">{attachment.name}</span>
              <button type="button" onClick={() => setAttachment(null)} className="text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}
          {conversationId && (
            <button
              type="button"
              onClick={() => setLiveSearch((value) => !value)}
              title={liveSearch ? "Live Search is on" : "Turn on Live Search"}
              className={`flex h-8 shrink-0 items-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition-colors ${
                liveSearch ? "bg-cyan-400/15 text-cyan-300" : "text-gray-500 hover:bg-cyan-400/10 hover:text-cyan-300"
              }`}
            >
              <Globe2 size={15} />
              <span className="hidden sm:inline">Live</span>
            </button>
          )}
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
