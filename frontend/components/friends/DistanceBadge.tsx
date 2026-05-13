import { MapPin } from "lucide-react";
import { formatDistance } from "@/lib/utils";

export function DistanceBadge({ miles }: { miles: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <MapPin className="h-3 w-3" />
      {formatDistance(miles)}
    </span>
  );
}
