import { Plus, X } from "lucide-react";
import { FormError, TextAreaField } from "@/components/forms/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldErrors } from "@/lib/vehicle-validation";
import { MAX_HIGHLIGHTS, type VehicleFormDefaults } from "@/admin/lib/vehicle-form";
import { FieldGroup } from "./FieldGroup";

type StoryHighlightsFieldsProps = {
  form: VehicleFormDefaults;
  errors: FieldErrors;
  onUpdate: <K extends keyof VehicleFormDefaults>(key: K, value: VehicleFormDefaults[K]) => void;
};

/**
 * Story copy plus an add/remove list of up to 8 short highlights. Rows render straight from
 * `form.highlights`, and each input is fully controlled, so `index` is a safe key.
 */
export function StoryHighlightsFields({ form, errors, onUpdate }: StoryHighlightsFieldsProps) {
  const handleAdd = () => {
    if (form.highlights.length >= MAX_HIGHLIGHTS) return;
    onUpdate("highlights", [...form.highlights, ""]);
  };

  const handleChange = (index: number, value: string) => {
    onUpdate(
      "highlights",
      form.highlights.map((highlight, i) => (i === index ? value : highlight)),
    );
  };

  const handleRemove = (index: number) => {
    onUpdate(
      "highlights",
      form.highlights.filter((_, i) => i !== index),
    );
  };

  return (
    <FieldGroup title="Story & highlights">
      <div className="sm:col-span-2">
        <TextAreaField label="Story" value={form.story} onChange={event => onUpdate("story", event.target.value)} rows={6} />
        {errors.story && <FormError message={errors.story} />}
      </div>

      <div className="space-y-3 sm:col-span-2">
        <div className="flex items-center justify-between">
          <Label>
            Highlights ({form.highlights.length}/{MAX_HIGHLIGHTS})
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={form.highlights.length >= MAX_HIGHLIGHTS}
          >
            <Plus className="size-4" /> Add highlight
          </Button>
        </div>
        {form.highlights.map((highlight, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={highlight}
              onChange={event => handleChange(index, event.target.value)}
              placeholder={`Highlight ${index + 1}`}
              aria-label={`Highlight ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove highlight ${index + 1}`}
              onClick={() => handleRemove(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {errors.highlights && <FormError message={errors.highlights} />}
      </div>
    </FieldGroup>
  );
}
