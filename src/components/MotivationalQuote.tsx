import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";

const defaultQuotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
];

export function MotivationalQuote() {
  const { preferences } = usePreferences();
  const allQuotes = [...defaultQuotes, ...preferences.customQuotes];
  const [currentQuote, setCurrentQuote] = useState(allQuotes[0]);

  useEffect(() => {
    // Update quotes when custom quotes change
    setCurrentQuote(allQuotes[Math.floor(Math.random() * allQuotes.length)]);
    
    const interval = setInterval(() => {
      setCurrentQuote(allQuotes[Math.floor(Math.random() * allQuotes.length)]);
    }, 30000);

    return () => clearInterval(interval);
  }, [preferences.customQuotes.length]);

  if (!preferences.appearance.showMotivationalQuotes) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote.text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-xl p-4 shadow-card"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                "{currentQuote.text}"
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                — {currentQuote.author}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
