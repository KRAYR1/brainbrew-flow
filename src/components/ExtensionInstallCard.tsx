import { useState } from "react";
import { Download, Puzzle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

/**
 * "Companion Extension" settings card. Lets the user download the packaged
 * Whiskers Chrome extension zip and shows install instructions.
 */
export function ExtensionInstallCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const download = () => {
    fetch("/whiskers-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "whiskers-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        toast({ title: "Extension downloaded 🐾", description: "Unzip it, then load it in Chrome." });
      })
      .catch((err) =>
        toast({ title: "Download failed", description: err.message, variant: "destructive" }),
      );
  };

  const copyChromeUrl = () => {
    navigator.clipboard.writeText("chrome://extensions");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-primary" />
          Companion Browser Extension
        </CardTitle>
        <CardDescription>
          Extend Whiskers to block distracting sites <strong>everywhere</strong> — not
          just when you tab back to BrainBrews. The overlay auto-lifts when your
          Pomodoro ends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={download} className="gap-2">
            <Download className="h-4 w-4" />
            Download extension (.zip)
          </Button>
          <Button variant="outline" onClick={copyChromeUrl} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy chrome://extensions"}
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
          <p className="font-semibold">Install in 4 steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Download and unzip the file.</li>
            <li>
              Open <code className="rounded bg-muted px-1 py-0.5 text-xs">chrome://extensions</code> in Chrome
              (or any Chromium browser: Edge, Brave, Arc, Opera).
            </li>
            <li>Enable <strong>Developer mode</strong> in the top-right.</li>
            <li>
              Click <strong>Load unpacked</strong> and select the unzipped folder.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground pt-1">
            Keep this BrainBrews tab open at least once after installing so the
            extension can sync your Pomodoro state and blocked list.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
