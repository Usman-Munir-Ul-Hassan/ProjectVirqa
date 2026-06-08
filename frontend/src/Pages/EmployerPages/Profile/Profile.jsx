import { useState, memo, useEffect } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, User, Mail, Briefcase, Lock, Upload, Save, Loader2 } from "lucide-react";
import { useEmployeeProfile, useUpdateProfile } from "../../../hooks/useEmployee";
import { useForm } from "react-hook-form";

// ---------------------------
// Reusable Input Component
// ---------------------------
const Input = ({ label, icon: Icon, error, disabled, ...props }) => (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
      {Icon && <Icon size={14} />} {label}
    </label>
    <div className="relative">
      <input
        {...props}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-lg transition-all ${
          disabled
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : "bg-white focus:ring-2 focus:ring-blue-500"
        } ${error ? "border-red-400 focus:ring-red-500" : "border-gray-300"}`}
      />
      {disabled && <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />}
    </div>
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

// ---------------------------
// Password Strength Function
// ---------------------------
const getStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["red", "orange", "yellow", "green", "emerald"];

  return { score, label: labels[score - 1] || "", color: colors[score - 1] || "gray" };
};

// ---------------------------
// Password Input Component 
// ---------------------------
const PasswordInput = ({ label, error, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          {...props}
          type={isVisible ? "text" : "password"}
          className={`w-full px-4 py-2.5 border rounded-lg bg-white pr-12 transition ${
            error ? "border-red-400 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

// ---------------------------
// MAIN COMPONENT
// ---------------------------
const ProfileSettings = () => {
  const { data: profileData, isLoading } = useEmployeeProfile();
  const updateMutation = useUpdateProfile();
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      fullName: "",
      professionalBio: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Populate form when data is fetched
  useEffect(() => {
    if (profileData) {
      reset({
        fullName: profileData.fullName || "",
        professionalBio: profileData.professionalBio || "",
      });
    }
  }, [profileData, reset]);

  const newPassword = watch("newPassword");
  const strength = getStrength(newPassword);

  const handlePhotoPreview = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = (data) => {
    // Password change validation
    if (data.currentPassword && !data.newPassword) {
        return toast.error("Please provide a new password you want to set!");
    }

    if (data.newPassword && !data.currentPassword) {
        return toast.error("Please provide your current password to set a new one");
    }
    
    if (data.newPassword && strength.score < 3) {
        return toast.error("New password is too weak");
    }

    updateMutation.mutate(data);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <User size={28} /> Profile Settings
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold text-lg mb-4">Profile Photo</h3>
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-white shadow-sm">
                {previewPhoto || profileData?.profilePhoto ? (
                  <img src={previewPhoto || profileData?.profilePhoto} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User size={50} className="text-gray-400" />
                )}
              </div>
              <label className="mt-4 block text-center cursor-pointer px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <Upload size={18} /> Upload Photo
                <input type="file" className="hidden" accept="image/*" {...register("profilePhoto", { onChange: handlePhotoPreview })} />
              </label>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold text-lg mb-4">Personal Info</h3>
              <Input
                label="Full Name"
                {...register("fullName", { required: "Name is required" })}
                error={errors.fullName?.message}
              />
              <Input label="Email" icon={Mail} defaultValue={profileData?.email} disabled />
              <Input label="Job Title" icon={Briefcase} defaultValue={profileData?.jobTitle} disabled />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold text-lg mb-4">Professional Bio</h3>
              <textarea
                {...register("professionalBio")}
                placeholder="Tell something about yourself..."
                className="w-full p-4 border border-gray-300 bg-gray-50 rounded-lg min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                maxLength={250}
              />
              <div className="flex justify-end mt-2">
                <p className="text-sm text-gray-400">
                  {watch("professionalBio")?.length || 0}/250 characters
                </p>
              </div>
            </div>

            <form className="bg-white p-6 rounded-xl shadow" onSubmit={handleSubmit(onSubmit)}>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                <Lock /> Security Settings
              </h3>
              <PasswordInput label="Current Password" {...register("currentPassword")} />
              <PasswordInput label="New Password" {...register("newPassword")} />

              {newPassword && (
                <div className="mb-5">
                  <p className={`text-sm font-medium text-${strength.color}-600 mb-1`}>
                    Strength: {strength.label}
                  </p>
                  <div className="bg-gray-200 h-2 w-full rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${strength.color}-500 transition-all duration-300`}
                      style={{ width: `${strength.score * 20}%` }}
                    />
                  </div>
                </div>
              )}

              <PasswordInput 
                label="Confirm New Password" 
                {...register("confirmPassword", {
                    validate: (val) => !watch("newPassword") || val === watch("newPassword") || "Passwords do not match"
                })} 
                error={errors.confirmPassword?.message}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition active:scale-95 shadow-sm shadow-blue-200 disabled:opacity-70"
                >
                  {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProfileSettings);

