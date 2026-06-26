import { useLocalStorage } from "./useLocalStorage";

export interface BlockedSite {
  url: string; // normalized hostname, e.g. "youtube.com"
  label: string;
  preset?: boolean;
}

export const PRESET_SITES: BlockedSite[] = [
  { url: "youtube.com", label: "YouTube", preset: true },
  { url: "netflix.com", label: "Netflix", preset: true },
  { url: "instagram.com", label: "Instagram", preset: true },
  { url: "tiktok.com", label: "TikTok", preset: true },
  { url: "twitter.com", label: "Twitter / X", preset: true },
  { url: "x.com", label: "X", preset: true },
  { url: "facebook.com", label: "Facebook", preset: true },
  { url: "reddit.com", label: "Reddit", preset: true },
  { url: "twitch.tv", label: "Twitch", preset: true },
  { url: "discord.com", label: "Discord", preset: true },
];

export interface BlockerSettings {
  enabled: boolean;
  sites: BlockedSite[];
}

const defaultSettings: BlockerSettings = {
  enabled: true,
  sites: PRESET_SITES.slice(0, 5),
};

export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  try {
    const withProto = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    return u.hostname.replace(/^www\./, "");
  } catch {
    // fall back: strip protocol/path manually
    return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null;
  }
}

export function useBlockedSites() {
  const [settings, setSettings] = useLocalStorage<BlockerSettings>(
    "brainbrew-blocker",
    defaultSettings
  );

  const addSite = (raw: string, label?: string) => {
    const url = normalizeUrl(raw);
    if (!url) return false;
    if (settings.sites.some((s) => s.url === url)) return false;
    setSettings({
      ...settings,
      sites: [...settings.sites, { url, label: label?.trim() || url }],
    });
    return true;
  };

  const removeSite = (url: string) => {
    setSettings({ ...settings, sites: settings.sites.filter((s) => s.url !== url) });
  };

  const togglePreset = (preset: BlockedSite) => {
    const exists = settings.sites.some((s) => s.url === preset.url);
    setSettings({
      ...settings,
      sites: exists
        ? settings.sites.filter((s) => s.url !== preset.url)
        : [...settings.sites, preset],
    });
  };

  const setEnabled = (enabled: boolean) => setSettings({ ...settings, enabled });

  return { settings, addSite, removeSite, togglePreset, setEnabled };
}
