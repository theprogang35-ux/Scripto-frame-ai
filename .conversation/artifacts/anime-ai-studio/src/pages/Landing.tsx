import { motion } from "framer-motion";
import { useClerk } from "@clerk/react";
import { Zap, MessageCircle, Search, BookOpen, Sparkles } from "lucide-react";

export function LandingPage() {
  const { openSignIn } = useClerk();
  const studioPath = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/studio` || "/studio";
  const features = [
    { icon: MessageCircle, label: "Chat with Characters", color: "#9333ea" },
    { icon: Search, label: "Live Web Search", color: "#00f2ff" },
    { icon: BookOpen, label: "Story Writing", color: "#f59e0b" },
    { icon: Sparkles, label: "Script for Social Media", color: "#ec4899" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] cyber-grid flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/20 border border-purple-700/30 text-purple-400 text-sm mb-6">
            <Zap size={14} />
            <span>AI Character Studio</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl font-black text-white leading-tight mb-4"
        >
          Chat with Your{" "}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Favorite
          </span>
          <br />
          Anime Characters
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 text-lg max-w-sm mb-10"
        >
          Gojo, Naruto, Luffy, Iron Man — powered by AI. Your ultimate companion for chat, creativity, and learning.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => openSignIn({ forceRedirectUrl: studioPath })}
          data-testid="btn-enter-studio"
          className="mb-10 w-full max-w-xs rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 py-4 text-lg font-bold text-white shadow-lg shadow-purple-900/40"
        >
          Enter Studio ⚡
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 gap-3 w-full max-w-sm mb-12"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0d0d0d] border border-purple-900/20"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}18` }}>
                <f.icon size={16} style={{ color: f.color }} />
              </div>
              <span className="text-gray-300 text-xs font-medium">{f.label}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 flex gap-6 text-center"
        >
          {[
            { num: "20+", label: "Characters" },
            { num: "6", label: "AI Modes" },
            { num: "∞", label: "Conversations" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-black text-white">{stat.num}</div>
              <div className="text-gray-600 text-xs">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
