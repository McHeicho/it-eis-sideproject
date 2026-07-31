import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/api/axios";

export function useDeliveries(filters) {
    return useQuery({
        queryKey: ["deliveries", "list", filters],
        queryFn: async ({ signal }) => {
            const { data } = await api.get("/deliveries", {
                params: filters,
                signal,
            });
            return data;
        },
        placeholderData: keepPreviousData,
    });
}