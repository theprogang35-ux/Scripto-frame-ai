import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Video, BookOpen, GraduationCap, Heart, Search } from "lucide-react";
import { useCreateConversation } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { MODES, CHARACTER_EMOJI } from "@/data/characters";

const ModeIcons: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  MessageCircle,
  Video,
  BookOpen,
  GraduationCap,
  Heart,
  Search,
};

interface ModeSheetProps {
  open: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  animeSeries: string;
}

export function ModeSheet({ open, onClose, characterId, characterName, animeSeries }: ModeSheetProps) {
  const [, setLocation] = useLocation();
  const createConversation = useCreateConversation();

  function handleModeSelect(modeId: string, modeLabel: string) {
    createConversation.mutate(
      { data: { characterId, characterName, animeSeries, mode: modeId, title: `${characterName} — ${modeLabel}` } },
      {
        onSuccess: (conv) => {
          onClose();
          setLocation(`/chat/${conv.id}`);
        },
        onError: () => {
          toast.error("Failed to start conversation. Try again.");
        },
      },
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-purple-900/30 rounded-t-3xl z-50 pb-8"
          >
            <div className="w-10 h-1 bg-purple-900/40 rounded-full mx-auto mt-3 mb-4" />

            <div className="px-5 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{CHARACTER_EMOJI[characterId] || "🤖"}</div>
                <div>
                  <h3 className="text-white font-bold text-lg">{characterName}</h3>
                  <p className="text-purple-400 text-sm">{animeSeries}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                data-testid="btn-close-mode-sheet"
                className="p-2 rounded-xl hover:bg-purple-900/20 text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <p className="px-5 text-gray-500 text-sm mb-4">Choose how you want to interact</p>

            <div className="px-4 grid grid-cols-2 gap-3">
              {MODES.map((mode) => {
                const Icon = ModeIcons[mode.icon];
                return (
                  <motion.button
                    key={mode.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleModeSelect(mode.id, mode.label)}
                    disabled={createConversation.isPending}
                    data-testid={`btn-mode-${mode.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-[#111] border border-purple-900/20 hover:border-purple-600/50 hover:bg-purple-900/10 transition-all text-left disabled:opacity-50"
                    style={{ borderColor: `${mode.color}30` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${mode.color}20` }}
                    >
                      {Icon && <Icon size={18} color={mode.color} />}
                    </div>
                    <span className="text-white text-sm font-medium leading-tight">{mode.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
