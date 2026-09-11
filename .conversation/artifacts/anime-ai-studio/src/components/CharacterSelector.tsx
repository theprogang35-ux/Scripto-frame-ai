import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { ANIME_SERIES, MARVEL_CHARACTERS, CHARACTER_EMOJI } from "@/data/characters";
import { CharacterPortrait } from "@/components/CharacterPortrait";

interface SelectedCharacter {
  id: string;
  name: string;
  series: string;
  emoji: string;
}

interface CharacterSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (char: SelectedCharacter) => void;
}

type Level = "root" | "anime-series" | "anime-chars" | "avengers-chars";

export function CharacterSelector({ open, onClose, onSelect }: CharacterSelectorProps) {
  const [level, setLevel] = useState<Level>("root");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  function reset() {
    setLevel("root");
    setSelectedSeriesId(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSelect(id: string, name: string, series: string) {
    onSelect({ id, name, series, emoji: CHARACTER_EMOJI[id] || "🤖" });
    reset();
    onClose();
  }

  const selectedSeries = ANIME_SERIES.find((s) => s.id === selectedSeriesId);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "85vh" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-purple-800/50 rounded-full mx-auto mt-3" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <div className="flex items-center gap-2">
                {level !== "root" && (
                  <button
                    onClick={() => {
                      if (level === "anime-chars") setLevel("anime-series");
                      else setLevel("root");
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-purple-900/20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <span className="text-white font-bold text-base">
                  {level === "root" && "Select Assistant Voice"}
                  {level === "anime-series" && "⚔️ Anime Series"}
                  {level === "anime-chars" && `${selectedSeries?.name}`}
                  {level === "avengers-chars" && "🦸 Avengers"}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-purple-900/20"
              >
                <X size={18} />
              </button>
            </div>

            <p className="px-5 text-gray-600 text-xs mb-3">
              {level === "root" && "Choose a character — ya skip karke bina character ke bhi chat kar sakte ho"}
              {level === "anime-series" && "Series choose karo"}
              {level === "anime-chars" && "Character select karo"}
              {level === "avengers-chars" && "Hero select karo"}
            </p>

            {/* Content */}
            <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: "calc(85vh - 120px)" }}>
              <AnimatePresence mode="wait">

                {/* Level 1 — Root */}
                {level === "root" && (
                  <motion.div
                    key="root"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={() => setLevel("anime-series")}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#111] border border-purple-900/20 hover:border-purple-600/50 transition-all text-left"
                      style={{ borderLeftColor: "#a855f7", borderLeftWidth: "3px" }}
                    >
                      <span className="text-2xl">⚔️</span>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">Anime Characters</div>
                        <div className="text-gray-500 text-xs">62 characters • 10 series</div>
                      </div>
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>

                    <button
                      onClick={() => setLevel("avengers-chars")}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#111] border border-red-900/20 hover:border-red-600/50 transition-all text-left"
                      style={{ borderLeftColor: "#ef4444", borderLeftWidth: "3px" }}
                    >
                      <span className="text-2xl">🦸</span>
                      <div className="flex-1">
                        <div className="text-white font-semibold text-sm">Avengers / Marvel</div>
                        <div className="text-gray-500 text-xs">10 characters</div>
                      </div>
                      <ChevronRight size={16} className="text-gray-600" />
                    </button>
                  </motion.div>
                )}

                {/* Level 2 — Anime Series */}
                {level === "anime-series" && (
                  <motion.div
                    key="anime-series"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    className="space-y-2"
                  >
                    {ANIME_SERIES.map((series) => (
                      <button
                        key={series.id}
                        onClick={() => { setSelectedSeriesId(series.id); setLevel("anime-chars"); }}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#111] border transition-all text-left"
                        style={{ borderColor: `${series.color}30`, borderLeftColor: series.color, borderLeftWidth: "3px" }}
                      >
                        {series.characters[0] ? (
                          <CharacterPortrait
                            id={series.characters[0].id}
                            name={series.characters[0].name}
                            emoji={CHARACTER_EMOJI[series.characters[0].id] || "⚔️"}
                            className="h-11 w-11 rounded-xl"
                          />
                        ) : (
                          <span className="text-2xl">⚔️</span>
                        )}
                        <div className="flex-1">
                          <div className="text-white font-semibold text-sm">{series.name}</div>
                          <div className="text-gray-500 text-xs">{series.characters.length} characters</div>
                        </div>
                        <ChevronRight size={14} className="text-gray-600" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Level 3 — Anime Characters */}
                {level === "anime-chars" && selectedSeries && (
                  <motion.div
                    key="anime-chars"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    className="grid grid-cols-2 gap-2.5"
                  >
                    {selectedSeries.characters.map((char) => (
                      <motion.button
                        key={char.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelect(char.id, char.name, char.series)}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#111] border border-purple-900/20 hover:border-purple-600/50 transition-all text-left"
                      >
                        <CharacterPortrait
                          id={char.id}
                          name={char.name}
                          emoji={CHARACTER_EMOJI[char.id] || "🤖"}
                          className="h-12 w-12 rounded-xl"
                        />
                        <div className="min-w-0">
                          <div className="text-white font-semibold text-sm truncate">{char.name}</div>
                          <div className="text-gray-600 text-xs truncate">{char.series}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* Level 2 — Avengers Characters */}
                {level === "avengers-chars" && (
                  <motion.div
                    key="avengers-chars"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    className="grid grid-cols-2 gap-2.5"
                  >
                    {MARVEL_CHARACTERS.map((char) => (
                      <motion.button
                        key={char.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelect(char.id, char.name, char.series)}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#111] border border-red-900/20 hover:border-red-600/50 transition-all text-left"
                      >
                        <CharacterPortrait
                          id={char.id}
                          name={char.name}
                          emoji={CHARACTER_EMOJI[char.id] || "🦸"}
                          className="h-12 w-12 rounded-xl"
                        />
                        <div className="min-w-0">
                          <div className="text-white font-semibold text-sm truncate">{char.name}</div>
                          <div className="text-gray-600 text-xs truncate">{char.series}</div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
