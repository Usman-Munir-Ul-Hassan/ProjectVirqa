import { useQuery } from "@tanstack/react-query";
import { get } from "../../../../utils/api";

export const useInterviewHistory = () => {
  return useQuery({
    queryKey: ["employee-interviews"],
    queryFn: async () => {
      const { data } = await get("/employee/interviews");
      return data.data || [];
    },
  });
};
