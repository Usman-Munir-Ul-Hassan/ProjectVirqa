import { useQuery } from '@tanstack/react-query';
import api from '../../../../utils/api';

export const useCandidateResults = () => {
  return useQuery({
    queryKey: ['candidate-interviews-results'],
    queryFn: async () => {
      const { data } = await api.get('/candidate/interviews');
      return (data.data || []).filter(
        (iv) => iv.status === 'Completed' || iv.status === 'completed'
      );
    },
  });
};
