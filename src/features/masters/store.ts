import { create } from "zustand";
import { BulkDropdownsDto, MasterItemDto, StateDto, mastersApi } from "./api/mastersApi";
import { TerritoryDto, territoriesApi } from "../territories/api/territoriesApi";

interface MasterStoreState {
  specializations: MasterItemDto[];
  customerCategories: MasterItemDto[];
  visitPriorities: MasterItemDto[];
  states: StateDto[];
  territories: TerritoryDto[];
  isLoading: boolean;
  lastFetchedAt: number | null;
  error: string | null;

  fetchMasters: (force?: boolean) => Promise<void>;
  getSpecializationName: (codeOrName?: string | null) => string;
  getCategoryName: (code?: string | null) => string;
}

export const useMasterStore = create<MasterStoreState>((set, get) => ({
  specializations: [],
  customerCategories: [],
  visitPriorities: [],
  states: [],
  territories: [],
  isLoading: false,
  lastFetchedAt: null,
  error: null,

  fetchMasters: async (force = false) => {
    const { lastFetchedAt, isLoading } = get();
    // Cache for 30 minutes unless forced
    const now = Date.now();
    if (!force && lastFetchedAt && now - lastFetchedAt < 30 * 60 * 1000) {
      return;
    }
    if (isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const [bulk, territories] = await Promise.all([
        mastersApi.getBulkDropdowns(),
        territoriesApi.getMyTerritories().catch(() => [] as TerritoryDto[]),
      ]);

      set({
        specializations: bulk.specializations || [],
        customerCategories: bulk.customer_categories || [],
        visitPriorities: bulk.visit_priorities || [],
        states: bulk.states || [],
        territories: territories || [],
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || err.message || "Failed to load master data",
      });
    }
  },

  getSpecializationName: (codeOrName?: string | null) => {
    if (!codeOrName) return "General";
    const found = get().specializations.find(
      (s) => s.code.toLowerCase() === codeOrName.toLowerCase() || s.name.toLowerCase() === codeOrName.toLowerCase()
    );
    return found ? found.name : codeOrName;
  },

  getCategoryName: (code?: string | null) => {
    if (!code) return "Category A";
    const found = get().customerCategories.find(
      (c) => c.code.toLowerCase() === code.toLowerCase() || c.name.toLowerCase() === code.toLowerCase()
    );
    return found ? found.name : `Category ${code}`;
  },
}));
