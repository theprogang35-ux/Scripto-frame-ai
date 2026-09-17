import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Wand2, ChevronRight, Image as ImageIcon, Palette,
  Download, RefreshCw, Sparkles, Upload, RotateCw, Sun, Contrast, CircleOff, X
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const EDIT_FILTERS = {
  original: { label: "Original", css: "none", icon: CircleOff },
  bright: { label: "Bright", css: "brightness(1.18) saturate(1.08)", icon: Sun },
  contrast: { label: "Contrast", css: "contrast(1.25)", icon: Contrast },
  mono: { label: "B&W", css: "grayscale(1)", icon: CircleOff },
} as const;

type EditFilter = keyof typeof EDIT_FILTERS;

type PuterImageOptions = {
  provider: "openai-image-generation";
  model: "gpt-image-1-mini";
  quality: "low";
  input_image?: string;
};

type PuterApi = {
  ai: {
    txt2img: (prompt: string, options?: PuterImageOptions) => Promise<HTMLImageElement>;
  };
};

declare global {
  interface Window {
    puter?: PuterApi;
  }
}

const PUTER_SCRIPT_SRC = "https://js.puter.com/v2/";

function loadPuter(): Promise<PuterApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Image provider is only available in a browser."));
  }
  if (window.puter?.ai?.txt2img) return Promise.resolve(window.puter);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PUTER_SCRIPT_SRC}"]`);
    const checkReady = () => {
      if (window.puter?.ai?.txt2img) {
        resolve(window.puter);
      } else {
        reject(new Error("Puter image service could not be loaded. Check your internet connection and try again."));
      }
    };

    if (existing) {
      existing.addEventListener("load", checkReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("Puter image service could not be loaded.")), { once: true });
      window.setTimeout(checkReady, 1500);
      return;
    }

    const script = document.createElement("script");
    script.src = PUTER_SCRIPT_SRC;
    script.async = true;
    script.onload = checkReady;
    script.onerror = () => reject(new Error("Puter image service could not be loaded. Check your internet connection and try again."));
    document.head.appendChild(script);
  });
}

function GeneratingLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020208]">
      <div className="relative w-56 h-56 flex items-center justify-center">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: `${55 + i * 34}px`,
              height: `${55 + i * 34}px`,
              borderColor: `rgba(${147 - i * 12}, ${51 + i * 18}, 234, ${0.9 - i * 0.15})`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 3 + i * 0.7, repeat: Infinity, ease: "linear" }}
          />
        ))}
        <motion.div
          className="w-14 h-14 rounded-full"
          style={{ background: "radial-gradient(circle, #9333ea 0%, #00f2ff55 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </div>
      <motion.p className="text-purple-300 font-bold text-base mt-5" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
        AI Image Generate Ho Rahi Hai...
      </motion.p>
      <p className="text-gray-600 text-xs mt-1">Gemini AI kaam kar raha hai ✨</p>
    </div>
  );
}

type Screen = "main" | "photo-sub" | "image-gen" | "photo-editor";

