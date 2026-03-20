import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "../api/client";
import { toSafePatient, type SafePatient } from "../types";
import { QUERY_STALE_TIME, QUERY_RETRY_COUNT } from "../config/constants";

export function usePatients() {
  return useQuery<SafePatient[]>({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await patientsApi.list();
      // Validate every item — unknown shape from API becomes SafePatient
      return (res.patients ?? []).map(toSafePatient);
    },
    staleTime: QUERY_STALE_TIME,
    retry: QUERY_RETRY_COUNT,
  });
}
