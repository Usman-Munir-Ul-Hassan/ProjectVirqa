import { useQuery } from "@tanstack/react-query";
import { get } from "../../../../utils/api";

export const useCandidateReport = (interviewId, candidateId) => {
  return useQuery({
    queryKey: ["employee-candidate-report", interviewId, candidateId],
    queryFn: async () => {
      const { data } = await get(`/employee/interview/${interviewId}/report/${candidateId}`);
      return data.data;
    },
    retry: 1,
    enabled: !!interviewId && !!candidateId,
  });
};
