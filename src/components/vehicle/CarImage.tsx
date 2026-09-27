import { ImageOff } from "lucide-react";
import { useCallback, useState, type CSSProperties } from "react";
import { imageSrcSet, imageUrl, sourceKey } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { ImageFocus, ImageSource } from "@/types/vehicle";

type CarImageProps = {
  source: ImageSource;
  alt: string;
  /** width / height used for cropping. Omit for the original ratio. */
  aspect?: number;
  focus?: ImageFocus;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

const DEFAULT_WIDTH = 1200;

/** Storage photos have no server-side transform (free plan): emulate the crop in CSS instead. */
function storageCropStyle(aspect: number | undefined, focus: ImageFocus | undefined): CSSProperties | undefined {
  if (!aspect && !focus) return undefined;
  const origin = focus ? `${focus.x * 100}% ${focus.y * 100}%` : undefined;
  return {
    aspectRatio: aspect ? String(aspect) : undefined,
    objectPosition: origin,
    transform: focus && focus.z > 1 ? `scale(${focus.z})` : undefined,
    transformOrigin: origin,
  };
}

/**
 * Responsive image that fades in once decoded, over a dark placeholder. Unsplash sources are
 * cropped server-side (imgix); storage sources (admin uploads) are cropped in CSS on the <img>
 * itself, never on an ancestor, so drawers and the fixed buy bar are unaffected.
 */
export function CarImage({ source, alt, aspect, focus, sizes = "100vw", priority = false, className }: CarImageProps) {
  const key = sourceKey(source);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Reset load/error state during render when the source changes, instead of an effect (see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setIsLoaded(false);
    setHasError(false);
  }

  // Stable identity so React doesn't detach/reattach the ref on every render.
  const handleImgRef = useCallback((node: HTMLImageElement | null) => {
    // Cached images can finish before React attaches onLoad.
    if (node?.complete && node.naturalWidth > 0) setIsLoaded(true);
  }, []);

  if (hasError) {
    return (
      <div role="img" aria-label={alt} className={cn("bg-surface grid place-items-center text-ivory/35", className)}>
        <ImageOff className="size-8" strokeWidth={1.25} />
      </div>
    );
  }

  const cropStyle = source.kind === "storage" ? storageCropStyle(aspect, focus) : undefined;

  return (
    <img
      src={imageUrl(source, { width: DEFAULT_WIDTH, aspect, focus })}
      srcSet={imageSrcSet(source, { aspect, focus })}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={cropStyle}
      ref={handleImgRef}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      className={cn(
        "bg-surface object-cover transition-[opacity,filter] duration-1000 ease-(--ease-luxe)",
        isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-md",
        className,
      )}
    />
  );
}
