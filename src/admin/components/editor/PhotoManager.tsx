import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteModal } from "@/admin/components/ConfirmDeleteModal";
import { useIsMounted } from "@/admin/hooks/use-is-mounted";
import { getErrorMessage } from "@/admin/lib/errors";
import { uploadVehiclePhoto } from "@/admin/lib/photo-upload";
import { deleteImageRow, insertImageRow, reorderImages, updateImageRow } from "@/admin/lib/vehicles-api";
import { PUBLIC_SUPABASE_URL } from "@/lib/public-env";
import { renditionUrl } from "@/lib/storage-paths";
import type { VehicleImageRow } from "@/lib/vehicle-rows";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const FOCUS_STEP = 0.02;
const FOCUS_STEP_LARGE = 0.1;

type UploadTask = { id: string; fileName: string; status: "uploading" | "error" | "done"; error?: string };

type PhotoManagerProps = {
  vehicleId: string;
  images: readonly VehicleImageRow[];
  defaultAlt: string;
  onImagesChange: (images: readonly VehicleImageRow[]) => void;
  onRevalidate: () => void;
  /** Called once every file in an upload batch has saved. Not called if any of them failed. */
  onUploadComplete?: () => void;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Multi-upload + reorder + focal-point + alt-text manager for one vehicle's photos. */
export function PhotoManager({
  vehicleId,
  images,
  defaultAlt,
  onImagesChange,
  onRevalidate,
  onUploadComplete,
}: PhotoManagerProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [pendingDelete, setPendingDelete] = useState<VehicleImageRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Image ids with an in-flight move/focus/alt request — gates the controls for that row only.
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useIsMounted();

  // The single source of truth for "what does the server currently have", updated synchronously
  // by every handler below (before any await) so concurrent operations never compute the next
  // sort_order or revert value from a stale closure of the `images` prop.
  const imagesRef = useRef<readonly VehicleImageRow[]>(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  function applyImagesUpdate(
    updater: (prev: readonly VehicleImageRow[]) => readonly VehicleImageRow[],
  ): readonly VehicleImageRow[] {
    const next = updater(imagesRef.current);
    imagesRef.current = next;
    if (isMounted()) onImagesChange(next);
    return next;
  }

  const markPending = (ids: readonly string[]) => {
    setPendingIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  };
  const clearPending = (ids: readonly string[]) => {
    setPendingIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  };

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setIsUploading(true);
    let failedCount = 0;

    try {
      for (const file of files) {
        const taskId = crypto.randomUUID();
        setTasks(prev => [...prev, { id: taskId, fileName: file.name, status: "uploading" }]);
        try {
          const uploaded = await uploadVehiclePhoto(file, vehicleId);
          // Read the live count at insert time, not a count captured before the loop started.
          const sortOrder = imagesRef.current.length;
          const row = await insertImageRow({
            vehicle_id: vehicleId,
            path: uploaded.path,
            sort_order: sortOrder,
            alt: defaultAlt,
            focus_x: null,
            focus_y: null,
            focus_z: null,
            width: uploaded.width,
            height: uploaded.height,
          });
          applyImagesUpdate(prev => [...prev, row]);
          onRevalidate();
          if (isMounted()) setTasks(prev => prev.map(task => (task.id === taskId ? { ...task, status: "done" } : task)));
        } catch (err) {
          failedCount += 1;
          if (isMounted()) {
            setTasks(prev =>
              prev.map(task =>
                task.id === taskId ? { ...task, status: "error", error: getErrorMessage(err) } : task,
              ),
            );
          }
        }
      }
    } finally {
      if (isMounted()) setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (failedCount === 0 && isMounted()) onUploadComplete?.();
  };

  const handleMove = async (image: VehicleImageRow, direction: -1 | 1) => {
    if (pendingIds.has(image.id) || isUploading) return;
    const sorted = [...imagesRef.current].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex(img => img.id === image.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const neighbour = sorted[targetIndex]!;
    const originalSelfOrder = image.sort_order;
    const originalNeighbourOrder = neighbour.sort_order;

    markPending([image.id, neighbour.id]);
    applyImagesUpdate(prev =>
      prev.map(img => {
        if (img.id === image.id) return { ...img, sort_order: originalNeighbourOrder };
        if (img.id === neighbour.id) return { ...img, sort_order: originalSelfOrder };
        return img;
      }),
    );

    const orderedRows = [...sorted];
    orderedRows[index] = neighbour;
    orderedRows[targetIndex] = image;

    try {
      await reorderImages(
        vehicleId,
        orderedRows.map(img => img.id),
      );
      onRevalidate();
    } catch (err) {
      if (isMounted()) setError(getErrorMessage(err));
      // Targeted rollback: put back only the two sort_order values that changed.
      applyImagesUpdate(prev =>
        prev.map(img => {
          if (img.id === image.id) return { ...img, sort_order: originalSelfOrder };
          if (img.id === neighbour.id) return { ...img, sort_order: originalNeighbourOrder };
          return img;
        }),
      );
    } finally {
      clearPending([image.id, neighbour.id]);
    }
  };

  const handleAltChange = (image: VehicleImageRow, alt: string) => {
    applyImagesUpdate(prev => prev.map(img => (img.id === image.id ? { ...img, alt } : img)));
  };

  const handleAltCommit = async (image: VehicleImageRow) => {
    if (pendingIds.has(image.id)) return;
    const latest = imagesRef.current.find(img => img.id === image.id);
    const altToSave = latest?.alt ?? image.alt;
    markPending([image.id]);
    try {
      await updateImageRow(image.id, { alt: altToSave });
      onRevalidate();
    } catch (err) {
      if (isMounted()) setError(getErrorMessage(err));
    } finally {
      clearPending([image.id]);
    }
  };

  const persistFocus = async (image: VehicleImageRow, x: number, y: number, z: number) => {
    if (pendingIds.has(image.id)) return;
    const original = { focus_x: image.focus_x, focus_y: image.focus_y, focus_z: image.focus_z };
    markPending([image.id]);
    applyImagesUpdate(prev => prev.map(img => (img.id === image.id ? { ...img, focus_x: x, focus_y: y, focus_z: z } : img)));

    try {
      await updateImageRow(image.id, { focus_x: x, focus_y: y, focus_z: z });
      onRevalidate();
    } catch (err) {
      if (isMounted()) setError(getErrorMessage(err));
      applyImagesUpdate(prev => prev.map(img => (img.id === image.id ? { ...img, ...original } : img)));
    } finally {
      clearPending([image.id]);
    }
  };

  const handleFocusClick = (image: VehicleImageRow, event: ReactMouseEvent<HTMLDivElement>) => {
    if (pendingIds.has(image.id)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp01((event.clientX - rect.left) / rect.width);
    const y = clamp01((event.clientY - rect.top) / rect.height);
    void persistFocus(image, x, y, image.focus_z ?? MIN_ZOOM);
  };

  const handleFocusKeyDown = (image: VehicleImageRow, event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (pendingIds.has(image.id)) return;
    const step = event.shiftKey ? FOCUS_STEP_LARGE : FOCUS_STEP;
    const currentX = image.focus_x ?? 0.5;
    const currentY = image.focus_y ?? 0.5;
    const zoom = image.focus_z ?? MIN_ZOOM;
    let nextX = currentX;
    let nextY = currentY;

    switch (event.key) {
      case "ArrowLeft":
        nextX = clamp01(currentX - step);
        break;
      case "ArrowRight":
        nextX = clamp01(currentX + step);
        break;
      case "ArrowUp":
        nextY = clamp01(currentY - step);
        break;
      case "ArrowDown":
        nextY = clamp01(currentY + step);
        break;
      case "Home":
        nextX = 0.5;
        nextY = 0.5;
        break;
      default:
        return;
    }
    event.preventDefault();
    void persistFocus(image, nextX, nextY, zoom);
  };

  const handleZoomChange = (image: VehicleImageRow, zoom: number) => {
    void persistFocus(image, image.focus_x ?? 0.5, image.focus_y ?? 0.5, zoom);
  };

  const handleConfirmDeletePhoto = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteImageRow({ id: pendingDelete.id, path: pendingDelete.path });
      applyImagesUpdate(prev => prev.filter(img => img.id !== pendingDelete.id));
      onRevalidate();
      if (isMounted()) setPendingDelete(null);
    } catch (err) {
      if (isMounted()) setError(getErrorMessage(err));
    } finally {
      if (isMounted()) setIsDeleting(false);
    }
  };

  return (
    <section className="border-t border-line pt-8">
      <h2 className="eyebrow text-champagne">Photos</h2>

      <div className="mt-6">
        <Label htmlFor="vehicle-photo-input">Upload photos</Label>
        <input
          id="vehicle-photo-input"
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          disabled={isUploading}
          onChange={event => void handleFiles(event.target.files)}
          className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-champagne file:px-4 file:py-2 file:text-ink file:eyebrow disabled:opacity-50"
        />
      </div>

      {tasks.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center gap-2">
              <Upload className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{task.fileName}</span>
              <span
                className={
                  task.status === "error" ? "text-destructive" : task.status === "done" ? "text-champagne" : "text-mist"
                }
              >
                {task.status === "uploading" ? "Uploading…" : task.status === "done" ? "Done" : task.error}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sortedImages.map((image, index) => {
          const focusX = image.focus_x ?? 0.5;
          const focusY = image.focus_y ?? 0.5;
          const zoom = image.focus_z ?? MIN_ZOOM;
          const rowPending = pendingIds.has(image.id);
          return (
            <li key={image.id} className="space-y-3 rounded-md border border-line p-4">
              <div
                role="slider"
                tabIndex={rowPending ? -1 : 0}
                aria-label={`Focal point for ${image.alt}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(focusX * 100)}
                aria-valuetext={`Focal point ${Math.round(focusX * 100)}% across, ${Math.round(focusY * 100)}% down`}
                aria-disabled={rowPending}
                onClick={event => handleFocusClick(image, event)}
                onKeyDown={event => handleFocusKeyDown(image, event)}
                className="relative aspect-4/3 cursor-crosshair overflow-hidden rounded-md bg-surface-raised outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-ink aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
              >
                <img
                  src={renditionUrl(PUBLIC_SUPABASE_URL, image.path, 480)}
                  alt=""
                  className="size-full object-cover transition-transform"
                  style={{ objectPosition: `${focusX * 100}% ${focusY * 100}%`, transform: `scale(${zoom})` }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-champagne"
                  style={{ left: `${focusX * 100}%`, top: `${focusY * 100}%` }}
                />
              </div>

              <div>
                <Label htmlFor={`alt-${image.id}`}>Alt text</Label>
                <Input
                  id={`alt-${image.id}`}
                  value={image.alt}
                  disabled={rowPending}
                  onChange={event => handleAltChange(image, event.target.value)}
                  onBlur={() => void handleAltCommit(image)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`zoom-${image.id}`}>Zoom</Label>
                <input
                  id={`zoom-${image.id}`}
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.1}
                  value={zoom}
                  disabled={rowPending}
                  onChange={event => handleZoomChange(image, Number(event.target.value))}
                  className="mt-1 w-full disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move photo earlier"
                    disabled={index === 0 || rowPending}
                    onClick={() => void handleMove(image, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move photo later"
                    disabled={index === sortedImages.length - 1 || rowPending}
                    onClick={() => void handleMove(image, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete photo"
                  disabled={rowPending}
                  onClick={() => setPendingDelete(image)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDeleteModal
        isOpen={pendingDelete !== null}
        title="Delete this photo?"
        description="This removes the photo and every stored size permanently."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDeletePhoto()}
        isDeleting={isDeleting}
      />
    </section>
  );
}
