import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

/**
 * Shared reference-data lookups: equipment types, brands, models,
 * suppliers, conditions, statuses, employees. Backed by the single
 * consolidated /equipment/form-data endpoint under one cache key.
 *
 * Any page needing dropdown data calls this hook — single source of
 * truth. After a Maintenance-modal edit, invalidate ["lookups"] to
 * refresh every consumer at once.
 */
export function useLookups() {
    return useQuery({
        queryKey: ["lookups"],
        queryFn: async ({ signal }) => {
            const { data } = await api.get("/equipment/form-data", { signal });
            return data;
        },
    });
}