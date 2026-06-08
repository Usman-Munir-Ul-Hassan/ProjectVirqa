import { useState, memo, useEffect } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, User, Mail, Briefcase, Lock, Upload, Save, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { useAdminProfile, useUpdateAdminProfile } from "../../../hooks/useAdmin";
import { useForm } from "react-hook-form";

// ---------------------------
// Reusable Input Component
// ---------------------------
const Input = ({ label, icon: Icon, error, disabled, className, ...props }) => (
    <div className={`mb-5 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            {Icon && <Icon size={14} className="text-gray-500" />} {label}
        </label>
        <div className="relative">
            <input
                {...props}//sets field value automatically like fullName, rules like required
                disabled={disabled}
                className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200
                    ${disabled
                        ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                        : "bg-white border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-gray-900"
                    }
                    ${error ? "border-red-400 focus:ring-red-100" : ""}
                `}
            />
            {disabled && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={14} />
                </div>
            )}
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

    return {
        score,
        label: labels[score - 1] || "",
        color: colors[score - 1] || "gray",
    };
};

// ---------------------------
// Password Input Component 
// ---------------------------
const PasswordInput = ({ label, error, ...props }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Lock size={14} className="text-gray-500" /> {label}
            </label>
            <div className="relative">
                <input
                    {...props}
                    type={isVisible ? "text" : "password"}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white pr-12 transition-all duration-200
                        ${error ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"}
                    `}
                />
                <button
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
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
    const [previewPhoto, setPreviewPhoto] = useState(null);
    
    // Fetch Profile
    const { data: profileData, isLoading: isFetching } = useAdminProfile();
    const mutation = useUpdateAdminProfile();

    // Initialize useForm
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            fullName: "",
            professionalBio: "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        }
    });

    // Populate form when data is fetched
    useEffect(() => {
        if (profileData) {
            reset({
                fullName: profileData.fullName || "",
                professionalBio: profileData.professionalBio || ""
            });
        }
    }, [profileData, reset]);

    const newPassword = watch("newPassword");
    const strength = getStrength(newPassword);

    // ---------------------------
    // Photo Preview Handler
    // ---------------------------
    const handlePhotoPreview = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => setPreviewPhoto(reader.result);
        reader.readAsDataURL(file);
    };

    // ----------------------------
    // here data is of hook (react hook form) not of api
    // ----------------------------
    const onSubmit = (data) => {
        // Validation check for password change
        if (data.currentPassword && !data.newPassword) {
            return toast.error("Please provide a new password you want to set!");
        }
        if (data.newPassword && !data.currentPassword) {
            return toast.error("Please provide your current password to set a new one");
        }
        if (data.newPassword && strength.score < 3) {
            return toast.error("Your new password is too weak");
        }

        mutation.mutate(data);
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium font-outfit">Loading  profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-8xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
                    <p className="text-gray-600">Manage your account information and preferences</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* ---------------------------
                        Left Column: Identity & Fixed Info (4 Cols)
                    --------------------------- */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-md flex items-center justify-center">
                                    {previewPhoto || profileData?.profilePhoto ? (
                                        <img src={previewPhoto || profileData?.profilePhoto} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        <User size={48} className="text-gray-400" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 cursor-pointer shadow-sm transition-colors">
                                    <Upload size={16} />
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        {...register("profilePhoto", { onChange: handlePhotoPreview })} 
                                    />
                                </label>
                            </div>

                            <h2 className="mt-4 text-lg font-bold text-gray-800">{profileData?.fullName || "Admin User"}</h2>
                            <p className="text-sm text-gray-500">System Administrator</p>

                            <div className="mt-6 pt-6 border-t border-gray-100 text-left">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Details</h3>

                                <Input label="Email Address" icon={Mail} defaultValue={profileData?.email} disabled />
                                <Input label="Role" icon={ShieldCheck} defaultValue="Administrator" disabled />
                                <Input label="Department" icon={Briefcase} defaultValue={profileData?.department} disabled />
                            </div>
                        </div>

                        {/* Company Info (Fixed) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Building2 size={14} /> Organization
                            </h3>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                <div className="font-semibold text-blue-900">{profileData?.organization || "VIRQA"}</div>
                                <div className="text-xs text-blue-600 mt-1">Enterprise License • Active</div>
                            </div>
                        </div>
                    </div>

                    {/* ---------------------------
                        Right Column: Editable Info & Security (8 Cols)
                    --------------------------- */}
                    <div className="lg:col-span-8 space-y-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Personal Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                    <User size={20} className="text-blue-600" />
                                    Personal Information
                                </h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <Input
                                        label="Full Name"
                                        {...register("fullName", { required: "Name is required" })}
                                        error={errors.fullName?.message}
                                        className="col-span-2"
                                    />

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Professional Bio
                                        </label>
                                        <textarea
                                            {...register("professionalBio")}
                                            placeholder="Share a brief description about your role..."
                                            className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
                                            maxLength={250}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <p className="text-xs text-gray-400">
                                                Max 250 characters
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-blue-600" />
                                    Security & Password
                                </h3>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <PasswordInput
                                            label="Current Password"
                                            {...register("currentPassword")}
                                        />
                                    </div>

                                    <PasswordInput
                                        label="New Password"
                                        {...register("newPassword")}
                                    />

                                    <PasswordInput
                                        label="Confirm Password"
                                        {...register("confirmPassword", {
                                            validate: (value) => !watch("newPassword") || value === watch("newPassword") || "Passwords do not match"
                                        })}
                                        error={errors.confirmPassword?.message}
                                    />

                                    {newPassword && (
                                        <div className="col-span-2 bg-gray-50 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-700">Password Strength</span>
                                                <span className={`text-sm font-bold text-${strength.color}-600`}>
                                                    {strength.label}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-${strength.color}-500 transition-all duration-300`}
                                                    style={{ width: `${strength.score * 20}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutation.isPending}
                                    className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {mutation.isPending ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    {mutation.isPending ? "Saving..." : "Save Changes"}
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
/*
Step-by-step:
Form loads → empty
API comes → reset() fills form
User types → watch() updates values
UI reacts (strength, etc.)
Validation runs (register rules)
On submit:
extra checks run
FormData created
data sent 
*/