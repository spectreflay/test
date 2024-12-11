import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: true, // Default to open on larger screens
      setIsOpen: (isOpen) => set({ isOpen }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "sidebar-storage",
    }
  )
);
