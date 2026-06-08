import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';

// Standalone fetcher for useQuery
export const getInterviews = async () => {
    const response = await api.get('/employee/interviews');
    return response.data.data;
};

/**
 * Custom hook to manage all Interview CRUD operations
 */
export const useInterviews = () => {
    const queryClient = useQueryClient();

    // 1. Fetch all interviews
    const { 
        data: interviews = [], 
        isLoading, 
        isError,
        refetch 
    } = useQuery({
        queryKey: ['interviews'],
        queryFn: () => getInterviews()
    });

    // 2. Create a new interview
    const createMutation = useMutation({
        mutationFn: async (newInterview) => {
            const response = await api.post('/employee/create-interview', newInterview);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['interviews']);
            queryClient.invalidateQueries(['employee-dashboard']);
            toast.success('Interview created successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create interview');
        }
    });

    // 3. Extend interview deadline
    const extendMutation = useMutation({
        mutationFn: async ({ id, minutes, newDeadline }) => {
            const response = await api.patch(`/employee/interview/${id}/extend`, { minutes, newDeadline });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['interviews']);
            queryClient.invalidateQueries(['employee-dashboard']);
            toast.success('Interview deadline extended!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to extend interview');
        }
    });

    // 4. Add candidates to existing interview
    const addCandidatesMutation = useMutation({
        mutationFn: async ({ id, candidateEmails }) => {
            const response = await api.patch(`/employee/interview/${id}/add-candidates`, { candidateEmails });
            return response.data;
        },
        onSuccess: (responseData) => {
            queryClient.invalidateQueries(['interviews']);
            queryClient.invalidateQueries(['employee-dashboard']);
            const addedCount = responseData.data?.added?.length || 0;
            const failedCount = responseData.data?.failed?.length || 0;
            
            if (failedCount > 0) {
                const failureReasons = responseData.data.failed.map(f => `${f.email}: ${f.reason}`).join(" | ");
                toast.warning(`Added ${addedCount}. Failed ${failedCount}: ${failureReasons}`);
            } else {
                toast.success('Candidates added successfully!');
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add candidates');
        }
    });

    return {
        interviews,
        isLoading,
        isError,
        refetch,
        createInterview: createMutation.mutateAsync,
        isCreating: createMutation.isPending || createMutation.isLoading,
        extendInterview: extendMutation.mutateAsync,
        isExtending: extendMutation.isPending || extendMutation.isLoading,
        addCandidates: addCandidatesMutation.mutate,
        isAddingCandidates: addCandidatesMutation.isPending || addCandidatesMutation.isLoading
    };
};
