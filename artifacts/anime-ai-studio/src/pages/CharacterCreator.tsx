import { useState, useRef, useCallback } from "react";
import { ArrowLeft, Download, RotateCcw, Palette, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AnimeCharacterBuilder } from "@/components/AnimeCharacterBuilder";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CharState {
  skinColor: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  eyeColor: string;
  outfitStyle: string;
  outfitColor: string;
  outfitAccent: string;
  pantsColor: string;
  shoesColor: string;
  accessory: string;
  auraColor: string;
  bgStyle: string;
  bgColor: string;
  name: string;
}

const DEFAULT: CharState = {
  skinColor: "#FDBCB4",
  hairStyle: "spiky",
  hairColor: "#1a1a2e",
  eyeStyle: "normal",
  eyeColor: "#1e90ff",
  outfitStyle: "battle",
  outfitColor: "#2d2d6b",
  outfitAccent: "#4169e1",
  pantsColor: "#1a1a2e",
  shoesColor: "#111111",
  accessory: "none",
  auraColor: "#00f2ff",
  bgStyle: "gradient",
  bgColor: "#0d0d2e",
  name: "",
};

const STYLE_PRESETS: {
  id: string;
  label: string;
  description: string;
  values: Partial<CharState>;
}[] = [
  {
    id: "cursed-energy",
    label: "⚡ Cursed Energy",
    description: "mystic battle aura",
    values: {
      hairStyle: "spiky",
      hairColor: "#dbeafe",
      eyeStyle: "sharp",
      eyeColor: "#00e5ff",
      outfitStyle: "battle",
      outfitColor: "#111827",
      outfitAccent: "#38bdf8",
      auraColor: "#00f2ff",
      bgStyle: "aura",
      bgColor: "#06152e",
    },
  },
  {
    id: "shinobi-hero",
    label: "🍥 Shinobi Hero",
    description: "fast ninja adventurer",
    values: {
      hairStyle: "short",
      hairColor: "#f59e0b",
      eyeStyle: "normal",
      eyeColor: "#166534",
      outfitStyle: "ninja",
      outfitColor: "#1f2937",
      outfitAccent: "#f97316",
      auraColor: "#fb923c",
      bgStyle: "stars",
      bgColor: "#1c1005",
    },
  },
  {
    id: "sky-pirate",
    label: "🏴‍☠️ Sky Pirate",
    description: "free-spirited captain",
    values: {
      hairStyle: "wild",
      hairColor: "#7c2d12",
      eyeStyle: "normal",
      eyeColor: "#2563eb",
      outfitStyle: "casual",
      outfitColor: "#991b1b",
      outfitAccent: "#facc15",
      auraColor: "#ef4444",
      bgStyle: "gradient",
      bgColor: "#250909",
    },
  },
  {
    id: "mystic-guardian",
    label: "🔮 Mystic Guardian",
    description: "calm fantasy protector",
    values: {
      hairStyle: "long",
      hairColor: "#7c3aed",
      eyeStyle: "cute",
      eyeColor: "#f0abfc",
      outfitStyle: "mage",
      outfitColor: "#312e81",
      outfitAccent: "#c4b5fd",
      auraColor: "#a78bfa",
      bgStyle: "circle",
      bgColor: "#170b3b",
    },
  },
];

// ─── Skin tones ──────────────────────────────────────────────────────────────
const SKINS = [
  { label: "Pale",   hex: "#FFE5CC" },
  { label: "Light",  hex: "#FDBCB4" },
  { label: "Fair",   hex: "#F0AA88" },
  { label: "Medium", hex: "#D4845A" },
  { label: "Tan",    hex: "#C68642" },
  { label: "Dark",   hex: "#8D5524" },
];

const HAIR_STYLES = [
  { id: "spiky",    label: "⚡ Spiky"      },
  { id: "long",     label: "💇 Long"       },
  { id: "short",    label: "✂️ Short"      },
  { id: "twintail", label: "🎀 Twin Tail"  },
  { id: "wild",     label: "🔥 Wild"       },
  { id: "bun",      label: "🔵 Bun"        },
];

const EYE_STYLES = [
  { id: "normal",  label: "😊 Normal"  },
  { id: "sharp",   label: "😈 Sharp"   },
  { id: "cute",    label: "🥹 Cute"    },
  { id: "narrow",  label: "😏 Narrow"  },
];

