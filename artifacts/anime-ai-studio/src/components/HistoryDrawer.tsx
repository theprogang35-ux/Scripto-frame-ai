import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, MessageCircle, Clock } from "lucide-react";
import { useGetRecentHistory, useDeleteConversation, getGetRecentHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { CHARACTER_EMOJI } from "@/data/characters";

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { data: history = [], isLoading } = useGetRecentHistory();
  const deleteConv = useDeleteConversation();

  function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetRecentHistoryQueryKey() });
        toast.success("Conversation deleted");
      },
    });
  }

  function handleOpen(convId: number) {
    setLocation(`/chat/${convId}`);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#0a0a0a] border-l border-purple-900/30 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-purple-900/20">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                <span className="text-white font-semibold">History</span>
              </div>
              <button
                onClick={onClose}
                data-testid="btn-close-history"
                className="p-1.5 rounded-lg hover:bg-purple-900/20 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading && (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-[#111] rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {!isLoading && history.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <MessageCircle size={32} className="text-purple-900/50 mb-2" />
                  <p className="text-gray-600 text-sm">No conversations yet</p>
                  <p className="text-gray-700 text-xs mt-1">Pick a character to start!</p>
                </div>
              )}

              {history.map((item) => (
                <motion.div
                  key={item.conversationId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-[#111] border border-purple-900/20 hover:border-purple-600/40 cursor-pointer transition-all"
                  onClick={() => handleOpen(item.conversationId)}
                  data-testid={`history-item-${item.conversationId}`}
                >
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    {CHARACTER_EMOJI[item.characterId] || "🤖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.characterName}</p>
                    <p className="text-purple-400 text-xs truncate">{item.animeSeries}</p>
                    <p className="text-gray-600 text-xs mt-0.5 truncate">{item.lastMessage}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, item.conversationId)}
                    data-testid={`btn-delete-history-${item.conversationId}`}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-900/30 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
