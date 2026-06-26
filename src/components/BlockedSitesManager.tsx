import { useState } from "react";
import { Shield, Plus, Trash2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBlockedSites, PRESET_SITES } from "@/hooks/useBlockedSites";
import { useToast } from "@/hooks/use-toast";

export function BlockedSitesManager() {
  const { settings, addSite, removeSite, togglePreset, setEnabled } = useBlockedSites();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const handleAdd = () => {
    if (!url.trim()) {
      toast({ title: "Enter a website URL", variant: "destructive" });
      return;
    }
    const ok = addSite(url, label);
    if (!ok) {
      toast({ title: "Already in your blocklist (or invalid URL)", variant: "destructive" });
      return;
    }
    setUrl("");
    setLabel("");
    toast({ title: "Site blocked during focus sessions" });
  };

  const isActive = (host: string) => settings.sites.some((s) => s.url === host);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {settings.enabled ? (
            <Shield className="h-5 w-5 text-primary" />
          ) : (
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
          )}
          Website Blocker
        </CardTitle>
        <CardDescription>
          While a Pomodoro work session is running, leaving BrainBrews for any
          site in this list triggers a full-screen lockout. Sites unblock
          automatically when the timer ends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>Enable blocker during focus sessions</Label>
            <p className="text-sm text-muted-foreground">
              Pause the blocker without losing your list.
            </p>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Preset chips */}
        <div className="space-y-2">
          <Label>Quick-add presets</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_SITES.map((p) => {
              const active = isActive(p.url);
              return (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => togglePreset(p)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add custom */}
        <div className="space-y-3 rounded-lg border border-dashed p-4">
          <Label>Add your own site</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="e.g. example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="sm:w-48"
            />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        {/* Current list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Currently blocked ({settings.sites.length})</Label>
          </div>
          {settings.sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sites in your blocklist yet. Add presets above to get started.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {settings.sites.map((s) => (
                <div
                  key={s.url}
                  className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm font-medium text-foreground">
                      {s.label}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {s.url}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeSite(s.url)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground border-t pt-3">
          Note: Browsers don't let a website block other tabs directly. BrainBrews
          enforces the blocklist by detecting when you leave during a focus
          session and locking you back in until you return.
        </p>
      </CardContent>
    </Card>
  );
}
