import { useCallback, useRef } from "react";

type SoundType = "bell" | "chime" | "digital" | "gentle";

const soundUrls: Record<SoundType, string> = {
  bell: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
  chime: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3",
  digital: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  gentle: "https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3",
};

export function useTimerSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((soundType: SoundType = "bell", volume: number = 0.7) => {
    try {
      // Stop any currently playing sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const audio = new Audio(soundUrls[soundType]);
      audio.volume = Math.max(0, Math.min(1, volume));
      audioRef.current = audio;
      
      audio.play().catch((error) => {
        console.warn("Failed to play timer sound:", error);
      });
    } catch (error) {
      console.warn("Failed to create audio:", error);
    }
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { playSound, stopSound };
}

export type { SoundType };
