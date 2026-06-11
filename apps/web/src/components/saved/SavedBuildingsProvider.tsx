"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  fetchSavedBuildingIds,
  saveBuilding,
  unsaveBuilding,
} from "@/lib/api/saved-buildings";
import { getAccessToken } from "@/lib/api/client";

type SavedBuildingsContextValue = {
  savedIds: Set<string>;
  loading: boolean;
  isSaved: (buildingId: string) => boolean;
  toggleSave: (buildingId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const SavedBuildingsContext = createContext<SavedBuildingsContextValue | null>(
  null,
);

export function SavedBuildingsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    try {
      const ids = await fetchSavedBuildingIds();
      setSavedIds(new Set(ids));
    } catch {
      setSavedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleSave = useCallback(
    async (buildingId: string) => {
      const token = await getAccessToken();
      if (!token) {
        router.push(`/auth/login?next=${encodeURIComponent("/explore")}`);
        return;
      }

      const wasSaved = savedIds.has(buildingId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(buildingId);
        else next.add(buildingId);
        return next;
      });

      try {
        if (wasSaved) {
          await unsaveBuilding(buildingId);
        } else {
          await saveBuilding(buildingId);
        }
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(buildingId);
          else next.delete(buildingId);
          return next;
        });
      }
    },
    [router, savedIds],
  );

  const value = useMemo(
    () => ({
      savedIds,
      loading,
      isSaved: (buildingId: string) => savedIds.has(buildingId),
      toggleSave,
      refresh,
    }),
    [savedIds, loading, toggleSave, refresh],
  );

  return (
    <SavedBuildingsContext.Provider value={value}>
      {children}
    </SavedBuildingsContext.Provider>
  );
}

export function useSavedBuildings() {
  const ctx = useContext(SavedBuildingsContext);
  if (!ctx) {
    throw new Error("useSavedBuildings requires SavedBuildingsProvider");
  }
  return ctx;
}