const OUTFIT_STYLES = [
  { id: "battle",  label: "⚔️ Battle"   },
  { id: "school",  label: "🎓 School"   },
  { id: "ninja",   label: "🥷 Ninja"    },
  { id: "casual",  label: "👕 Casual"   },
  { id: "royal",   label: "👑 Royal"    },
  { id: "mage",    label: "🔮 Mage"     },
];

const ACCESSORIES = [
  { id: "none",    label: "❌ None"     },
  { id: "horns",   label: "😈 Horns"   },
  { id: "wings",   label: "🦋 Wings"   },
  { id: "crown",   label: "👑 Crown"   },
  { id: "mask",    label: "🎭 Mask"    },
  { id: "aura",    label: "✨ Aura"    },
  { id: "halo",    label: "😇 Halo"    },
  { id: "ears",    label: "🐱 Cat Ears"},
];

const BG_STYLES = [
  { id: "none",     label: "⬛ None"      },
  { id: "gradient", label: "🌌 Gradient"  },
  { id: "circle",   label: "🔵 Circle"    },
  { id: "stars",    label: "⭐ Stars"     },
  { id: "aura",     label: "✨ Aura"      },
];

const TABS = ["Skin","Hair","Eyes","Outfit","Extra","BG"] as const;
type Tab = typeof TABS[number];

