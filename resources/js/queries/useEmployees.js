import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

/**
 * Full employees list — no filters. The HO/MLA view split on
 * EmployeeList is a pure client-side derivation and never leaves
 * the browser, so there's nothing here for a filters argument to do.
 */
export function useEmployees() {
    return useQuery({
        queryKey: ["employees", "list"],
        queryFn: async ({ signal }) => {
            const { data } = await api.get("/employees", { signal });
            return data;
        },
    });
}
