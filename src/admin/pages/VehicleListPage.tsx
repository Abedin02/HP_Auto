import { ImageOff, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteModal } from "@/admin/components/ConfirmDeleteModal";
import { Switch } from "@/admin/components/Switch";
import { useIsMounted } from "@/admin/hooks/use-is-mounted";
import { useSession } from "@/admin/hooks/use-session";
import { getErrorMessage } from "@/admin/lib/errors";
import { fireRevalidate } from "@/admin/lib/revalidate";
import {
  deleteVehicle,
  listVehicles,
  setFeatured,
  setStatus,
  type AdminVehicleListItem,
} from "@/admin/lib/vehicles-api";
import { PUBLIC_SUPABASE_URL } from "@/lib/public-env";
import { Link } from "@/lib/router";
import { renditionUrl } from "@/lib/storage-paths";
import { VEHICLE_STATUSES, type VehicleStatus } from "@/types/vehicle";

type Filter = "all" | VehicleStatus;

const FILTERS: readonly Filter[] = ["all", ...VEHICLE_STATUSES];

function filterLabel(filter: Filter): string {
  return filter === "all" ? "All" : filter[0]!.toUpperCase() + filter.slice(1);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    price,
  );
}

export function VehicleListPage() {
  const { session } = useSession();
  const isMounted = useIsMounted();
  const [vehicles, setVehicles] = useState<AdminVehicleListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingDelete, setPendingDelete] = useState<AdminVehicleListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Vehicle ids with an in-flight status/featured request — gates those controls for that row.
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  const markPending = (id: string) => setPendingIds(prev => new Set(prev).add(id));
  const clearPending = (id: string) =>
    setPendingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listVehicles()
      .then(result => {
        if (!cancelled) setVehicles(result);
      })
      .catch(err => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const notifyRevalidate = useCallback(() => {
    if (!session) return;
    fireRevalidate(session.access_token, message => {
      if (isMounted()) setNotice(message);
    });
  }, [session, isMounted]);

  const handleStatusChange = async (vehicle: AdminVehicleListItem, next: VehicleStatus) => {
    if (pendingIds.has(vehicle.id)) return;
    const previousStatus = vehicle.status;
    markPending(vehicle.id);
    setVehicles(current => current?.map(v => (v.id === vehicle.id ? { ...v, status: next } : v)) ?? current);
    try {
      await setStatus(vehicle.id, next);
      notifyRevalidate();
    } catch (err) {
      if (isMounted()) {
        setError(getErrorMessage(err));
        // Targeted rollback: only this row's status field, not the whole list snapshot.
        setVehicles(current => current?.map(v => (v.id === vehicle.id ? { ...v, status: previousStatus } : v)) ?? current);
      }
    } finally {
      if (isMounted()) clearPending(vehicle.id);
    }
  };

  const handleFeaturedChange = async (vehicle: AdminVehicleListItem, next: boolean) => {
    if (pendingIds.has(vehicle.id)) return;
    const previousFeatured = vehicle.isFeatured;
    markPending(vehicle.id);
    setVehicles(current => current?.map(v => (v.id === vehicle.id ? { ...v, isFeatured: next } : v)) ?? current);
    try {
      await setFeatured(vehicle.id, next);
      notifyRevalidate();
    } catch (err) {
      if (isMounted()) {
        setError(getErrorMessage(err));
        setVehicles(
          current => current?.map(v => (v.id === vehicle.id ? { ...v, isFeatured: previousFeatured } : v)) ?? current,
        );
      }
    } finally {
      if (isMounted()) clearPending(vehicle.id);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteVehicle(pendingDelete.id);
      if (isMounted()) {
        setVehicles(current => current?.filter(v => v.id !== pendingDelete.id) ?? current);
        setPendingDelete(null);
      }
      notifyRevalidate();
    } catch (err) {
      if (isMounted()) setError(getErrorMessage(err));
    } finally {
      if (isMounted()) setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    return filter === "all" ? vehicles : vehicles.filter(v => v.status === filter);
  }, [vehicles, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-champagne">Inventory</p>
          <h1 className="mt-2 font-display text-3xl">Vehicles</h1>
        </div>
        <Button asChild variant="luxe">
          <Link to="/admin/vehicles/new">
            <Plus className="size-4" /> Add vehicle
          </Link>
        </Button>
      </div>

      {notice && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div role="tablist" aria-label="Filter vehicles by status" className="mt-8 flex gap-2">
        {FILTERS.map(item => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={`eyebrow rounded-full border px-4 py-2 text-xs transition-colors ${
              filter === item
                ? "border-champagne bg-champagne text-ink"
                : "border-line text-muted-foreground hover:text-ivory"
            }`}
          >
            {filterLabel(item)}
          </button>
        ))}
      </div>

      {vehicles === null && !error && <p className="mt-10 text-muted-foreground">Loading vehicles…</p>}
      {vehicles !== null && filtered.length === 0 && (
        <p className="mt-10 text-muted-foreground">No vehicles match this filter yet.</p>
      )}

      <ul className="mt-8 divide-y divide-line">
        {filtered.map(vehicle => {
          const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
          const rowPending = pendingIds.has(vehicle.id);
          return (
            <li key={vehicle.id} className="flex flex-wrap items-center gap-4 py-5">
              <div className="size-16 shrink-0 overflow-hidden rounded-md bg-surface-raised">
                {vehicle.firstImagePath ? (
                  <img
                    src={renditionUrl(PUBLIC_SUPABASE_URL, vehicle.firstImagePath, 480)}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-mist">
                    <ImageOff className="size-6" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg">{title}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(vehicle.price)}</p>
              </div>

              <Select
                value={vehicle.status}
                onValueChange={value => void handleStatusChange(vehicle, value as VehicleStatus)}
                disabled={rowPending}
              >
                <SelectTrigger size="sm" aria-label={`Status for ${title}`} className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {filterLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  checked={vehicle.isFeatured}
                  onCheckedChange={next => void handleFeaturedChange(vehicle, next)}
                  label={`Featured: ${title}`}
                  disabled={rowPending}
                />
                <span className="text-xs text-muted-foreground">Featured</span>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/admin/vehicles/${vehicle.id}`}>Edit</Link>
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPendingDelete(vehicle)}>
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDeleteModal
        isOpen={pendingDelete !== null}
        title="Delete this vehicle?"
        description={
          pendingDelete
            ? `This permanently removes ${pendingDelete.year} ${pendingDelete.make} ${pendingDelete.model} and all of its photos.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmDelete()}
        isDeleting={isDeleting}
      />
    </div>
  );
}
