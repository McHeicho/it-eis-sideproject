import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/api/axios";

/**
 * Filtered equipment list. Filters are part of the cache key, so each
 * distinct filter combination gets its own cache entry.
 */
export function useEquipmentList(filters, options = {}) {
    return useQuery({
        queryKey: ["equipment", "list", filters],
        queryFn: async ({ signal }) => {
            const { data } = await api.get("/equipment", {
                params: filters,
                signal,
            });
            return data;
        },
        placeholderData: keepPreviousData,
        ...options,
    });
}