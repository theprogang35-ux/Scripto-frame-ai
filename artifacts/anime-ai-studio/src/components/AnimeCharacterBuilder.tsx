import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { useCallback, useMemo, useState } from "react";
import * as THREE from "three";
import { Check, ChevronDown, Dices, RotateCcw, Save, Sparkles } from "lucide-react";

type Gender = "boy" | "girl";
type Tab = "hairStyle" | "hairColor" | "eyeColor" | "outfit" | "bodyType";

type CharacterConfig = {
  gender: Gender;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  outfit: string;
  bodyType: string;
};

const HAIR_STYLES = [
  { id: "spiky", label: "Spiky", detail: "Sharp silhouette" },
  { id: "short", label: "Short", detail: "Clean crop" },
  { id: "long", label: "Long", detail: "Flowing lengths" },
  { id: "ponytail", label: "Ponytail", detail: "High tie" },
  { id: "messy-bun", label: "Messy Bun", detail: "Loose texture" },
];

const HAIR_COLORS = [
  { id: "#1e2430", label: "Black" },
  { id: "#34251f", label: "Dark Brown" },
  { id: "#6b422c", label: "Brown" },
  { id: "#8f969c", label: "Ash Blonde" },
  { id: "#d5aa63", label: "Blonde" },
  { id: "#9a5b38", label: "Chestnut" },
];

const EYE_COLORS = [
  { id: "#5a3424", label: "Brown" },
  { id: "#8b754d", label: "Hazel" },
  { id: "#4f94c4", label: "Blue" },
  { id: "#5f966f", label: "Green" },
  { id: "#8797a0", label: "Gray" },
  { id: "#c18b36", label: "Amber" },
];

const OUTFITS = [
  { id: "casual", label: "Casual T-shirt", short: "T-shirt", color: "#cf6b55", accent: "#f2c3a9" },
  { id: "fighter", label: "Fighter Gi", short: "Fighter Gi", color: "#506a91", accent: "#d9b37f" },
  { id: "school", label: "School Uniform", short: "School", color: "#35485b", accent: "#b9cfda" },
  { id: "hoodie", label: "Hoodie Jacket", short: "Hoodie", color: "#6d587d", accent: "#dbcde4" },
];

const BODY_TYPES = [
  { id: "slim", label: "Slim", detail: "Light frame" },
  { id: "athletic", label: "Athletic", detail: "Balanced build" },
  { id: "muscular", label: "Muscular", detail: "Broad shoulders" },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "hairStyle", label: "Hair Style" },
  { id: "hairColor", label: "Hair Color" },
  { id: "eyeColor", label: "Eye Color" },
  { id: "outfit", label: "Outfit" },
  { id: "bodyType", label: "Body Type" },
];

const DEFAULTS: Record<Gender, CharacterConfig> = {
  boy: {
    gender: "boy",
    hairStyle: "spiky",
    hairColor: "#1e2430",
    eyeColor: "#5a3424",
    outfit: "fighter",
    bodyType: "athletic",
  },
  girl: {
    gender: "girl",
    hairStyle: "long",
    hairColor: "#34251f",
    eyeColor: "#8b754d",
    outfit: "casual",
    bodyType: "slim",
  },
};

const tabStorageKey = "anime-ai-studio-character";

function getHairColor(hex: string) {
  return hex;
}