// ─── SVG Character ───────────────────────────────────────────────────────────
function AnimeCharacter({ c, svgRef }: { c: CharState; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const eyeIris = (cx: number, cy: number) => {
    const r = c.eyeStyle === "cute" ? 13 : c.eyeStyle === "narrow" ? 7 : 10;
    const ry = c.eyeStyle === "sharp" ? 7 : c.eyeStyle === "narrow" ? 5 : r;
    return (
      <g>
        <ellipse cx={cx} cy={cy} rx={14} ry={c.eyeStyle === "narrow" ? 8 : 15} fill="white" />
        <ellipse cx={cx} cy={cy + 1} rx={r} ry={ry} fill={c.eyeColor} />
        <ellipse cx={cx} cy={cy + 1} rx={r * 0.45} ry={ry * 0.55} fill="#0a0a0a" />
        <ellipse cx={cx + 4} cy={cy - 4} rx={3} ry={3} fill="white" />
        <ellipse cx={cx - 3} cy={cy + 3} rx={1.5} ry={1.5} fill="rgba(255,255,255,0.6)" />
        {c.eyeStyle === "sharp" && <path d={`M${cx-14},${cy-8} L${cx+14},${cy-8}`} stroke="#0a0a0a" strokeWidth="2" />}
        {c.eyeStyle === "cute" && <ellipse cx={cx} cy={cy + 10} rx={6} ry={3} fill="rgba(255,180,180,0.35)" />}
      </g>
    );
  };

  const hairBack = () => {
    switch (c.hairStyle) {
      case "spiky":
        return <path d="M82,118 Q78,80 88,50 Q95,30 110,25 Q125,18 140,15 Q155,18 170,25 Q185,30 192,50 Q202,80 198,118 Q185,100 175,90 Q165,72 155,65 Q148,60 140,58 Q132,60 125,65 Q115,72 105,90 Q95,100 82,118 Z" fill={c.hairColor} />;
      case "long":
        return <path d="M82,118 Q75,85 85,50 Q95,20 140,12 Q185,20 195,50 Q205,85 198,118 Q195,170 192,230 Q185,290 180,340 Q170,360 160,365 Q150,360 145,340 Q142,300 140,260 Q138,300 135,340 Q130,360 120,365 Q110,360 100,340 Q95,290 88,230 Q85,170 82,118 Z" fill={c.hairColor} />;
      case "short":
        return <path d="M82,118 Q78,80 90,48 Q102,22 140,15 Q178,22 190,48 Q202,80 198,118 Q190,105 178,95 Q162,80 140,77 Q118,80 102,95 Q90,105 82,118 Z" fill={c.hairColor} />;
      case "twintail":
        return (
          <g>
            <path d="M82,118 Q78,80 90,48 Q102,22 140,15 Q178,22 190,48 Q202,80 198,118 Q185,100 170,92 Q155,82 140,80 Q125,82 110,92 Q95,100 82,118 Z" fill={c.hairColor} />
            <path d="M80,125 Q60,140 55,180 Q52,220 58,260 Q65,290 78,300 Q90,295 95,270 Q88,240 86,210 Q88,175 92,150 Q88,138 80,125 Z" fill={c.hairColor} />
            <path d="M200,125 Q220,140 225,180 Q228,220 222,260 Q215,290 202,300 Q190,295 185,270 Q192,240 194,210 Q192,175 188,150 Q192,138 200,125 Z" fill={c.hairColor} />
          </g>
        );
      case "wild":
        return <path d="M80,120 Q70,85 75,48 Q82,18 100,10 Q108,2 125,5 Q130,-5 140,-2 Q150,-5 155,5 Q172,2 180,10 Q198,18 205,48 Q210,85 200,120 Q195,95 188,75 Q178,52 165,42 Q152,35 140,33 Q128,35 115,42 Q102,52 92,75 Q85,95 80,120 Z" fill={c.hairColor} />;
      case "bun":
        return (
          <g>
            <path d="M82,118 Q80,85 90,55 Q100,28 140,20 Q180,28 190,55 Q200,85 198,118 Q188,102 174,92 Q158,82 140,80 Q122,82 106,92 Q92,102 82,118 Z" fill={c.hairColor} />
            <circle cx="140" cy="18" r="22" fill={c.hairColor} />
            <circle cx="140" cy="18" r="14" fill={c.hairColor} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          </g>
        );
      default:
        return null;
    }
  };

  const hairFront = () => {
    switch (c.hairStyle) {
      case "spiky":
        return <path d="M95,118 Q98,90 105,78 Q115,68 125,72 Q118,80 115,95 Q125,82 132,78 Q138,76 140,78 Q142,76 148,78 Q155,82 165,95 Q162,80 155,72 Q165,68 175,78 Q182,90 185,118 Q175,108 165,103 Q152,98 140,97 Q128,98 115,103 Q105,108 95,118 Z" fill={c.hairColor} />;
      case "long":
        return <path d="M88,118 Q90,95 98,78 Q110,60 125,65 Q118,75 115,90 Q128,72 136,70 Q140,69 144,70 Q152,72 165,90 Q162,75 155,65 Q170,60 182,78 Q190,95 192,118 Q178,108 165,104 Q152,100 140,99 Q128,100 115,104 Q102,108 88,118 Z" fill={c.hairColor} />;
      case "short":
        return <path d="M90,116 Q94,92 102,76 Q112,60 125,62 Q118,72 116,88 Q128,70 136,68 Q140,67 144,68 Q152,70 164,88 Q162,72 155,62 Q168,60 178,76 Q186,92 190,116 Q178,106 165,102 Q152,98 140,97 Q128,98 115,102 Q102,106 90,116 Z" fill={c.hairColor} />;
      case "twintail":
        return <path d="M90,118 Q94,94 102,78 Q112,62 126,65 Q119,75 117,90 Q128,72 136,70 Q140,69 144,70 Q152,72 163,90 Q161,75 154,65 Q168,62 178,78 Q186,94 190,118 Q178,108 165,103 Q152,99 140,98 Q128,99 115,103 Q102,108 90,118 Z" fill={c.hairColor} />;
      case "wild":
        return (
          <g>
            <path d="M80,118 Q84,88 96,72 Q108,58 124,62 Q116,74 114,92 Q126,70 136,68 Q140,67 144,68 Q154,70 166,92 Q164,74 156,62 Q172,58 184,72 Q196,88 200,118 Q188,105 173,100 Q156,96 140,95 Q124,96 107,100 Q92,105 80,118 Z" fill={c.hairColor} />
            <path d="M72,100 Q65,80 72,62 Q78,52 86,55 Q82,70 84,90 Z" fill={c.hairColor} />
            <path d="M208,100 Q215,80 208,62 Q202,52 194,55 Q198,70 196,90 Z" fill={c.hairColor} />
          </g>
        );
      case "bun":
        return <path d="M90,116 Q94,92 102,76 Q112,60 125,63 Q118,73 116,88 Q128,70 136,68 Q140,67 144,68 Q152,70 164,88 Q162,73 155,63 Q168,60 178,76 Q186,92 190,116 Q178,106 165,102 Q152,98 140,97 Q128,98 115,102 Q102,106 90,116 Z" fill={c.hairColor} />;
      default:
        return null;
    }
  };

  const outfitBody = () => {
    const mc = c.outfitColor;
    const ac = c.outfitAccent;
    switch (c.outfitStyle) {
      case "battle":
        return (
          <g>
            <path d="M78,215 Q140,205 202,215 L212,355 Q140,368 68,355 Z" fill={mc} />
            <path d="M78,215 Q100,220 112,215 L108,260 Q90,270 80,260 Z" fill={ac} />
            <path d="M202,215 Q180,220 168,215 L172,260 Q190,270 200,260 Z" fill={ac} />
            <path d="M115,215 L140,205 L165,215 L160,255 L140,260 L120,255 Z" fill={ac} />
            <rect x="130" y="225" width="20" height="5" rx="2" fill="rgba(255,255,255,0.3)" />
            <path d="M110,355 L68,355 L70,365 L112,365 Z" fill={mc} />
            <path d="M170,355 L212,355 L210,365 L168,365 Z" fill={mc} />
          </g>
        );
      case "school":
        return (
          <g>
            <path d="M78,215 Q140,205 202,215 L208,355 Q140,365 72,355 Z" fill={mc} />
            <path d="M118,205 L140,215 L162,205 L160,225 L140,230 L120,225 Z" fill="white" />
            <rect x="136" y="218" width="8" height="35" rx="2" fill={ac} />
            <path d="M78,215 L95,215 L90,260 L75,255 Z" fill={ac} />
            <path d="M202,215 L185,215 L190,260 L205,255 Z" fill={ac} />
            <path d="M115,355 L72,355 L74,365 L117,365 Z" fill={mc} />
            <path d="M165,355 L208,355 L206,365 L163,365 Z" fill={mc} />
          </g>
        );
      case "ninja":
        return (
          <g>
            <path d="M78,215 Q140,202 202,215 L210,355 Q140,367 70,355 Z" fill={mc} />
            <path d="M78,215 Q95,212 110,215 L105,295 Q88,300 78,290 Z" fill={mc} stroke={ac} strokeWidth="1.5" />
            <path d="M202,215 Q185,212 170,215 L175,295 Q192,300 202,290 Z" fill={mc} stroke={ac} strokeWidth="1.5" />
            <path d="M100,215 L140,208 L180,215 L175,245 L140,250 L105,245 Z" fill={ac} />
            <path d="M112,355 L70,355 L72,365 L114,365 Z" fill={mc} />
            <path d="M168,355 L210,355 L208,365 L166,365 Z" fill={mc} />
          </g>
        );
      case "casual":
        return (
          <g>
            <path d="M80,215 Q140,207 200,215 L208,355 Q140,365 72,355 Z" fill={mc} />
            <path d="M80,215 Q97,212 112,215 L107,300 Q88,308 78,298 Z" fill={mc} />
            <path d="M200,215 Q183,212 168,215 L173,300 Q192,308 202,298 Z" fill={mc} />
            <path d="M112,215 L140,210 L168,215" stroke={ac} strokeWidth="3" fill="none" />
            <circle cx="140" cy="240" r="5" fill={ac} opacity="0.6" />
            <path d="M115,355 L72,355 L74,365 L117,365 Z" fill={mc} />
            <path d="M165,355 L208,355 L206,365 L163,365 Z" fill={mc} />
          </g>
        );
      case "royal":
        return (
          <g>
            <path d="M60,215 Q140,200 220,215 L218,355 Q140,370 62,355 Z" fill={mc} />
            <path d="M60,215 Q80,210 92,215 L88,295 Q65,305 58,290 Z" fill={ac} />
            <path d="M220,215 Q200,210 208,215 L212,295 Q235,305 222,290 Z" fill={ac} />
            <path d="M100,210 L140,200 L180,210 L178,240 L140,248 L102,240 Z" fill={ac} />
            <path d="M108,224 L140,218 L172,224" stroke="rgba(255,215,0,0.7)" strokeWidth="2.5" fill="none" />
            <circle cx="140" cy="220" r="4" fill="gold" />
            <path d="M118,355 L62,355 L64,368 L120,368 Z" fill={mc} />
            <path d="M162,355 L218,355 L216,368 L160,368 Z" fill={mc} />
          </g>
        );
      case "mage":
        return (
          <g>
            <path d="M68,218 Q140,205 212,218 L214,358 Q140,372 66,358 Z" fill={mc} />
            <path d="M68,218 Q86,212 100,218 Q96,290 88,330 Q70,330 65,318 Z" fill={ac} />
            <path d="M212,218 Q194,212 180,218 Q184,290 192,330 Q210,330 215,318 Z" fill={ac} />
            <path d="M100,218 L140,208 L180,218 L178,235 L140,242 L102,235 Z" fill={ac} />
            <path d="M115,358 L66,358 L68,372 L117,372 Z" fill={mc} />
            <path d="M165,358 L214,358 L212,372 L163,372 Z" fill={mc} />
            <path d="M130,242 L140,235 L150,242 L148,260 L140,265 L132,260 Z" fill="rgba(255,255,255,0.2)" />
          </g>
        );
      default:
        return null;
    }
  };

  const accessoryEl = () => {
    switch (c.accessory) {
      case "horns":
        return (
          <g>
            <path d="M108,68 Q100,40 110,20 Q118,10 115,35 Z" fill={c.auraColor} />
            <path d="M172,68 Q180,40 170,20 Q162,10 165,35 Z" fill={c.auraColor} />
          </g>
        );
      case "wings":
        return (
          <g opacity="0.9">
            <path d="M68,260 Q20,220 10,170 Q15,155 30,165 Q25,195 50,220 Q60,235 72,248 Z" fill={c.auraColor} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <path d="M212,260 Q260,220 270,170 Q265,155 250,165 Q255,195 230,220 Q220,235 208,248 Z" fill={c.auraColor} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          </g>
        );
      case "crown":
        return (
          <g>
            <path d="M110,70 L110,48 L122,62 L140,40 L158,62 L170,48 L170,70 Z" fill="gold" stroke="rgba(255,200,0,0.8)" strokeWidth="1.5" />
            <circle cx="140" cy="44" r="5" fill="#ff4444" />
            <circle cx="120" cy="56" r="3" fill="#4444ff" />
            <circle cx="160" cy="56" r="3" fill="#44ff44" />
          </g>
        );
      case "mask":
        return (
          <path d="M108,125 Q108,148 120,155 Q130,160 140,160 Q150,160 160,155 Q172,148 172,125 Q160,120 140,118 Q120,120 108,125 Z" fill={c.auraColor} opacity="0.85" />
        );
      case "aura":
        return (
          <g>
            <ellipse cx="140" cy="250" rx="105" ry="240" fill={c.auraColor} opacity="0.07" />
            <ellipse cx="140" cy="250" rx="80" ry="200" fill={c.auraColor} opacity="0.07" />
            {[0,60,120,180,240,300].map(angle => {
              const rad = (angle * Math.PI) / 180;
              const x = 140 + Math.cos(rad) * 115;
              const y = 250 + Math.sin(rad) * 245;
              return <circle key={angle} cx={x} cy={y} r="3" fill={c.auraColor} opacity="0.5" />;
            })}
          </g>
        );
      case "halo":
        return (
          <ellipse cx="140" cy="52" rx="40" ry="10" fill="none" stroke="gold" strokeWidth="4" opacity="0.9" />
        );
      case "ears":
        return (
          <g>
            <path d="M108,80 Q100,55 112,45 Q120,55 116,75 Z" fill={c.hairColor} />
            <path d="M172,80 Q180,55 168,45 Q160,55 164,75 Z" fill={c.hairColor} />
            <path d="M110,78 Q104,60 113,52 Q118,60 115,73 Z" fill="#ffb6c1" opacity="0.6" />
            <path d="M170,78 Q176,60 167,52 Q162,60 165,73 Z" fill="#ffb6c1" opacity="0.6" />
          </g>
        );
      default:
        return null;
    }
  };

  const bgEl = () => {
    switch (c.bgStyle) {
      case "gradient":
        return (
          <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.bgColor} />
              <stop offset="100%" stopColor="#000010" />
            </linearGradient>
          </defs>
        );
      case "circle":
        return (
          <>
            <defs><radialGradient id="bgGrad"><stop offset="0%" stopColor={c.bgColor} /><stop offset="100%" stopColor="#000010" /></radialGradient></defs>
          </>
        );
      default:
        return null;
    }
  };

  const bgFill = c.bgStyle === "none" ? "transparent"
    : c.bgStyle === "stars" ? "#000010"
    : "url(#bgGrad)";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 280 490"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", maxHeight: "65vh" }}
    >
      {bgEl()}
      <rect width="280" height="490" fill={bgFill} rx="16" />

      {/* Stars bg */}
      {c.bgStyle === "stars" && [
        [30,40],[80,20],[150,30],[220,50],[260,25],[50,80],[200,70],
        [240,110],[20,130],[140,90],[90,160],[255,145],[10,200],[275,180],
      ].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={Math.random() > 0.5 ? 1.5 : 1} fill="white" opacity={0.6 + Math.random()*0.4} />
      ))}
      {c.bgStyle === "aura" && (
        <ellipse cx="140" cy="350" rx="130" ry="140" fill={c.bgColor} opacity="0.3" />
      )}

      {/* ── Accessories (back) ── */}
      {c.accessory === "wings" && accessoryEl()}

      {/* ── Hair back layer ── */}
      {hairBack()}

      {/* ── Left Ear ── */}
      <ellipse cx="82" cy="128" rx="13" ry="17" fill={c.skinColor} />
      <ellipse cx="82" cy="128" rx="8" ry="11" fill={c.skinColor} style={{ filter: "brightness(0.88)" }} />

      {/* ── Right Ear ── */}
      <ellipse cx="198" cy="128" rx="13" ry="17" fill={c.skinColor} />
      <ellipse cx="198" cy="128" rx="8" ry="11" fill={c.skinColor} style={{ filter: "brightness(0.88)" }} />

      {/* ── Head ── */}
      <ellipse cx="140" cy="122" rx="60" ry="68" fill={c.skinColor} />

      {/* ── Eyebrows ── */}
      <path d="M105,100 Q115,93 128,97" stroke={c.hairColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M175,100 Q165,93 152,97" stroke={c.hairColor} strokeWidth="2.8" fill="none" strokeLinecap="round" />

      {/* ── Eyes ── */}
      {eyeIris(115, 120)}
      {eyeIris(165, 120)}

      {/* ── Nose ── */}
      <path d="M137,143 Q140,149 143,143" stroke="rgba(0,0,0,0.22)" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* ── Mouth ── */}
      <path d="M124,158 Q140,170 156,158" stroke="rgba(0,0,0,0.3)" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* ── Cheek blush ── */}
      <ellipse cx="100" cy="142" rx="11" ry="7" fill="#ff9db0" opacity="0.28" />
      <ellipse cx="180" cy="142" rx="11" ry="7" fill="#ff9db0" opacity="0.28" />

      {/* ── Neck ── */}
      <rect x="120" y="182" width="40" height="32" rx="6" fill={c.skinColor} />

      {/* ── Outfit ── */}
      {outfitBody()}

      {/* ── Hands / Forearms ── */}
      <ellipse cx="62" cy="318" rx="16" ry="14" fill={c.skinColor} />
      <ellipse cx="218" cy="318" rx="16" ry="14" fill={c.skinColor} />

      {/* ── Legs / Pants ── */}
      <path d="M95,360 Q100,430 96,475 L126,475 Q130,420 128,360 Z" fill={c.pantsColor} />
      <path d="M155,360 Q160,420 154,475 L184,475 Q180,430 185,360 Z" fill={c.pantsColor} />

      {/* ── Shoes ── */}
      <ellipse cx="111" cy="475" rx="24" ry="11" fill={c.shoesColor} />
      <ellipse cx="169" cy="475" rx="24" ry="11" fill={c.shoesColor} />
      <ellipse cx="111" cy="475" rx="14" ry="6" fill="rgba(255,255,255,0.12)" />
      <ellipse cx="169" cy="475" rx="14" ry="6" fill="rgba(255,255,255,0.12)" />

      {/* ── Hair front layer ── */}
      {hairFront()}

      {/* ── Accessories (front) ── */}
      {c.accessory !== "wings" && accessoryEl()}

      {/* ── Character name ── */}
      {c.name && (
        <text x="140" y="488" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="12" fontFamily="sans-serif" fontWeight="bold" letterSpacing="2">
          {c.name.toUpperCase()}
        </text>
      )}
    </svg>
  );
}

