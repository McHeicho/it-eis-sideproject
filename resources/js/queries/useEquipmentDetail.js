import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

export function useEquipmentDetail(id) {
    return useQuery({
        queryKey: ["equipment", "detail", id],
        queryFn: async ({ signal }) => {
            const { data } = await api.get(`/equipment/${id}`, { signal });
            return data;
        },
        enabled: !!id,
    });
}