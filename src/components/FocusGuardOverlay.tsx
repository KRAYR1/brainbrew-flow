import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createCat3D } from "@/lib/cat3d";
import { useBlockedSites } from "@/hooks/useBlockedSites";

/**
 * Social-Detox-style focus guard.
 * When a Pomodoro WORK session is running and the user switches away from the
 * BrainBrew tab, an immersive cat overlay greets them on return with a short
 * cooldown before they can dismiss it. Encourages them to stay focused.
 *
 * Listens to:
 *  - "pomodoro:state" { isRunning: boolean, mode: "work" | "shortBreak" | "longBreak" }
 *  - document "visibilitychange"
 */
export function FocusGuardOverlay() {
  const { settings: blocker } = useBlockedSites();
  const [active, setActive] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const stateRef = useRef<{ isRunning: boolean; mode: string }>({
    isRunning: false,
    mode: "work",
  });
  const hiddenAtRef = useRef<number | null>(null);
  const catHostRef = useRef<HTMLDivElement | null>(null);
  const blockerRef = useRef(blocker);
  useEffect(() => {
    blockerRef.current = blocker;
  }, [blocker]);

  // Listen for pomodoro state broadcasts
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      stateRef.current = {
        isRunning: !!detail.isRunning,
        mode: detail.mode ?? "work",
      };
    };
    window.addEventListener("pomodoro:state", handler);
    return () => window.removeEventListener("pomodoro:state", handler);
  }, []);

  // Track tab visibility
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        if (stateRef.current.isRunning && stateRef.current.mode === "work") {
          hiddenAtRef.current = Date.now();
        }
      } else if (hiddenAtRef.current !== null) {
        const away = Math.round((Date.now() - hiddenAtRef.current) / 1000);
        hiddenAtRef.current = null;
        if (
          away >= 3 &&
          stateRef.current.isRunning &&
          stateRef.current.mode === "work" &&
          blockerRef.current.enabled
        ) {
          setAwaySeconds(away);
          setCooldown(5);
          setActive(true);
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (!active) return;
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [active, cooldown]);

  // Mount 3D cat when overlay opens
  useEffect(() => {
    if (!active || !catHostRef.current) return;
    const cleanup = createCat3D(catHostRef.current);
    return () => {
      cleanup();
      if (catHostRef.current) catHostRef.current.innerHTML = "";
    };
  }, [active]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483646,
            background:
              "radial-gradient(ellipse at 50% 40%, #1a1040 0%, #0a0820 60%, #050410 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: 24,
            overflow: "hidden",
          }}
        >
          {/* Starfield */}
          <Stars />

          <div
            ref={catHostRef}
            style={{
              width: 300,
              height: 300,
              position: "relative",
              filter: "drop-shadow(0 0 30px rgba(100, 150, 255, 0.35))",
            }}
          />

          <div
            style={{
              width: 200,
              height: 24,
              background:
                "radial-gradient(ellipse, rgba(80,120,255,0.35), transparent 70%)",
              borderRadius: "50%",
              marginTop: -20,
            }}
          />

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "#fff",
              margin: "12px 0 4px",
              textShadow:
                "0 0 24px rgba(120,100,255,0.9), 0 2px 4px rgba(0,0,0,0.5)",
              letterSpacing: 2,
            }}
          >
            STAY FOCUSED
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "#9988ff",
              fontWeight: 700,
              marginBottom: 6,
              textShadow: "0 0 12px rgba(150,120,255,0.6)",
            }}
          >
            You wandered off for {awaySeconds}s
          </p>
          <p
            style={{
              fontSize: "0.95rem",
              color: "rgba(200,200,230,0.75)",
              maxWidth: 360,
              lineHeight: 1.5,
            }}
          >
            Your Pomodoro is still running. Come back to BrainBrew and finish
            strong — the cat is watching. 🐾
          </p>
          {blocker.sites.length > 0 && (
            <div
              style={{
                marginTop: 14,
                maxWidth: 420,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                padding: "10px 14px",
              }}
            >
              <p
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#ff80a0",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Blocked until timer ends
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {blocker.sites.slice(0, 12).map((s) => (
                  <span
                    key={s.url}
                    style={{
                      fontSize: "0.72rem",
                      padding: "3px 9px",
                      borderRadius: 999,
                      background: "rgba(255,90,120,0.18)",
                      color: "#ffd0dc",
                      border: "1px solid rgba(255,120,150,0.35)",
                    }}
                  >
                    {s.label}
                  </span>
                ))}
                {blocker.sites.length > 12 && (
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>
                    +{blocker.sites.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}
          {cooldown > 0 && (
            <p
              style={{
                fontSize: "1rem",
                fontWeight: "bold",
                color: "#ff6090",
                marginTop: 10,
                textShadow: "0 0 10px rgba(255,80,120,0.5)",
              }}
            >
              You can dismiss in {cooldown}s
            </p>
          )}
          <button
            disabled={cooldown > 0}
            onClick={() => setActive(false)}
            style={{
              marginTop: 20,
              padding: "13px 36px",
              fontSize: "1rem",
              fontWeight: 700,
              background:
                cooldown > 0
                  ? "rgba(255,255,255,0.12)"
                  : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff",
              border: "none",
              borderRadius: 50,
              cursor: cooldown > 0 ? "not-allowed" : "pointer",
              boxShadow:
                cooldown > 0
                  ? "none"
                  : "0 4px 24px rgba(120,60,255,0.55)",
              transition: "transform 0.15s, box-shadow 0.15s",
              letterSpacing: 0.5,
            }}
          >
            {cooldown > 0 ? "Hold on…" : "Back to Focus"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Stars() {
  const stars = useRef<{ top: string; left: string; size: number; dur: number }[]>();
  if (!stars.current) {
    stars.current = Array.from({ length: 60 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      dur: 2 + Math.random() * 3,
    }));
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes sd-twinkle { 0%,100% { opacity:.2; transform:scale(1) } 50% { opacity:1; transform:scale(1.4) } }`}</style>
      {stars.current.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            background: "white",
            borderRadius: "50%",
            animation: `sd-twinkle ${s.dur}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