// ─── Color Picker Row ────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#0c0c0c] border border-gray-900">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg border-2 border-gray-700 shadow-lg" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0"
          style={{ appearance: "none" }}
        />
      </div>
    </div>
  );
}

// ─── Style Grid ──────────────────────────────────────────────────────────────
function StyleGrid({ items, value, onChange }: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className="py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{
            background: value === item.id ? "rgba(99,102,241,0.22)" : "#0c0c0c",
            border: `1px solid ${value === item.id ? "#6366f1" : "rgba(255,255,255,0.07)"}`,
            color: value === item.id ? "#a5b4fc" : "#6b7280",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function CharacterCreatorPage() {
  const [, setLocation] = useLocation();
  const [char, setChar] = useState<CharState>({ ...DEFAULT });
  const [activeTab, setActiveTab] = useState<Tab>("Hair");
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloading, setDownloading] = useState(false);

  const set = useCallback(<K extends keyof CharState>(key: K, val: CharState[K]) => {
    setChar(prev => ({ ...prev, [key]: val }));
  }, []);

  const reset = () => { setChar({ ...DEFAULT }); toast.success("Character reset!"); };

  const applyStylePreset = (values: Partial<CharState>, label: string) => {
    setChar(prev => ({ ...prev, ...values }));
    toast.success(`${label} style applied — ab ise apna original character banao`);
  };

  const downloadPNG = async () => {
    if (!svgRef.current) return;
    setDownloading(true);
    try {
      const svgEl = svgRef.current;
      const serializer = new XMLSerializer();
      let svgStr = serializer.serializeToString(svgEl);
      if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
        svgStr = svgStr.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 560;
        canvas.height = 980;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = char.bgStyle === "none" ? "#0d0d2e" : char.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(pngBlob => {
          if (!pngBlob) { toast.error("Download failed"); return; }
          const a = document.createElement("a");
          a.href = URL.createObjectURL(pngBlob);
          a.download = `${char.name || "my-character"}-anime.png`;
          a.click();
          URL.revokeObjectURL(a.href);
          toast.success("Character download ho gaya! 🎉");
          setDownloading(false);
        }, "image/png");
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { toast.error("Render error"); setDownloading(false); };
      img.src = url;
    } catch {
      toast.error("Download fail");
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060608" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-3">
        <button onClick={() => setLocation("/studio")} className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-indigo-400" />
          <span className="text-white font-bold text-base">Original Anime Character</span>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="p-2 rounded-xl bg-gray-900/60 border border-gray-800">
            <RotateCcw size={18} className="text-gray-500" />
          </button>
          <button
            onClick={downloadPNG}
            disabled={downloading}
            className="px-3.5 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}
          >
            <Download size={15} className="text-white" />
            <span className="text-white">{downloading ? "..." : "PNG"}</span>
          </button>
        </div>
      </div>

      {/* New 3D builder — the original creator controls remain below */}
      <div className="px-3 pb-5 sm:px-4">
        <AnimeCharacterBuilder />
      </div>

      {/* Original character concept */}
      <div className="px-4 pb-3">
        <div className="rounded-2xl border border-indigo-900/30 bg-indigo-950/10 p-3">
          <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
            <Sparkles size={15} />
            Original anime character builder
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Famous anime se sirf style inspiration lo — exact character copy nahi. Apne colors, hair, outfit aur powers choose karo.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {STYLE_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyStylePreset(preset.values, preset.label)}
                className="rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 text-left transition-all active:scale-95 hover:border-indigo-500/60"
              >
                <div className="text-white text-xs font-semibold">{preset.label}</div>
                <div className="text-gray-600 text-[10px] mt-0.5">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Character Name */}
      <div className="px-4 pb-2">
        <input
          value={char.name}
          onChange={e => set("name", e.target.value)}
          placeholder="Apne original character ka naam..."
          maxLength={20}
          className="w-full bg-[#0c0c0c] border border-gray-800/60 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-700 outline-none focus:border-indigo-500/60 text-center font-bold tracking-widest"
        />
      </div>

      {/* SVG Preview */}
      <div className="flex-shrink-0 px-6 pb-2 flex justify-center">
        <div className="rounded-2xl overflow-hidden border border-indigo-900/30 shadow-2xl w-full max-w-xs"
          style={{ background: char.bgStyle === "none" ? "#0d0d0d" : "transparent" }}>
          <AnimeCharacter c={char} svgRef={svgRef} />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: activeTab === tab ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeTab === tab ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
              color: activeTab === tab ? "#a5b4fc" : "#6b7280",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">

        {activeTab === "Skin" && (
          <>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Skin Tone</p>
            <div className="grid grid-cols-3 gap-2">
              {SKINS.map(s => (
                <button key={s.hex} onClick={() => set("skinColor", s.hex)}
                  className="py-2.5 rounded-xl flex flex-col items-center gap-1.5 transition-all active:scale-95"
                  style={{ background: "#0c0c0c", border: `2px solid ${char.skinColor === s.hex ? "#6366f1" : "rgba(255,255,255,0.07)"}` }}>
                  <div className="w-8 h-8 rounded-full border-2" style={{ background: s.hex, borderColor: char.skinColor === s.hex ? "#6366f1" : "rgba(255,255,255,0.15)" }} />
                  <span className="text-[11px] text-gray-500">{s.label}</span>
                </button>
              ))}
            </div>
            <ColorRow label="Custom Skin Color" value={char.skinColor} onChange={v => set("skinColor", v)} />
          </>
        )}

        {activeTab === "Hair" && (
          <>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Hair Style</p>
            <StyleGrid items={HAIR_STYLES} value={char.hairStyle} onChange={v => set("hairStyle", v)} />
            <ColorRow label="Hair Color" value={char.hairColor} onChange={v => set("hairColor", v)} />
            <p className="text-gray-700 text-xs pt-1">Quick colors:</p>
            <div className="flex gap-2 flex-wrap">
              {["#1a1a2e","#f0f0f0","#ffd700","#dc143c","#4169e1","#8b00ff","#ff69b4","#00c957","#ff7f00","#8b4513","#c0c0c0"].map(hex => (
                <button key={hex} onClick={() => set("hairColor", hex)}
                  className="w-7 h-7 rounded-full border-2 transition-all active:scale-90"
                  style={{ background: hex, borderColor: char.hairColor === hex ? "#6366f1" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </>
        )}

        {activeTab === "Eyes" && (
          <>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Eye Style</p>
            <StyleGrid items={EYE_STYLES} value={char.eyeStyle} onChange={v => set("eyeStyle", v)} />
            <ColorRow label="Eye Color" value={char.eyeColor} onChange={v => set("eyeColor", v)} />
            <p className="text-gray-700 text-xs pt-1">Quick colors:</p>
            <div className="flex gap-2 flex-wrap">
              {["#1e90ff","#ff2020","#9400d3","#00c957","#ffd700","#c0c0c0","#ff69b4","#111111","#00ffff","#ff8c00"].map(hex => (
                <button key={hex} onClick={() => set("eyeColor", hex)}
                  className="w-7 h-7 rounded-full border-2 transition-all active:scale-90"
                  style={{ background: hex, borderColor: char.eyeColor === hex ? "#6366f1" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </>
        )}

        {activeTab === "Outfit" && (
          <>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Outfit Style</p>
            <StyleGrid items={OUTFIT_STYLES} value={char.outfitStyle} onChange={v => set("outfitStyle", v)} />
            <ColorRow label="Main Color" value={char.outfitColor} onChange={v => set("outfitColor", v)} />
            <ColorRow label="Accent Color" value={char.outfitAccent} onChange={v => set("outfitAccent", v)} />
            <ColorRow label="Pants/Bottom" value={char.pantsColor} onChange={v => set("pantsColor", v)} />
            <ColorRow label="Shoes" value={char.shoesColor} onChange={v => set("shoesColor", v)} />
          </>
        )}

        {activeTab === "Extra" && (
          <>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Accessories</p>
            <StyleGrid items={ACCESSORIES} value={char.accessory} onChange={v => set("accessory", v)} />
            {char.accessory !== "none" && (
              <ColorRow label={`${char.accessory} Color`} value={char.auraColor} onChange={v => set("auraColor", v)} />
            )}
            {char.accessory !== "none" && (
              <div className="flex gap-2 flex-wrap">
                {["#00f2ff","#ff3366","#ffd700","#9400d3","#00ff88","#ff6600","#ffffff","#ff1493"].map(hex => (
                  <button key={hex} onClick={() => set("auraColor", hex)}
                    className="w-7 h-7 rounded-full border-2 transition-all active:scale-90"
                    style={{ background: hex, borderColor: char.auraColor === hex ? "#6366f1" : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "BG" && (
          <>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Background Style</p>
            <StyleGrid items={BG_STYLES} value={char.bgStyle} onChange={v => set("bgStyle", v)} />
            {char.bgStyle !== "none" && (
              <ColorRow label="Background Color" value={char.bgColor} onChange={v => set("bgColor", v)} />
            )}
            {char.bgStyle !== "none" && (
              <div className="flex gap-2 flex-wrap">
                {["#0d0d2e","#1a0028","#002200","#1a0000","#001a1a","#0a0a0a","#1a1a00","#000033"].map(hex => (
                  <button key={hex} onClick={() => set("bgColor", hex)}
                    className="w-7 h-7 rounded-lg border-2 transition-all active:scale-90"
                    style={{ background: hex, borderColor: char.bgColor === hex ? "#6366f1" : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Download at bottom too */}
        <button
          onClick={downloadPNG}
          disabled={downloading}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5,#7c3aed)" }}
        >
          <Download size={18} />
          {downloading ? "Downloading..." : "PNG Download Karo ⬇️"}
        </button>
      </div>
    </div>
  );
}
