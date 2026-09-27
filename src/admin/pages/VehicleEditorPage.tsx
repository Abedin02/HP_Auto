import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Link, navigate } from "@/lib/router";
import { validateVehicleInput, vehicleSlug, type FieldErrors } from "@/lib/vehicle-validation";
import type { VehicleImageRow } from "@/lib/vehicle-rows";
import { CharactersFields } from "@/admin/components/editor/CharactersFields";
import { DetailsFields } from "@/admin/components/editor/DetailsFields";
import { IdentityFields } from "@/admin/components/editor/IdentityFields";
import { ListingFields } from "@/admin/components/editor/ListingFields";
import { PerformanceFields } from "@/admin/components/editor/PerformanceFields";
import { PhotoManager } from "@/admin/components/editor/PhotoManager";
import { StoryHighlightsFields } from "@/admin/components/editor/StoryHighlightsFields";
import { useIsMounted } from "@/admin/hooks/use-is-mounted";
import { useSession } from "@/admin/hooks/use-session";
import { getErrorMessage } from "@/admin/lib/errors";
import { randomSlugSuffix } from "@/admin/lib/random-suffix";
import { fireRevalidate } from "@/admin/lib/revalidate";
import {
  emptyVehicleFormDefaults,
  vehicleInputToFormDefaults,
  type VehicleFormDefaults,
} from "@/admin/lib/vehicle-form";
import { getVehicleWithImages, insertVehicle, updateVehicle } from "@/admin/lib/vehicles-api";

export type VehicleEditorPageProps = { mode: "new" } | { mode: "edit"; id: string };

/** Create or edit a vehicle. Photos only attach once a vehicle row (and its uuid) exist. */
export function VehicleEditorPage(props: VehicleEditorPageProps) {
  const id = props.mode === "edit" ? props.id : null;
  const { session } = useSession();
  const isMounted = useIsMounted();

  const [form, setForm] = useState<VehicleFormDefaults | null>(() => (id ? null : emptyVehicleFormDefaults()));
  const [images, setImages] = useState<readonly VehicleImageRow[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getVehicleWithImages(id)
      .then(detail => {
        if (cancelled) return;
        if (!detail) {
          setLoadError("Vehicle not found.");
          return;
        }
        setForm(vehicleInputToFormDefaults(detail.input));
        setImages(detail.images);
      })
      .catch(err => {
        if (!cancelled) setLoadError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateField = useCallback(<K extends keyof VehicleFormDefaults>(key: K, value: VehicleFormDefaults[K]) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const notifyRevalidate = useCallback(() => {
    if (!session) return;
    fireRevalidate(session.access_token, message => {
      if (isMounted()) setNotice(message);
    });
  }, [session, isMounted]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    const result = validateVehicleInput(form);
    if (!result.ok) {
      setErrors(result.errors);
      setSubmitError("Fix the highlighted fields and try again.");
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      if (id) {
        await updateVehicle(id, result.value);
        if (isMounted()) setNotice("Saved.");
        notifyRevalidate();
      } else {
        const slug = vehicleSlug(result.value, randomSlugSuffix());
        const row = await insertVehicle(result.value, slug);
        notifyRevalidate();
        // Route to the edit page so photos can be attached to the new vehicle's uuid.
        navigate(`/admin/vehicles/${row.id}`, { replace: true });
      }
    } catch (err) {
      if (isMounted()) setSubmitError(getErrorMessage(err));
    } finally {
      if (isMounted()) setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <p role="alert" className="text-destructive">
        {loadError}
      </p>
    );
  }
  if (!form) return <p className="text-muted-foreground">Loading vehicle…</p>;

  const defaultAlt = `${form.year} ${form.make} ${form.model}`.trim();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-champagne">{id ? "Edit vehicle" : "New vehicle"}</p>
          <h1 className="mt-2 font-display text-3xl">
            {id ? `${form.year} ${form.make} ${form.model}` : "Add a vehicle"}
          </h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">Back to list</Link>
        </Button>
      </div>

      {notice && (
        <p role="status" className="mt-4 text-sm text-champagne">
          {notice}
        </p>
      )}
      {submitError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <form onSubmit={event => void handleSubmit(event)} noValidate className="mt-8 space-y-10">
        <ListingFields form={form} errors={errors} onUpdate={updateField} />
        <IdentityFields form={form} errors={errors} onUpdate={updateField} />
        <PerformanceFields form={form} errors={errors} onUpdate={updateField} />
        <DetailsFields form={form} errors={errors} onUpdate={updateField} />
        <StoryHighlightsFields form={form} errors={errors} onUpdate={updateField} />
        <CharactersFields form={form} errors={errors} onUpdate={updateField} />

        <div className="flex justify-end border-t border-line pt-8">
          <Button type="submit" variant="luxe" size="lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save vehicle"}
          </Button>
        </div>
      </form>

      {id ? (
        <PhotoManager
          vehicleId={id}
          images={images}
          defaultAlt={defaultAlt}
          onImagesChange={setImages}
          onRevalidate={notifyRevalidate}
        />
      ) : (
        <p className="mt-10 border-t border-line pt-8 text-sm text-muted-foreground">
          Save the vehicle first, then come back here to add photos.
        </p>
      )}
    </div>
  );
}
