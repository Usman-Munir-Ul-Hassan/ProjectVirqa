import { useState, useRef, useEffect } from "react";
import { Menu, ArrowLeft, User, Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import NotificationDropdown from "./NotificationDropDown.jsx";
import Logo from "./Logo";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from "../../../store/authSlice.js";

export const MultiStepLoaderHeader = ({ sidebarOpen, toggleSidebar }) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Logic for dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#1a56db] border-b border-white/10 shadow-lg flex items-center justify-between px-6 z-50 text-white backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 lg:hidden hover:bg-white/10 rounded-lg transition-colors">
                    {sidebarOpen ? <ArrowLeft size={22} /> : <Menu size={22} />}
                </button>
                <div className="flex items-center gap-4">
                    <Logo theme="light" className="scale-90" />
                    <div className="hidden md:block h-6 w-px bg-white/20"></div>
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-1">Control Center</span>
                        <span className="text-sm font-bold">Admin Dashboard</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-6">
                <NotificationDropdown
                    iconColor="text-white"
                    iconBg="bg-white/10"
                    viewAllPath="/api/v1/admin/notifications"
                />
                <div className="h-8 w-px bg-white/20 hidden sm:block"></div>

                {/* User Profile Section with Click Logic */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-2 group outline-none"
                    >
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold leading-none">{user?.fullName || "Admin"}</span>
                            <span className="text-[10px] text-blue-100 font-medium mt-1">Super Admin</span>
                        </div>

                        <div className="relative">
                            {user?.profilePhoto ? (
                                <img src={user.profilePhoto} alt="profile" className="w-9 h-9 rounded-full border-2 border-white/50 object-cover shadow-sm group-hover:border-white transition-all" />
                            ) : (
                                <div className="w-9 h-9 rounded-full border-2 border-white/50 bg-blue-500 flex items-center justify-center font-bold text-sm shadow-sm group-hover:border-white transition-all">
                                    {user?.fullName?.charAt(0).toUpperCase() || <User size={18} />}
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#1a56db] rounded-full"></div>
                        </div>
                        <ChevronDown size={14} className={`text-blue-200 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Actual Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 text-gray-800 animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="px-4 py-3 border-b border-gray-50 mb-1">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                            </div>
                            
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default MultiStepLoaderHeader;