export function CreateEditPage() {
  const [, setLocation] = useLocation();
  const [screen, setScreen] = useState<Screen>("main");

  // Image gen state
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [generationReferencePhoto, setGenerationReferencePhoto] = useState<string | null>(null);
  const [generationReferenceFileName, setGenerationReferenceFileName] = useState("");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("edited-photo.png");
  const [editFilter, setEditFilter] = useState<EditFilter>("original");
  const [rotation, setRotation] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const generationPhotoInputRef = useRef<HTMLInputElement>(null);
  const photopeaRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("scripto-pending-photo");
      if (!pending) return;
      const parsed = JSON.parse(pending) as { dataUrl?: string; name?: string };
      if (typeof parsed.dataUrl === "string" && parsed.dataUrl.startsWith("data:image/")) {
        setUploadedPhoto(parsed.dataUrl);
        setUploadedFileName(parsed.name || "edited-photo.png");
        setScreen("photo-editor");
      }
      sessionStorage.removeItem("scripto-pending-photo");
    } catch {
      sessionStorage.removeItem("scripto-pending-photo");
    }
  }, []);

  useEffect(() => {
    if (screen !== "photo-editor" || !uploadedPhoto) return;
    const timer = window.setTimeout(() => {
      photopeaRef.current?.contentWindow?.postMessage(
        { action: "open", files: [uploadedPhoto] },
        "https://www.photopea.com",
      );
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [screen, uploadedPhoto]);

  function goBack() {
    if (screen === "main") { setLocation("/studio"); return; }
    if (screen === "photo-sub") { setScreen("main"); return; }
    if (screen === "image-gen" || screen === "photo-editor") { setScreen("photo-sub"); return; }
  }

  function handlePhotoSelected(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo must be smaller than 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Photo could not be read.");
        return;
      }
      setUploadedPhoto(reader.result);
      setUploadedFileName(file.name || "edited-photo.png");
      setEditFilter("original");
      setRotation(0);
      setScreen("photo-editor");
      toast.success("Photo ready to edit.");
    };
    reader.onerror = () => toast.error("Photo could not be read.");
    reader.readAsDataURL(file);
  }

  function clearUploadedPhoto() {
    setUploadedPhoto(null);
    setUploadedFileName("edited-photo.png");
    setEditFilter("original");
    setRotation(0);
    setScreen("photo-sub");
  }

  async function handleGenerationPhotoSelected(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a photo image.");
      return;
    }
    if (file.size > 18 * 1024 * 1024) {
      toast.error("Photo must be smaller than 18 MB.");
      return;
    }

    try {
      let dataUrl: string;
      if (file.size <= 6 * 1024 * 1024) {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Photo could not be read."));
          reader.onerror = () => reject(new Error("Photo could not be read."));
          reader.readAsDataURL(file);
        });
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result !== "string") {
              reject(new Error("Photo could not be read."));
              return;
            }
            const image = new Image();
            image.onload = () => {
              const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
              canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
              const context = canvas.getContext("2d");
              if (!context) {
                reject(new Error("Photo could not be prepared."));
                return;
              }
              context.drawImage(image, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL("image/jpeg", 0.86));
            };
            image.onerror = () => reject(new Error("Photo could not be loaded."));
            image.src = reader.result;
          };
          reader.onerror = () => reject(new Error("Photo could not be read."));
          reader.readAsDataURL(file);
        });
      }

      setGenerationReferencePhoto(dataUrl);
      setGenerationReferenceFileName(file.name || "reference-photo");
      setImageError(null);
      toast.success(`${file.name || "Photo"} prompt ke saath attach ho gayi.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Photo could not be prepared.");
    }
  }

  function clearGenerationReferencePhoto() {
    setGenerationReferencePhoto(null);
    setGenerationReferenceFileName("");
  }

  function downloadEditedPhoto() {
    if (!uploadedPhoto) return;
    const image = new Image();
    image.onload = () => {
      const quarterTurn = rotation % 180 !== 0;
      const canvas = document.createElement("canvas");
      canvas.width = quarterTurn ? image.naturalHeight : image.naturalWidth;
      canvas.height = quarterTurn ? image.naturalWidth : image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        toast.error("Could not prepare the edited photo.");
        return;
      }

      context.filter = EDIT_FILTERS[editFilter].css;
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

      const link = document.createElement("a");
      link.download = `edited-${uploadedFileName.replace(/\.[^/.]+$/, "")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Edited photo downloaded.");
    };
    image.onerror = () => toast.error("Could not load the photo for download.");
    image.src = uploadedPhoto;
  }

  async function handleGenerate() {
    if (!description.trim()) { toast.error("Pehle description likho!"); return; }
    setGenerating(true);
    setImageError(null);
    try {
      const puter = await loadPuter();
      const prompt = generationReferencePhoto
        ? `Use the attached photo as the main visual reference. Follow this instruction: ${description}. Preserve important subject details unless the instruction asks to change them.`
        : description;
      const image = await puter.ai.txt2img(prompt, {
        provider: "openai-image-generation",
        model: "gpt-image-1-mini",
        quality: "low",
        ...(generationReferencePhoto ? { input_image: generationReferencePhoto } : {}),
      });
      if (image?.src) {
        setGeneratedImage(image.src);
        toast.success("Image ban gayi! 🎨");
      } else {
        throw new Error("Image response empty hai. Dobara try karo.");
      }
    } catch (error) {
      const providerMessage = error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : "";
      const message = providerMessage
        || (error instanceof Error ? error.message : "Puter image generation failed");
      setImageError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  const headerTitle: Record<Screen, string> = {
    main: "Create & Edit",
    "photo-sub": "Photo Edit & Image Generation",
    "image-gen": "AI Image Generation",
    "photo-editor": "Photo Editor",
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {generating && <GeneratingLoader />}

      {/* Header — hidden when the photo editor is fullscreen */}
      {screen !== "photo-editor" && (
        <div className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-xl border-b border-purple-900/20 px-4 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-xl hover:bg-purple-900/20 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-white font-bold text-base flex-1">{headerTitle[screen]}</span>
        </div>
      )}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handlePhotoSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={generationPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleGenerationPhotoSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {/* ── MAIN: 2 options ── */}
      <AnimatePresence mode="wait">

        {screen === "main" && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 px-4 pt-6 pb-8 flex flex-col gap-4"
          >
            <p className="text-gray-500 text-sm text-center mb-2">Kya karna chahte ho?</p>

            {/* Option A: Photo Edit & Image Generation */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setScreen("photo-sub")}
              className="w-full flex items-center gap-5 p-6 rounded-3xl text-left relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(147,51,234,0.12) 0%, rgba(0,242,255,0.06) 100%)",
                border: "1px solid rgba(147,51,234,0.3)",
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(147,51,234,0.2)" }}>
                <ImageIcon size={28} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-lg">Photo Edit &</div>
                <div className="text-white font-bold text-lg">Image Generation</div>
                <div className="text-gray-500 text-sm mt-1">AI se image banao ya photo edit karo</div>
              </div>
              <ChevronRight size={22} className="text-purple-400 flex-shrink-0" />
              {/* glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #9333ea, transparent)" }} />
            </motion.button>

          </motion.div>
        )}

        {/* ── PHOTO SUB-OPTIONS ── */}
        {screen === "photo-sub" && (
          <motion.div
            key="photo-sub"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 px-4 pt-6 pb-8 flex flex-col gap-4"
          >
            <p className="text-gray-500 text-sm text-center mb-2">Kya karna chahte ho?</p>

            {/* Sub-option 1: Image Generation */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setGeneratedImage(null);
                setDescription("");
                setImageError(null);
                clearGenerationReferencePhoto();
                setScreen("image-gen");
              }}
              className="w-full flex items-center gap-5 p-6 rounded-3xl text-left relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(147,51,234,0.14) 0%, rgba(0,242,255,0.07) 100%)",
                border: "1px solid rgba(147,51,234,0.35)",
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(147,51,234,0.25)" }}>
                <Wand2 size={28} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-lg">Image Generation</div>
                <div className="text-gray-500 text-sm mt-1">Description likho — Gemini AI image banayega</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Sparkles size={11} className="text-purple-400" />
                  <span className="text-purple-400 text-xs">Anime, realistic, any style</span>
                </div>
              </div>
              <ChevronRight size={22} className="text-purple-400 flex-shrink-0" />
            </motion.button>

            {/* Sub-option 2: Photo Edit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => photoInputRef.current?.click()}
              className="w-full flex items-center gap-5 p-6 rounded-3xl text-left relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(16,185,129,0.06) 100%)",
                border: "1px solid rgba(6,182,212,0.3)",
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.2)" }}>
                <Palette size={28} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-lg">Photoshop Editor</div>
                <div className="text-gray-500 text-sm mt-1">Photoshop-style layers, filters aur tools</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-400 text-xs font-semibold">Photoshop-level Editor</span>
                </div>
              </div>
              <ChevronRight size={22} className="text-cyan-400 flex-shrink-0" />
            </motion.button>
          </motion.div>
        )}

        {/* ── IMAGE GENERATION ── */}
        {screen === "image-gen" && (
          <motion.div
            key="image-gen"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex-1 px-4 pt-4 pb-8"
          >
            {generatedImage ? (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-purple-900/30">
                  <img src={generatedImage} alt="Generated" className="w-full object-contain" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setGeneratedImage(null); setDescription(""); }}
                    className="py-3.5 rounded-2xl bg-[#111] border border-purple-900/20 text-gray-300 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={15} />
                    Naya Banao
                  </button>
                  <a
                    href={generatedImage}
                    download="ai-generated.png"
                    className="py-3.5 rounded-2xl bg-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Download size={15} />
                    Download PNG
                  </a>
                </div>
                <button
                  onClick={() => handleGenerate()}
                  disabled={generating}
                  className="w-full py-3 rounded-2xl border border-purple-900/30 text-purple-400 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  Same description se regenerate karo
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-purple-900/30 bg-[#0d0d0d] p-3">
                  {generationReferencePhoto ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={generationReferencePhoto}
                        alt="Attached reference"
                        className="h-16 w-16 rounded-xl border border-white/10 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{generationReferenceFileName}</p>
                        <p className="mt-1 text-xs text-gray-500">Prompt ke saath is photo ko reference/edit ke liye use kiya jayega.</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearGenerationReferencePhoto}
                        aria-label="Remove attached photo"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => generationPhotoInputRef.current?.click()}
                      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-purple-500/30 px-3 py-3 text-left transition-colors hover:border-purple-400/60 hover:bg-purple-500/[0.06]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
                        <Upload size={18} className="text-purple-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">Photo add karo</p>
                        <p className="mt-0.5 text-xs text-gray-500">Keyboard ke upload button ki tarah — koi bhi photo select karo</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                    Prompt / Image Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={generationReferencePhoto
                      ? "Photo ko kaise edit ya transform karna hai?\n• Background sunset kar do\n• Anime style mein convert karo\n• Blue jacket add karo"
                      : "Jaise:\n• Gojo Satoru infinity void ke andar, blue glow\n• Naruto sage mode, orange background\n• Anime girl with butterfly wings, sunset"}
                    rows={5}
                    className="w-full bg-[#0d0d0d] border border-purple-900/30 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-gray-700 outline-none focus:border-purple-500/60 resize-none"
                  />
                  <p className="text-gray-700 text-xs mt-1 text-right">{description.length}/500</p>
                </div>

                {/* Generate Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerate}
                  disabled={!description.trim() || generating}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea, #00f2ff55)" }}
                >
                  <Wand2 size={18} />
                  Generate Image ✨
                </motion.button>

                {imageError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-sm leading-5 text-amber-200"
                  >
                    <div className="font-semibold">Image generation unavailable</div>
                    <p className="mt-1 text-xs leading-5 text-amber-100/70">{imageError}</p>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#0a0a0a] border border-gray-900">
                  <p className="text-gray-600 text-xs text-center">
                    💡 Tip: Jitna detailed description doge — utni badhiya image aayegi
                  </p>
                  <p className="mt-2 text-center text-[11px] text-gray-700">
                    Puter / OpenAI image service use ho rahi hai. Photo generation ke liye third-party service ko bheji jayegi; availability aur usage limits provider par depend karti hain.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── PHOTO EDITOR ── */}
        {screen === "photo-editor" && (
          <motion.div
            key="photo-editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#090909] px-4 py-3">
              <button
                onClick={() => setScreen("photo-sub")}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-white hover:bg-white/10"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <span className="truncate text-sm font-bold text-gray-200">Photo Editor</span>
              <button
                type="button"
                onClick={clearUploadedPhoto}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                Remove photo
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
              {uploadedPhoto ? (
                <>
                  <div className="flex min-h-[68vh] overflow-hidden rounded-2xl border border-white/10 bg-[#171717]">
                    <iframe
                      ref={photopeaRef}
                      src="https://www.photopea.com"
                      title="Photoshop-style photo editor"
                      className="h-[68vh] w-full border-0"
                      allow="clipboard-read; clipboard-write"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{uploadedFileName}</p>
                      <p className="text-xs text-gray-500">Photopea Photoshop-style editor mein open ki gayi hai.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRotation((value) => (value + 90) % 360)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 hover:border-cyan-400/40"
                    >
                      <RotateCw size={14} />
                      Quick rotate
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(EDIT_FILTERS) as EditFilter[]).map((filter) => {
                      const FilterIcon = EDIT_FILTERS[filter].icon;
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setEditFilter(filter)}
                          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${
                            editFilter === filter
                              ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                              : "border-white/10 bg-white/[0.03] text-gray-400 hover:text-white"
                          }`}
                        >
                          <FilterIcon size={14} />
                          {EDIT_FILTERS[filter].label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={downloadEditedPhoto}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 py-3.5 text-sm font-bold text-white"
                  >
                    <Download size={16} />
                    Download edited photo
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex min-h-[45vh] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-cyan-400/40 bg-cyan-400/[0.04] text-center"
                >
                  <Upload size={30} className="text-cyan-300" />
                  <span className="font-semibold text-white">Choose a photo to edit</span>
                  <span className="text-xs text-gray-500">JPG, PNG, WEBP — maximum 8 MB</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
