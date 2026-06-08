import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import {useAuth} from "./useAuth";
import { toast } from "react-toastify";

export const useEmployeeProfile = () => {
  const { user } = useAuth();
  const fetchEmployeeProfile = async () => {
    const { data } = await api.get("/employee/profile");
    return data.data;
  };
  return useQuery({
    queryKey: ["employee-profile", user?.id],
    queryFn: fetchEmployeeProfile,
  });
};

export const useEmployeeDashboard = () => {
  return useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/employee/dashboard");
      return data.data;
    },
    staleTime: 0, // Always refetch on mount
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ fullName, professionalBio, currentPassword, newPassword, profilePhoto }) => {
            const formData = new FormData();
            formData.append("fullName", fullName);
            formData.append("professionalBio", professionalBio || "");
            
            if (newPassword) {
                formData.append("currentPassword", currentPassword);
                formData.append("newPassword", newPassword);
            }

            if (profilePhoto?.[0]) {
                formData.append("profilePhoto", profilePhoto[0]);
            }

            const { data } = await api.post("/employee/profile", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
            toast.success("Profile updated successfully!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update profile");
        },
    });
};

 
