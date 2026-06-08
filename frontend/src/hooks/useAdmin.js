import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { toast } from 'react-toastify';

// --- Dashboard Stats ---
export const useDashboardStats = () => {
    return useQuery({
        queryKey: ['admin', 'dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/dashboard-stats');
            return response.data.data;
        }
    });
};

// --- Manage Employees ---
export const useEmployees = () => {
    return useQuery({
        queryKey: ['admin', 'employees'],
        queryFn: async () => {
            const response = await api.get('/admin/manage-employee');
            // Map backend jobTitle to role and _id to id for frontend compatibility
            return response.data.data.map(emp => ({
                id: emp._id,
                email: emp.email,
                role: emp.jobTitle,
                status: emp.status
            }));
        }
    });
};

export const useAddEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newEmployee) => {
            const response = await api.post('/admin/add-employee', newEmployee);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
            toast.success('Employee invited successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add employee');
        }
    });
};

export const useUpdateEmployee = (oldEmail) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updatedData) => {
            const response = await api.patch('/admin/update-employee', {
                oldEmail: oldEmail,
                email: updatedData.email,
                role: updatedData.role
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
            toast.success('Employee updated successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update employee');
        }
    });
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(`/admin/employee/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'employees'] });
            toast.success('Employee removed successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete employee');
        }
    });
};

// --- Profile ---
export const useAdminProfile = () => {
    return useQuery({
        queryKey: ['admin', 'profile'],
        queryFn: async () => {
            const response = await api.get('/admin/profile');
            return response.data.data;
        }
    });
};

export const useUpdateAdminProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ fullName, professionalBio, currentPassword, newPassword, organization, department, profilePhoto }) => {
            const formData = new FormData();
            formData.append('fullName', fullName);
            formData.append('professionalBio', professionalBio || '');
            formData.append('organization', organization || '');
            formData.append('department', department || '');
            
            if (newPassword) {
                formData.append('currentPassword', currentPassword);
                formData.append('newPassword', newPassword);
            }

            if (profilePhoto?.[0]) {
                formData.append('profilePhoto', profilePhoto[0]);
            }

            const response = await api.post('/admin/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] });
            toast.success('Profile updated successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        }
    });
};