function Mannequin({ config }: { config: CharacterConfig }) {
  const outfit = OUTFITS.find((item) => item.id === config.outfit) ?? OUTFITS[0];
  const body = BODY_TYPES.find((item) => item.id === config.bodyType) ?? BODY_TYPES[1];
  const hairColor = getHairColor(config.hairColor);
  const eyeColor = config.eyeColor;
  const isGirl = config.gender === "girl";
  const bodyScale = body.id === "slim" ? 0.87 : body.id === "muscular" ? 1.12 : 1;
  const shoulder = body.id === "slim" ? 0.56 : body.id === "muscular" ? 0.83 : 0.7;
  const torsoWidth = body.id === "slim" ? 0.72 : body.id === "muscular" ? 1.03 : 0.88;
  const legWidth = body.id === "muscular" ? 0.22 : 0.17;
  const skin = isGirl ? "#edb59d" : "#e7aa8e";

  return (
    <group position={[0, -1.03, 0]} scale={[bodyScale, bodyScale, bodyScale]}>
      <group position={[0, 2.68, 0]}>
        <mesh castShadow position={[0, 0, 0]}>
          <sphereGeometry args={[0.56, 32, 24]} />
          <meshStandardMaterial color={skin} roughness={0.72} />
        </mesh>
        <mesh position={[-0.205, -0.01, 0.49]} scale={[0.085, 0.11, 0.055]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#f1f0e9" roughness={0.4} />
        </mesh>
        <mesh position={[0.205, -0.01, 0.49]} scale={[0.085, 0.11, 0.055]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color="#f1f0e9" roughness={0.4} />
        </mesh>
        <mesh position={[-0.205, -0.01, 0.535]} scale={[0.042, 0.067, 0.028]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.35} />
        </mesh>
        <mesh position={[0.205, -0.01, 0.535]} scale={[0.042, 0.067, 0.028]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.35} />
        </mesh>
        <mesh position={[-0.19, 0.02, 0.56]} scale={[0.014, 0.021, 0.009]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#f6f2e8" />
        </mesh>
        <mesh position={[0.22, 0.02, 0.56]} scale={[0.014, 0.021, 0.009]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#f6f2e8" />
        </mesh>
        <mesh position={[0, -0.2, 0.545]} scale={[0.07, 0.025, 0.02]} rotation={[0.1, 0, 0]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color="#b7676a" roughness={0.6} />
        </mesh>

        <group position={[0, 0.36, -0.04]}>
          <mesh position={[0, 0.13, 0]} scale={[0.61, 0.32, 0.61]} castShadow>
            <sphereGeometry args={[1, 32, 22]} />
            <meshStandardMaterial color={hairColor} roughness={0.64} />
          </mesh>
          {config.hairStyle === "spiky" && (
            <group>
              {[-0.42, -0.24, -0.06, 0.12, 0.3, 0.46].map((x, index) => (
                <mesh key={x} position={[x, 0.5 + (index % 2) * 0.08, 0.03]} rotation={[0, 0, x * -0.32]} scale={[0.14, 0.42, 0.2]} castShadow>
                  <coneGeometry args={[1, 2, 5]} />
                  <meshStandardMaterial color={hairColor} roughness={0.62} />
                </mesh>
              ))}
            </group>
          )}
          {config.hairStyle === "short" && (
            <mesh position={[0, 0.28, 0.48]} scale={[0.57, 0.2, 0.18]} rotation={[-0.25, 0, 0]} castShadow>
              <sphereGeometry args={[1, 24, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.62} />
            </mesh>
          )}
          {(config.hairStyle === "long" || config.hairStyle === "ponytail") && (
            <>
              <mesh position={[-0.49, -0.22, 0]} scale={[0.2, 0.72, 0.2]} castShadow>
                <capsuleGeometry args={[0.7, 1.2, 8, 16]} />
                <meshStandardMaterial color={hairColor} roughness={0.64} />
              </mesh>
              <mesh position={[0.49, -0.22, 0]} scale={[0.2, 0.72, 0.2]} castShadow>
                <capsuleGeometry args={[0.7, 1.2, 8, 16]} />
                <meshStandardMaterial color={hairColor} roughness={0.64} />
              </mesh>
            </>
          )}
          {config.hairStyle === "ponytail" && (
            <mesh position={[0, 0.55, -0.42]} rotation={[0.32, 0, 0]} scale={[0.27, 0.8, 0.27]} castShadow>
              <capsuleGeometry args={[0.7, 1.2, 8, 16]} />
              <meshStandardMaterial color={hairColor} roughness={0.64} />
            </mesh>
          )}
          {config.hairStyle === "messy-bun" && (
            <group position={[0, 0.63, -0.03]}>
              {[[-0.18, 0, 0], [0.06, 0.08, 0], [0.23, -0.02, 0]].map((position, index) => (
                <mesh key={index} position={position as [number, number, number]} scale={[0.25, 0.28, 0.25]} castShadow>
                  <dodecahedronGeometry args={[1, 1]} />
                  <meshStandardMaterial color={hairColor} roughness={0.64} />
                </mesh>
              ))}
            </group>
          )}
          <mesh position={[0, 0.1, 0.5]} scale={[0.57, 0.25, 0.16]} rotation={[-0.25, 0, 0]} castShadow>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={hairColor} roughness={0.62} />
          </mesh>
          {config.hairStyle === "spiky" && (
            <mesh position={[0, 0.38, 0.5]} scale={[0.18, 0.32, 0.14]} rotation={[0.15, 0, 0]}>
              <coneGeometry args={[1, 1.7, 5]} />
              <meshStandardMaterial color={hairColor} roughness={0.62} />
            </mesh>
          )}
        </group>
      </group>

      <mesh position={[0, 1.66, 0]} scale={[0.22, 0.34, 0.22]}>
        <cylinderGeometry args={[0.9, 1, 12, 1]} />
        <meshStandardMaterial color={skin} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.03, 0]} scale={[torsoWidth, 0.72, 0.48]} castShadow>
        <capsuleGeometry args={[0.6, 0.8, 8, 18]} />
        <meshStandardMaterial color={outfit.color} roughness={0.72} />
      </mesh>
      {outfit.id === "school" && (
        <mesh position={[0, 1.54, 0.5]} rotation={[0.25, 0, 0]} scale={[0.3, 0.24, 0.04]}>
          <coneGeometry args={[1, 1, 4]} />
          <meshStandardMaterial color={outfit.accent} roughness={0.55} />
        </mesh>
      )}
      {outfit.id === "fighter" && (
        <mesh position={[0, 1.1, 0.51]} scale={[0.06, 0.5, 0.03]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={outfit.accent} roughness={0.45} />
        </mesh>
      )}
      {outfit.id === "hoodie" && (
        <mesh position={[0, 1.47, 0.09]} scale={[0.35, 0.25, 0.33]}>
          <torusGeometry args={[0.72, 0.12, 10, 24, Math.PI]} />
          <meshStandardMaterial color={outfit.accent} roughness={0.7} />
        </mesh>
      )}
      {outfit.id === "casual" && (
        <mesh position={[0, 1.15, 0.5]} scale={[0.13, 0.14, 0.04]}>
          <torusGeometry args={[0.7, 0.13, 8, 18]} />
          <meshStandardMaterial color={outfit.accent} roughness={0.5} />
        </mesh>
      )}
      <mesh position={[-shoulder - 0.1, 1.1, 0]} rotation={[0, 0, -0.16]} scale={[0.19, 0.62, 0.19]} castShadow>
        <capsuleGeometry args={[0.55, 1, 8, 14]} />
        <meshStandardMaterial color={outfit.color} roughness={0.75} />
      </mesh>
      <mesh position={[shoulder + 0.1, 1.1, 0]} rotation={[0, 0, 0.16]} scale={[0.19, 0.62, 0.19]} castShadow>
        <capsuleGeometry args={[0.55, 1, 8, 14]} />
        <meshStandardMaterial color={outfit.color} roughness={0.75} />
      </mesh>
      <mesh position={[-0.25, 0.05, 0]} scale={[legWidth, 0.78, legWidth * 1.1]} castShadow>
        <capsuleGeometry args={[0.5, 1.2, 8, 14]} />
        <meshStandardMaterial color="#20293a" roughness={0.78} />
      </mesh>
      <mesh position={[0.25, 0.05, 0]} scale={[legWidth, 0.78, legWidth * 1.1]} castShadow>
        <capsuleGeometry args={[0.5, 1.2, 8, 14]} />
        <meshStandardMaterial color="#20293a" roughness={0.78} />
      </mesh>
      <mesh position={[-0.27, -0.79, 0.12]} scale={[0.28, 0.13, 0.46]} castShadow>
        <capsuleGeometry args={[0.5, 0.7, 8, 14]} />
        <meshStandardMaterial color="#161c28" roughness={0.62} />
      </mesh>
      <mesh position={[0.27, -0.79, 0.12]} scale={[0.28, 0.13, 0.46]} castShadow>
        <capsuleGeometry args={[0.5, 0.7, 8, 14]} />
        <meshStandardMaterial color="#161c28" roughness={0.62} />
      </mesh>
    </group>
  );
}

function canUseWebGL() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function StaticPreview({ config }: { config: CharacterConfig }) {
  const outfit = OUTFITS.find((item) => item.id === config.outfit) ?? OUTFITS[0];
  const body = BODY_TYPES.find((item) => item.id === config.bodyType) ?? BODY_TYPES[1];
  const hairLength = config.hairStyle === "long" || config.hairStyle === "ponytail" ? "h-28" : "h-14";
  const bodyWidth = body.id === "slim" ? "w-28" : body.id === "muscular" ? "w-40" : "w-36";

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="absolute bottom-8 h-9 w-40 rounded-[50%] bg-[#c4c7d1]/55 blur-md" />
      <div className="relative mt-3 flex flex-col items-center" aria-label="Anime character preview">
        <div className="relative z-10 h-24 w-24 rounded-[48%] bg-[#edb59d] shadow-[inset_-8px_-6px_0_rgba(129,76,79,0.12)]">
          <div
            className={`absolute -top-3 left-1/2 w-28 -translate-x-1/2 rounded-[48%_48%_35%_35%] ${hairLength}`}
            style={{ backgroundColor: config.hairColor }}
          />
          <div className="absolute left-5 top-10 h-5 w-4 rounded-full border-2 border-[#f1f0e9] bg-white shadow-[24px_0_0_-2px_#fff]" />
          <div className="absolute left-[23px] top-[45px] h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.eyeColor, boxShadow: "24px 0 0 currentColor" }} />
          <div className="absolute bottom-5 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-[#b7676a]" />
        </div>
        <div className={`relative mt-[-2px] ${bodyWidth} rounded-[42%_42%_24%_24%] pb-24 pt-8 shadow-[inset_-10px_-8px_0_rgba(0,0,0,0.12)]`} style={{ backgroundColor: outfit.color }}>
          <div className="mx-auto h-12 w-4 rounded-b-full bg-[#edb59d]" />
          <div className="absolute -bottom-20 left-1/2 flex -translate-x-1/2 gap-5">
            <div className="h-24 w-8 rounded-full bg-[#20293a]" />
            <div className="h-24 w-8 rounded-full bg-[#20293a]" />
          </div>
        </div>
        <p className="mt-24 rounded-full bg-white/70 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#8a8b98]">
          WebGL preview unavailable
        </p>
        <p className="mt-1 text-[11px] text-[#a0a1ad]">The interactive 3D view will appear in a WebGL-enabled browser.</p>
      </div>
    </div>
  );
}

function Preview({ config }: { config: CharacterConfig }) {
  const previewBackground = useMemo(() => new THREE.Color("#eeedf3"), []);
  const webglAvailable = useMemo(canUseWebGL, []);

  return (
    <div className="relative h-[420px] min-h-[360px] w-full overflow-hidden rounded-[1.45rem] border border-[#d8d9e3] bg-[#eeedf3] md:h-full">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.9),transparent_39%),linear-gradient(145deg,rgba(247,244,242,0.5),rgba(211,215,228,0.55))]" />
      <div className="absolute left-5 top-5 z-20">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#7e8191]">Live preview</p>
        <p className="mt-1 text-xs text-[#9b9baa]">Drag to rotate · scroll to zoom</p>
      </div>
      <div className="absolute bottom-5 left-1/2 z-20 h-9 w-40 -translate-x-1/2 rounded-[50%] bg-[#c4c7d1]/55 blur-md" />
      {webglAvailable ? (
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1.2, 5.2], fov: 35 }}>
          <color attach="background" args={[previewBackground]} />
          <ambientLight intensity={1.5} />
          <directionalLight castShadow position={[3, 4, 4]} intensity={2.2} color="#fff8f1" shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-3, 1, 2]} intensity={1.1} color="#b8c9ff" />
          <Environment preset="studio" />
          <Mannequin config={config} />
          <ContactShadows position={[0, -1.85, 0]} opacity={0.22} scale={3.3} blur={2.5} far={3} />
          <OrbitControls enablePan={false} minDistance={3.5} maxDistance={7} target={[0, 0.9, 0]} />
        </Canvas>
      ) : (
        <StaticPreview config={config} />
      )}
    </div>
  );
}

