import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
import { useAuth } from "./useAuth";
import { toast } from "react-toastify";

// Fetch candidate profile hook
export const useCandidateProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["candidate-profile", user?.id],
    queryFn: async () => {
      const { data } = await api.get("/candidate/profile");
      return data.data;
    },
    enabled: !!user?.id,//If user?.id is undefined or null, !! makes it false.
  });
};

// Update candidate profile hook
export const useUpdateCandidateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData) => {
      const formData = new FormData();
      formData.append("fullName", profileData.name || "");
      formData.append("phoneNumber", profileData.phone || "");
      formData.append("location", profileData.location || "");
      formData.append("jobTitle", profileData.jobTitle || "");
      formData.append("experience", profileData.experience || "");
      formData.append("professionalBio", profileData.bio || "");
      formData.append("skills", JSON.stringify(profileData.skills || []));
      formData.append("educations", JSON.stringify(profileData.educations || []));

      // Handle documents list and files
      const existingDocs = [];
      if (profileData.documents && profileData.documents.length > 0) {
        profileData.documents.forEach((doc) => {
          if (doc.file) {
            // New file upload
            formData.append("documents", doc.file);
            existingDocs.push({
              id: doc.id,
              name: doc.name,
              size: doc.size,
              isNew: true
            });
          } else {
            // Existing uploaded file
            existingDocs.push({
              id: doc.id,
              name: doc.name,
              size: doc.size,
              url: doc.url
            });
          }
        });
      }
      formData.append("existingDocuments", JSON.stringify(existingDocs));

      // Handle avatar file upload
      if (profileData.profilePhotoFile) {
        formData.append("profilePhoto", profileData.profilePhotoFile);
      }

      const { data } = await api.post("/candidate/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
};

// Join an interview — calls PATCH /employee/interview/:id/join
// The :id becomes req.params.id on the backend
export const useJoinInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interviewId) => {
      const { data } = await api.patch(`/employee/interview/${interviewId}/join`);
      return data;
    },
    onSuccess: () => {
      // Refresh the candidate's interview list so status updates
      queryClient.invalidateQueries({ queryKey: ["candidate-interviews"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to join interview"
      );
    },
  });
};

// Fetch candidate interviews hook
export const useCandidateInterviews = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["candidate-interviews", user?.id],
    queryFn: async () => {
      const { data } = await api.get("/candidate/interviews");
      return data.data;
    },
    enabled: !!user?.id,
  });
};
