import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { StudyMaterial } from "@/types";

const KEY = "brainbrew-study-materials";

// Rough safety ceiling so localStorage doesn't blow up (~4MB of text)
export const MATERIAL_STORAGE_LIMIT = 4_000_000;
// Max characters sent to the model per request
export const MATERIAL_SEND_LIMIT = 24_000;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function useStudyMaterials() {
  const [materials, setMaterials] = useLocalStorage<StudyMaterial[]>(KEY, []);

  const totalChars = useMemo(
    () => materials.reduce((n, m) => n + m.text.length, 0),
    [materials],
  );

  const addMaterial = useCallback(
    (name: string, text: string) => {
      const clean = text.replace(/\s+\n/g, "\n").trim();
      const material: StudyMaterial = {
        id: uid(),
        name,
        text: clean,
        wordCount: clean ? clean.split(/\s+/).length : 0,
        createdAt: new Date().toISOString(),
        selected: true,
      };
      setMaterials((prev) => [material, ...prev]);
      return material;
    },
    [setMaterials],
  );

  const removeMaterial = useCallback(
    (id: string) => setMaterials((prev) => prev.filter((m) => m.id !== id)),
    [setMaterials],
  );

  const renameMaterial = useCallback(
    (id: string, name: string) =>
      setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m))),
    [setMaterials],
  );

  const toggleMaterial = useCallback(
    (id: string) =>
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)),
      ),
    [setMaterials],
  );

  const setAllSelected = useCallback(
    (selected: boolean) => setMaterials((prev) => prev.map((m) => ({ ...m, selected }))),
    [setMaterials],
  );

  const selected = useMemo(() => materials.filter((m) => m.selected), [materials]);

  /** Trimmed payload of the selected materials, safe to send to the model. */
  const buildPayload = useCallback(() => {
    if (selected.length === 0) return [];
    const perDoc = Math.floor(MATERIAL_SEND_LIMIT / selected.length);
    return selected.map((m) => ({
      name: m.name,
      text:
        m.text.length > perDoc
          ? m.text.slice(0, perDoc) + "\n…[truncated]"
          : m.text,
    }));
  }, [selected]);

  return {
    materials,
    selected,
    totalChars,
    nearLimit: totalChars > MATERIAL_STORAGE_LIMIT * 0.8,
    addMaterial,
    removeMaterial,
    renameMaterial,
    toggleMaterial,
    setAllSelected,
    buildPayload,
  };
}
