import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function JarvisAssistant() {
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd/Ctrl + J opens Brainy B chat page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        navigate("/chat");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return null;
}
