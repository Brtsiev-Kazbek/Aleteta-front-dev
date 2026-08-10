import type { SliceCreator, WorkspaceSlice } from "../types";

/**
 * Состояние оболочки: вкладки, выделение дел, боковая панель, диалоги.
 *
 * Ничего, кроме интерфейса, здесь нет и быть не должно — ни записи в базу, ни
 * обращений к модели. Поэтому слой такой короткий и поэтому его никогда не
 * придётся переписывать вслед за бэкендом.
 */
export const createWorkspaceSlice: SliceCreator<WorkspaceSlice> = (set, get) => ({
  activeTab: "entities",
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedCaseIds: [],

  toggleCaseSelection: (caseId) => {
    const selected = get().selectedCaseIds;
    set({
      selectedCaseIds: selected.includes(caseId)
        ? selected.filter((id) => id !== caseId)
        : [...selected, caseId],
    });
  },

  toggleAllCases: (caseIds) => {
    const selected = get().selectedCaseIds;
    const allSelected =
      caseIds.length > 0 && caseIds.every((id) => selected.includes(id));
    set({ selectedCaseIds: allSelected ? [] : caseIds });
  },

  clearCaseSelection: () => set({ selectedCaseIds: [] }),

  isSidebarExpanded: false,
  toggleSidebar: (expanded) =>
    set((state) => ({
      isSidebarExpanded: expanded ?? !state.isSidebarExpanded,
    })),

  isCreateCaseOpen: false,
  setCreateCaseOpen: (open) => set({ isCreateCaseOpen: open }),
});