function OptionButton({
  selected,
  label,
  detail,
  swatch,
  onClick,
  testId,
}: {
  selected: boolean;
  label: string;
  detail?: string;
  swatch?: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testId}
      className={`group flex min-h-[52px] items-center gap-3 rounded-xl border px-3 text-left transition-transform duration-200 active:scale-[0.98] ${
        selected
          ? "border-[#ef795f] bg-[#fff1ec] text-[#2f3040]"
          : "border-[#e3e3eb] bg-[#fcfbfa] text-[#777987] hover:border-[#c8cad8] hover:bg-white"
      }`}
    >
      {swatch ? <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: swatch }} /> : null}
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-xs font-semibold ${selected ? "text-[#343443]" : "text-[#555765]"}`}>{label}</span>
        {detail ? <span className="mt-0.5 block truncate text-[10px] text-[#a1a2ad]">{detail}</span> : null}
      </span>
      {selected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[#ed755b]" /> : null}
    </button>
  );
}

export function AnimeCharacterBuilder() {
  const [config, setConfig] = useState<CharacterConfig>(DEFAULTS.boy);
  const [activeTab, setActiveTab] = useState<Tab>("hairStyle");
  const [toast, setToast] = useState("");
  const [isGenderOpen, setIsGenderOpen] = useState(false);

  const announce = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const updateConfig = useCallback(<K extends keyof CharacterConfig>(key: K, value: CharacterConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  }, []);

  const selectGender = (gender: Gender) => {
    setConfig(DEFAULTS[gender]);
    setIsGenderOpen(false);
    announce(`${gender === "boy" ? "Boy" : "Girl"} defaults loaded`);
  };

  const reset = () => {
    setConfig(DEFAULTS[config.gender]);
    announce("Character reset to defaults");
  };

  const randomize = () => {
    const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
    setConfig({
      gender: config.gender,
      hairStyle: pick(HAIR_STYLES).id,
      hairColor: pick(HAIR_COLORS).id,
      eyeColor: pick(EYE_COLORS).id,
      outfit: pick(OUTFITS).id,
      bodyType: pick(BODY_TYPES).id,
    });
    announce("A fresh character was generated");
  };

  const save = () => {
    window.localStorage.setItem(tabStorageKey, JSON.stringify({ ...config, savedAt: new Date().toISOString() }));
    announce("Character saved to this browser");
  };

  const activeOptions = useMemo(() => {
    if (activeTab === "hairStyle") return HAIR_STYLES;
    if (activeTab === "hairColor") return HAIR_COLORS;
    if (activeTab === "eyeColor") return EYE_COLORS;
    if (activeTab === "outfit") return OUTFITS;
    return BODY_TYPES;
  }, [activeTab]);

  const activeValue = config[activeTab === "hairStyle" ? "hairStyle" : activeTab === "hairColor" ? "hairColor" : activeTab === "eyeColor" ? "eyeColor" : activeTab === "outfit" ? "outfit" : "bodyType"];

  return (
    <section data-testid="anime-character-builder" className="relative isolate overflow-hidden rounded-[1.75rem] border border-[#dedee8] bg-[#f8f7f5] p-3 text-[#343443] shadow-[0_20px_65px_rgba(49,51,79,0.09)] sm:p-5 lg:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-64 w-64 rounded-full bg-[#f7c9b9]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 -z-10 h-64 w-64 rounded-full bg-[#c9d6f3]/35 blur-3xl" />
      <header className="flex flex-col gap-4 border-b border-[#e5e4ea] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e67b62]">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Character lab / 03
          </div>
          <h2 className="font-[var(--app-font-serif)] text-2xl font-semibold tracking-[-0.04em] text-[#2c2d3a] sm:text-3xl">Build your character</h2>
          <p className="mt-1.5 max-w-md text-xs leading-5 text-[#858694]">Shape an anime-inspired 3D mannequin, then orbit around every detail before you save.</p>
        </div>
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            data-testid="button-gender-selector"
            aria-haspopup="listbox"
            aria-expanded={isGenderOpen}
            onClick={() => setIsGenderOpen((open) => !open)}
            className="flex min-w-[154px] items-center justify-between gap-4 rounded-xl border border-[#dedee8] bg-white px-3.5 py-2.5 text-left shadow-sm transition-colors hover:border-[#c5c6d2]"
          >
            <span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-[#a3a4af]">Model base</span>
              <span className="mt-0.5 block text-sm font-semibold text-[#3a3b4a]">{config.gender === "boy" ? "Boy" : "Girl"}</span>
            </span>
            <ChevronDown aria-hidden="true" className={`h-4 w-4 text-[#8d8f9d] transition-transform ${isGenderOpen ? "rotate-180" : ""}`} />
          </button>
          {isGenderOpen ? (
            <div role="listbox" className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-full min-w-[154px] rounded-xl border border-[#dedee8] bg-white p-1.5 shadow-[0_14px_30px_rgba(39,40,66,0.14)]">
              {(["boy", "girl"] as Gender[]).map((gender) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={config.gender === gender}
                  data-testid={`button-gender-${gender}`}
                  key={gender}
                  onClick={() => selectGender(gender)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#555765] hover:bg-[#fff1ec]"
                >
                  {gender === "boy" ? "Boy" : "Girl"}
                  {config.gender === gender ? <Check aria-hidden="true" className="h-3.5 w-3.5 text-[#e8755d]" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(250px,0.84fr)_minmax(400px,1.16fr)]">
        <div className="order-2 rounded-[1.35rem] border border-[#e3e2e9] bg-white/75 p-3 sm:p-4 lg:order-1">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b9ca8]">Customize</p>
              <p className="mt-1 text-sm font-semibold text-[#414250]">Fine tune the silhouette</p>
            </div>
            <span className="rounded-full bg-[#f1f0f5] px-2 py-1 font-mono text-[9px] text-[#9899a5]">05 options</span>
          </div>
          <div role="tablist" aria-label="Character customization" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-[#ecebf0] pb-2">
            {TABS.map((tab) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                data-testid={`tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-lg px-2.5 py-2 text-[10px] font-semibold transition-colors ${activeTab === tab.id ? "bg-[#343443] text-white" : "text-[#9293a0] hover:bg-[#f2f1f5] hover:text-[#555765]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2" role="tabpanel" aria-label={`${activeTab} options`}>
            {activeOptions.map((option) => {
              const item = option as { id: string; label: string; detail?: string; short?: string };
              return (
                <OptionButton
                  key={item.id}
                  selected={activeValue === item.id}
                  label={item.label}
                  detail={item.detail ?? item.short}
                  swatch={activeTab === "hairColor" || activeTab === "eyeColor" ? item.id : undefined}
                  onClick={() => updateConfig(activeTab === "hairStyle" ? "hairStyle" : activeTab === "hairColor" ? "hairColor" : activeTab === "eyeColor" ? "eyeColor" : activeTab === "outfit" ? "outfit" : "bodyType", item.id)}
                  testId={`option-${activeTab}-${item.id}`}
                />
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-[#f4f3f6] px-3 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#a0a1ac]">Current preset</p>
            <p data-testid="text-current-preset" className="mt-1 text-xs font-semibold text-[#5d5e6b]">
              {config.gender === "boy" ? "Boy" : "Girl"} / {OUTFITS.find((item) => item.id === config.outfit)?.short} / {BODY_TYPES.find((item) => item.id === config.bodyType)?.label}
            </p>
          </div>
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <Preview config={config} />
        </div>
      </div>

      <footer className="mt-4 flex flex-col gap-2 border-t border-[#e5e4ea] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="hidden text-[10px] text-[#a1a2ad] sm:block">Your last saved look stays in this browser.</p>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <button type="button" data-testid="button-reset-character" onClick={reset} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e0dfe7] bg-white px-3 py-2.5 text-xs font-semibold text-[#676875] transition-colors hover:border-[#c5c6d2] hover:text-[#3f4050]">
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Reset
          </button>
          <button type="button" data-testid="button-randomize-character" onClick={randomize} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e0dfe7] bg-white px-3 py-2.5 text-xs font-semibold text-[#676875] transition-colors hover:border-[#c5c6d2] hover:text-[#3f4050]">
            <Dices aria-hidden="true" className="h-3.5 w-3.5" /> Randomize
          </button>
          <button type="button" data-testid="button-save-character" onClick={save} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#343443] px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_6px_15px_rgba(52,52,67,0.18)] transition-transform hover:-translate-y-0.5 active:translate-y-0">
            <Save aria-hidden="true" className="h-3.5 w-3.5" /> Save Character
          </button>
        </div>
      </footer>

      {toast ? (
        <div role="status" data-testid="status-character-toast" className="absolute bottom-20 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#343443] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_9px_24px_rgba(52,52,67,0.2)]">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default AnimeCharacterBuilder;