"use client";

import { useEffect, useRef } from "react";
import type { NearbyFriendEntry } from "@/lib/types";

interface Props {
  friends: NearbyFriendEntry[];
  center?: [number, number]; // [lng, lat]
}

export function LiveMap({ friends, center }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const defaultCenter: [number, number] =
      center ??
      (friends[0]
        ? [friends[0].longitude, friends[0].latitude]
        : [-122.4194, 37.7749]);

    let destroyed = false;

    import("maplibre-gl").then((maplibregl) => {
      if (destroyed || !containerRef.current) return;
      const Map = maplibregl.Map ?? (maplibregl as unknown as { default: { Map: typeof maplibregl.Map } }).default?.Map;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: defaultCenter,
        zoom: 13,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        const Marker = maplibregl.Marker;
        friends.forEach((f) => {
          new Marker({ color: "#FF6B6B" })
            .setLngLat([f.longitude, f.latitude])
            .addTo(map);
        });
      });
    });

    return () => {
      destroyed = true;
      (mapRef.current as { remove?: () => void } | null)?.remove?.();
      mapRef.current = null;
    };
  }, []); // map is initialized once; markers come from initial friends

  return (
    <div
      ref={containerRef}
      className="h-48 w-full rounded-2xl overflow-hidden bg-surface"
    />
  );
}
