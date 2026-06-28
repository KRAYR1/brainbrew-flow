import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createCat3D } from "@/lib/cat3d";
import { useBlockedSites } from "@/hooks/useBlockedSites";
import { supabase } from "@/integrations/supabase/client";

/**
 * Focus guard overlay.
 *
 * When a Pomodoro WORK session is running and the user switches away from
 * BrainBrews (likely to a blocked site like YouTube), an immersive cat overlay
 * intercepts on return. A cat chatbot ("Whiskers") asks for the user's intent,
 * an AI edge function classifies it as ENTERTAINMENT or STUDY, and the overlay
 * shows an enhanced block message redirecting the user back to BrainBrews when
 * entertainment is detected.
 */
export function FocusGuardOverlay() {
  const { settings: blocker } = useBlockedSites();
  const [active, setActive] = useState(false);
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState<
    "entertainment" | "study" | null
  >(null);
  const [catReply, setCatReply] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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

  // Pomodoro state broadcasts
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      stateRef.current = {
        isRunning: !!detail.isRunning,
        mode: detail.mode ?? "work",
      };
      // If pomodoro ended or moved to break, lift the guard.
      if (!detail.isRunning || detail.mode !== "work") {
        setActive(false);
      }
    };
    window.addEventListener("pomodoro:state", handler);
    return () => window.removeEventListener("pomodoro:state", handler);
  }, []);

  // Tab visibility tracking
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
          setIntent("");
          setClassification(null);
          setCatReply("");
          setError(null);
          setActive(true);
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Mount 3D cat
  useEffect(() => {
    if (!active || !catHostRef.current) return;
    const cleanup = createCat3D(catHostRef.current);
    return () => {
      cleanup();
      if (catHostRef.current) catHostRef.current.innerHTML = "";
    };
  }, [active]);

  const submitIntent = async () => {
    const trimmed = intent.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const siteList = blockerRef.current.sites.map((s) => s.label).join(", ");
      const { data, error: fnErr } = await supabase.functions.invoke(
        "cat-intent",
        { body: { intent: trimmed, site: siteList } },
      );
      if (fnErr) throw fnErr;
      const cls =
        data?.classification === "study" ? "study" : "entertainment";
      setClassification(cls);
      setCatReply(
        data?.reply ||
          (cls === "entertainment"
            ? "Meow! Come back to BrainBrews and finish the timer. 🐾"
            : "Purr — try BrainBrews' own study tools first. 🐾"),
      );
    } catch (e) {
      console.error(e);
      setError("Whiskers couldn't reach the AI right now. Stay focused anyway! 🐾");
    } finally {
      setLoading(false);
    }
  };

  const dismissAllowed = classification === "study";

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
            overflow: "auto",
          }}
        >
          <Stars />

          <div
            ref={catHostRef}
            style={{
              width: 240,
              height: 240,
              position: "relative",
              filter: "drop-shadow(0 0 30px rgba(100, 150, 255, 0.35))",
            }}
          />

          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 900,
              color: "#fff",
              margin: "4px 0 2px",
              textShadow:
                "0 0 24px rgba(120,100,255,0.9), 0 2px 4px rgba(0,0,0,0.5)",
              letterSpacing: 2,
            }}
          >
            WHISKERS IS WATCHING
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#9988ff",
              fontWeight: 700,
              marginBottom: 14,
              textShadow: "0 0 12px rgba(150,120,255,0.6)",
            }}
          >
            You wandered off for {awaySeconds}s — Pomodoro still running.
          </p>

          {/* Chatbot card */}
          <div
            style={{
              width: "min(520px, 100%)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: 18,
              backdropFilter: "blur(10px)",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: 1.4,
                color: "#a8b3ff",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              🐱 Whiskers asks:
            </p>
            <p
              style={{
                color: "#fff",
                fontSize: "0.95rem",
                marginBottom: 12,
                lineHeight: 1.45,
              }}
            >
              What were you about to do? Tell me your intent and I'll decide if
              it can wait until the timer ends.
            </p>

            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              disabled={loading || classification !== null}
              placeholder="e.g. 'watch one quick video' or 'look up a chemistry formula'"
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 10,
                color: "#fff",
                fontSize: "0.9rem",
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
              }}
            />

            {classification === null && (
              <button
                onClick={submitIntent}
                disabled={loading || !intent.trim()}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "11px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  background:
                    loading || !intent.trim()
                      ? "rgba(255,255,255,0.12)"
                      : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  cursor:
                    loading || !intent.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Whiskers is thinking…" : "Ask Whiskers 🐾"}
              </button>
            )}

            {error && (
              <p
                style={{
                  marginTop: 10,
                  color: "#ffb0b0",
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </p>
            )}

            {classification && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: 12,
                  background:
                    classification === "entertainment"
                      ? "linear-gradient(135deg, rgba(255,60,90,0.18), rgba(255,120,60,0.12))"
                      : "linear-gradient(135deg, rgba(80,200,140,0.18), rgba(60,180,255,0.12))",
                  border:
                    classification === "entertainment"
                      ? "1px solid rgba(255,120,150,0.45)"
                      : "1px solid rgba(120,220,180,0.4)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    color:
                      classification === "entertainment"
                        ? "#ffb0c4"
                        : "#a8f0c8",
                    marginBottom: 6,
                  }}
                >
                  {classification === "entertainment"
                    ? "🚫 Entertainment detected — Blocked"
                    : "📚 Study intent — Proceed mindfully"}
                </p>
                <p
                  style={{
                    color: "#fff",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {catReply}
                </p>
              </div>
            )}
          </div>

          {/* Blocked sites chips */}
          {blocker.sites.length > 0 && (
            <div
              style={{
                marginTop: 14,
                maxWidth: 520,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
              }}
            >
              {blocker.sites.slice(0, 10).map((s) => (
                <span
                  key={s.url}
                  style={{
                    fontSize: "0.7rem",
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
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => setActive(false)}
              disabled={!dismissAllowed}
              title={
                dismissAllowed
                  ? "Continue studying"
                  : "Whiskers must approve first — answer the question above"
              }
              style={{
                padding: "12px 28px",
                fontSize: "0.95rem",
                fontWeight: 700,
                background: dismissAllowed
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "rgba(255,255,255,0.08)",
                color: dismissAllowed ? "#fff" : "rgba(255,255,255,0.4)",
                border: "none",
                borderRadius: 50,
                cursor: dismissAllowed ? "pointer" : "not-allowed",
                boxShadow: dismissAllowed
                  ? "0 4px 24px rgba(16,185,129,0.45)"
                  : "none",
              }}
            >
              {dismissAllowed ? "Back to studying 📚" : "Locked 🔒"}
            </button>
            {classification === "entertainment" && (
              <button
                onClick={() => {
                  setActive(false);
                  window.location.href = "/";
                }}
                style={{
                  padding: "12px 28px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 50,
                  cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(120,60,255,0.55)",
                }}
              >
                Take me to BrainBrews →
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
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
