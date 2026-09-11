import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Mic, Bot, ChevronRight, Check, ShieldOff, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "auto", label: "Auto Detect", sub: "Automatically detect language" },
  { code: "hi", label: "हिंदी", sub: "Hindi" },
  { code: "en", label: "English", sub: "English" },
  { code: "hinglish", label: "Hinglish", sub: "Hindi + English mix" },
];

const VOICE_STYLES = [
  { id: "character", label: "Character Voice", sub: "AI speaks as selected character", emoji: "🎭" },
  { id: "assistant", label: "Assistant Voice", sub: "Calm, professional tone", emoji: "🤖" },
  { id: "friendly", label: "Friendly Voice", sub: "Casual and warm tone", emoji: "😊" },
  { id: "dramatic", label: "Dramatic Voice", sub: "Anime-style intense tone", emoji: "⚡" },
];

export function SettingsPage() {
  const [, setLocation] = useLocation();
  const [selectedLang, setSelectedLang] = useState("auto");
  const [selectedVoice, setSelectedVoice] = useState("character");
  const [assistantSetup, setAssistantSetup] = useState(false);
  const [recording, setRecording] = useState(false);
  const [adultMode, setAdultMode] = useState(() => localStorage.getItem("adultMode") === "true");

  function handleVoiceSetup() {
    setRecording(true);
    toast.info("Bol ke kuch sentences...", { description: "\"Hey AI, mera kaam karo\" — jaise kuch bolo" });
    setTimeout(() => {
      setRecording(false);
      setAssistantSetup(true);
      toast.success("Voice pehchaan li gayi! ✅", { description: "Ab tum voice se AI ko command de sakte ho" });
    }, 4000);
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-xl border-b border-purple-900/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/studio")}
          className="w-9 h-9 rounded-xl hover:bg-purple-900/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-white font-bold text-base">Settings</span>
      </div>

      <div className="px-4 py-5 space-y-6 pb-20">

        {/* Language */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-purple-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider opacity-70">Language</h2>
          </div>
          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setSelectedLang(lang.code); toast.success(`Language: ${lang.label}`); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#0d0d0d] border transition-all text-left"
                style={{ borderColor: selectedLang === lang.code ? "#a855f7" : "rgba(147,51,234,0.15)" }}
              >
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">{lang.label}</div>
                  <div className="text-gray-600 text-xs">{lang.sub}</div>
                </div>
                {selectedLang === lang.code && <Check size={16} className="text-purple-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </section>

        {/* Voice Style */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mic size={16} className="text-cyan-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider opacity-70">Voice Style</h2>
          </div>
          <div className="space-y-2">
            {VOICE_STYLES.map((v) => (
              <button
                key={v.id}
                onClick={() => { setSelectedVoice(v.id); toast.success(`Voice: ${v.label}`); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#0d0d0d] border transition-all text-left"
                style={{ borderColor: selectedVoice === v.id ? "#00f2ff" : "rgba(0,242,255,0.1)" }}
              >
                <span className="text-2xl">{v.emoji}</span>
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">{v.label}</div>
                  <div className="text-gray-600 text-xs">{v.sub}</div>
                </div>
                {selectedVoice === v.id && <Check size={16} className="text-cyan-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </section>

        {/* Hire as Assistant */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bot size={16} className="text-emerald-400" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wider opacity-70">Hire as Assistant</h2>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-emerald-900/30 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/30 flex items-center justify-center">
                <Bot size={20} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">AI Voice Assistant</div>
                <div className="text-gray-500 text-xs">Google / Gemini assistant ki tarah kaam karega</div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-500 mb-4 pl-1">
              <p>✅ App ke andar voice se command de sakte ho</p>
              <p>✅ Koi bhi kaam — search, script, story, chat</p>
              <p>✅ Tumhari awaaz pehchan ke jawab dega</p>
              <p>⚠️ Phone lock pe kaam nahi karega (web app limitation)</p>
            </div>

            {!assistantSetup ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleVoiceSetup}
                disabled={recording}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: recording ? "#1a1a1a" : "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  opacity: recording ? 0.7 : 1,
                }}
              >
                {recording ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-3 h-3 bg-red-500 rounded-full"
                    />
                    Recording... ab kuch bolo
                  </>
                ) : (
                  <>
                    <Mic size={16} />
                    Voice Setup Karo
                  </>
                )}
              </motion.button>
            ) : (
              <div className="w-full py-3.5 rounded-2xl bg-emerald-900/20 border border-emerald-700/40 text-center">
                <span className="text-emerald-400 font-semibold text-sm">✅ Voice Assistant Active!</span>
              </div>
            )}
          </div>
        </section>

        {/* Adult Mode */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            {adultMode ? <ShieldOff size={16} className="text-rose-400" /> : <ShieldCheck size={16} className="text-gray-500" />}
            <h2 className="text-white font-bold text-sm uppercase tracking-wider opacity-70">Content Mode</h2>
          </div>
          <div
            className="p-4 rounded-2xl border transition-all"
            style={{ background: adultMode ? "rgba(225,29,72,0.08)" : "#0d0d0d", borderColor: adultMode ? "rgba(225,29,72,0.3)" : "rgba(147,51,234,0.15)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: adultMode ? "rgba(225,29,72,0.2)" : "rgba(107,114,128,0.15)" }}
              >
                <span className="text-lg">{adultMode ? "🔞" : "🛡️"}</span>
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{adultMode ? "18+ Mode ON" : "Safe Mode ON"}</div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {adultMode ? "Characters mature content allow karenge" : "Family-friendly content only"}
                </div>
              </div>
              <button
                onClick={() => {
                  const newVal = !adultMode;
                  setAdultMode(newVal);
                  localStorage.setItem("adultMode", String(newVal));
                  toast[newVal ? "warning" : "success"](
                    newVal ? "18+ Mode ON — Sirf 18+ users ke liye!" : "Safe Mode ON",
                    { description: newVal ? "Characters ab adult content discuss kar sakte hain" : "Content filter active hai" }
                  );
                }}
                className="w-14 h-7 rounded-full transition-all flex-shrink-0 relative"
                style={{ background: adultMode ? "#e11d48" : "#374151" }}
              >
                <motion.div
                  animate={{ x: adultMode ? 28 : 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
            {adultMode && (
              <p className="text-rose-400/70 text-xs mt-3 border-t border-rose-900/30 pt-3">
                ⚠️ Yeh feature sirf 18+ adults ke liye hai. Zimmedari aapki hai.
              </p>
            )}
          </div>
        </section>

        {/* About */}
        <section>
          <button
            onClick={() => toast.info("AI Character Studio v2.0", { description: "Powered by Gemini AI" })}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#0d0d0d] border border-purple-900/15 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-black">AI</span>
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-semibold">About App</div>
              <div className="text-gray-600 text-xs">AI Character Studio v2.0</div>
            </div>
            <ChevronRight size={14} className="text-gray-600" />
          </button>
        </section>
      </div>
    </div>
  );
}
