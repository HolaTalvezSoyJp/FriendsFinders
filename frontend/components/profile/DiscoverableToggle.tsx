"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Props {
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}

export function DiscoverableToggle({ checked, onCheckedChange }: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface p-4">
      <div>
        <Label className="text-white text-sm font-semibold">Discoverable</Label>
        <p className="text-xs text-muted mt-0.5">
          Let nearby strangers find you
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
