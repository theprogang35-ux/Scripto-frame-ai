import { useEffect, useState } from "react";

const WIKIPEDIA_TITLE_OVERRIDES: Record<string, string> = {
  blackbeard: "Blackbeard",
  aizen: "Sōsuke Aizen",
  hange: "Hange Zoë",
  allmight: "All Might",
  captainamerica: "Captain America",
  blackwidow: "Black Widow",
  blackpanther: "Black Panther",
  scarletwitch: "Scarlet Witch",
  spiderman: "Spider-Man",
  groot: "Groot",
};

const imageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

function getWikipediaTitle(id: string, name: string) {
  return WIKIPEDIA_TITLE_OVERRIDES[id] || name;
}

async function loadCharacterImage(id: string, name: string): Promise<string | null> {
  if (imageCache.has(id)) return imageCache.get(id) ?? null;

  const pending = pendingRequests.get(id);
  if (pending) return pending;

  const title = getWikipediaTitle(id, name).replace(/\s+/g, "_");
  const request = fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { Accept: "application/json" } },
  )
    .then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json();
      return data?.thumbnail?.source || data?.originalimage?.source || null;
    })
    .catch(() => null)
    .then((source) => {
      imageCache.set(id, source);
      pendingRequests.delete(id);
      return source;
    });

  pendingRequests.set(id, request);
  return request;
}

interface CharacterPortraitProps {
  id: string;
  name: string;
  className?: string;
  imageClassName?: string;
}

export function CharacterPortrait({
  id,
  name,
  className = "h-12 w-12 rounded-xl",
  imageClassName = "object-contain",
}: CharacterPortraitProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(() => imageCache.get(id) ?? null);

  useEffect(() => {
    let active = true;

    loadCharacterImage(id, name).then((source) => {
      if (active) setImageUrl(source);
    });

    return () => {
      active = false;
    };
  }, [id, name]);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-violet-300/15 bg-gradient-to-br from-[#21163f] via-slate-900 to-[#082b38] shadow-[0_8px_24px_rgba(2,6,23,0.34)] ${className}`}
      aria-label={`${name} portrait`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} portrait`}
          className={`h-full w-full ${imageClassName}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            imageCache.set(id, null);
            setImageUrl(null);
          }}
        />
      ) : (
          <span className="text-sm font-bold leading-none tracking-wider text-purple-100" aria-hidden="true">
          {name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}