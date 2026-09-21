import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

/**
 * Full assignments list — no filters. The dropdown filters on
 * AssignmentList are pure client-side derivations and never leave
 * the browser, so there's nothing here for a filters argument to do.
 */
export function useAssignmentsList() {
    return useQuery({
        queryKey: ["assignments", "list"],
        queryFn: async ({ signal }) => {
            // active=1: the list and the Assign modal only read open rows.
            const { data } = await api.get("/assignments", {
                params: { active: 1 },
                signal,
            });
            return data;
        },
    });
}