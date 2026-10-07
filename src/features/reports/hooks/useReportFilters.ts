import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/store";
import { usersApi } from "../../users/api/usersApi";
import { territoriesApi, TerritoryDto } from "../../territories/api/territoriesApi";
import {
  DatePreset,
  getPresetDateRange,
  validateDateRange,
  formatDate,
  normalizeDateInput,
} from "../utils/reportDateUtils";
import { ReportFilterSchema } from "../api/reportsApi";

export interface ReportFilterState {
  preset: DatePreset;
  from_date: string;
  to_date: string;
  mr_id: number | null;
  mr_name?: string;
  manager_id: number | null;
  manager_name?: string;
  territory_id: number | null;
  territory_name?: string;
  customer_type: string | null;
  status: string | null;
  category?: string | null;
  specialization?: string | null;
  active?: boolean | null;
  work_type?: string | null;
  deviation_type?: string | null;
}

export function useReportFilters(
  filterSchema?: ReportFilterSchema,
  initialFilters?: Partial<ReportFilterState>
) {
  const currentUser = useAuthStore((s) => s.user);
  const role = currentUser?.role || "MR";

  // Initial preset
  const defaultRange = getPresetDateRange("This month");

  const [preset, setPreset] = useState<DatePreset>(initialFilters?.preset || "This month");
  const [fromDate, setFromDate] = useState<string>(initialFilters?.from_date || defaultRange.from_date);
  const [toDate, setToDate] = useState<string>(initialFilters?.to_date || defaultRange.to_date);

  const [selectedMrId, setSelectedMrId] = useState<number | null>(
    role === "MR" ? currentUser?.id || null : initialFilters?.mr_id ?? null
  );
  const [selectedMrName, setSelectedMrName] = useState<string | undefined>(
    role === "MR" ? currentUser?.fullName : initialFilters?.mr_name
  );

  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(
    initialFilters?.manager_id ?? null
  );
  const [selectedManagerName, setSelectedManagerName] = useState<string | undefined>(
    initialFilters?.manager_name
  );

  const [selectedTerritoryId, setSelectedTerritoryId] = useState<number | null>(
    initialFilters?.territory_id ?? null
  );
  const [selectedTerritoryName, setSelectedTerritoryName] = useState<string | undefined>(
    initialFilters?.territory_name
  );

  const [selectedCustomerType, setSelectedCustomerType] = useState<string | null>(
    initialFilters?.customer_type ?? null
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    initialFilters?.status ?? null
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialFilters?.category ?? null
  );
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(
    initialFilters?.specialization ?? null
  );
  const [selectedActive, setSelectedActive] = useState<boolean | null>(
    initialFilters?.active ?? null
  );
  const [selectedWorkType, setSelectedWorkType] = useState<string | null>(
    initialFilters?.work_type ?? null
  );
  const [selectedDeviationType, setSelectedDeviationType] = useState<string | null>(
    initialFilters?.deviation_type ?? null
  );

  const [dateError, setDateError] = useState<string | null>(null);

  // When preset changes (except Custom), automatically update dates
  const handleSelectPreset = (newPreset: DatePreset) => {
    setPreset(newPreset);
    if (newPreset !== "Custom") {
      const range = getPresetDateRange(newPreset);
      setFromDate(range.from_date);
      setToDate(range.to_date);
      setDateError(null);
    }
  };

  // Update custom dates
  const handleSetCustomDates = (start: string, end: string) => {
    setPreset("Custom");
    setFromDate(start);
    setToDate(end);
    const normStart = normalizeDateInput(start);
    const normEnd = normalizeDateInput(end);
    const val = validateDateRange(normStart, normEnd);
    if (!val.valid) {
      setDateError(val.error || "Invalid date range");
    } else {
      setDateError(null);
    }
  };

  // Queries for pickers
  // 1. Managers query (for Admin)
  const managersQuery = useQuery({
    queryKey: ["reports", "filter", "managers"],
    queryFn: () => usersApi.getManagers(),
    enabled: role === "ADMIN",
    staleTime: 10 * 60 * 1000,
  });

  // 2. Team MRs query (for Manager)
  const myTeamQuery = useQuery({
    queryKey: ["reports", "filter", "my-team"],
    queryFn: () => usersApi.getMyTeam(),
    enabled: role === "MANAGER",
    staleTime: 5 * 60 * 1000,
  });

  // 3. All MRs query (for Admin)
  const allMrsQuery = useQuery({
    queryKey: ["reports", "filter", "all-mrs", selectedManagerId],
    queryFn: async () => {
      const res = await usersApi.listUsers({ role: "MR", page_size: 100 });
      return res.items || [];
    },
    enabled: role === "ADMIN",
    staleTime: 5 * 60 * 1000,
  });

  // 4. Territories query
  const territoriesQuery = useQuery({
    queryKey: ["reports", "filter", "territories"],
    queryFn: () => territoriesApi.listTerritories({ active_only: true, limit: 100 }),
    enabled: !!filterSchema?.territory_picker,
    staleTime: 10 * 60 * 1000,
  });

  // Available MRs for picker
  const availableMrs = useMemo(() => {
    if (role === "MR") {
      return [];
    }
    if (role === "MANAGER") {
      return (myTeamQuery.data || []).map((u) => ({
        id: u.id,
        name: u.full_name,
        code: (u as any).employee_code || "",
      }));
    }
    // Admin
    const items = allMrsQuery.data || [];
    if (selectedManagerId) {
      return items
        .filter((u) => u.current_manager?.id === selectedManagerId || (u as any).manager_id === selectedManagerId)
        .map((u) => ({ id: u.id, name: u.full_name, code: (u as any).employee_code || "" }));
    }
    return items.map((u) => ({ id: u.id, name: u.full_name, code: (u as any).employee_code || "" }));
  }, [role, myTeamQuery.data, allMrsQuery.data, selectedManagerId]);

  // Validation
  const isValid = useMemo(() => {
    if (filterSchema?.date_range === false) {
      return true;
    }
    const rangeCheck = validateDateRange(normalizeDateInput(fromDate), normalizeDateInput(toDate));
    return rangeCheck.valid;
  }, [filterSchema?.date_range, fromDate, toDate]);

  const filterState: ReportFilterState = {
    preset,
    from_date: filterSchema?.date_range === false ? "" : normalizeDateInput(fromDate),
    to_date: filterSchema?.date_range === false ? "" : normalizeDateInput(toDate),
    mr_id: role === "MR" ? (currentUser?.id ?? null) : selectedMrId,
    mr_name: role === "MR" ? currentUser?.fullName : selectedMrName,
    manager_id: selectedManagerId,
    manager_name: selectedManagerName,
    territory_id: selectedTerritoryId,
    territory_name: selectedTerritoryName,
    customer_type: selectedCustomerType,
    status: selectedStatus,
    category: selectedCategory,
    specialization: selectedSpecialization,
    active: selectedActive,
    work_type: selectedWorkType,
    deviation_type: selectedDeviationType,
  };

  return {
    role,
    preset,
    fromDate,
    toDate,
    dateError,
    handleSelectPreset,
    handleSetCustomDates,

    // MR selection
    canPickMr: role === "MANAGER" || role === "ADMIN",
    selectedMrId,
    selectedMrName,
    setSelectedMr: (id: number | null, name?: string) => {
      setSelectedMrId(id);
      setSelectedMrName(name);
    },
    availableMrs,
    isLoadingMrs: role === "MANAGER" ? myTeamQuery.isLoading : allMrsQuery.isLoading,

    // Manager selection (Admin only)
    canPickManager: role === "ADMIN",
    selectedManagerId,
    selectedManagerName,
    setSelectedManager: (id: number | null, name?: string) => {
      setSelectedManagerId(id);
      setSelectedManagerName(name);
      // Reset selected MR when manager changes if MR doesn't belong
      setSelectedMrId(null);
      setSelectedMrName(undefined);
    },
    availableManagers: (managersQuery.data || []).map((m) => ({ id: m.id, name: m.full_name })),

    // Territory selection
    canPickTerritory: !!filterSchema?.territory_picker,
    selectedTerritoryId,
    selectedTerritoryName,
    setSelectedTerritory: (id: number | null, name?: string) => {
      setSelectedTerritoryId(id);
      setSelectedTerritoryName(name);
    },
    availableTerritories: territoriesQuery.data || [],

    // Customer Type
    canPickCustomerType: filterSchema?.customer_type_picker ?? false,
    selectedCustomerType,
    setSelectedCustomerType,

    // Status
    canPickStatus: filterSchema?.status_picker ?? false,
    selectedStatus,
    setSelectedStatus,

    // Category
    canPickCategory: Boolean(filterSchema?.category_picker),
    selectedCategory,
    setSelectedCategory,

    // Specialization
    canPickSpecialization: Boolean(filterSchema?.specialization_picker),
    selectedSpecialization,
    setSelectedSpecialization,

    // Active status
    canPickActive: Boolean(filterSchema?.active_picker),
    selectedActive,
    setSelectedActive,

    // Work type
    canPickWorkType: Boolean(filterSchema?.work_type_picker),
    selectedWorkType,
    setSelectedWorkType,

    // Deviation type
    canPickDeviationType: Boolean(filterSchema?.deviation_type_picker),
    selectedDeviationType,
    setSelectedDeviationType,

    filterState,
    isValid,
  };
}
