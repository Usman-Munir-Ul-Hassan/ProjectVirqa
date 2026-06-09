import { Admin, User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import generateToken from "../utils/Auth.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js"
import sendEmail from "../utils/Email.js";
import {getOtpContent} from "../constants.js"

const registerHandler = asyncHandler(async (req, res) => {
    const { fullName, email, password, organization } = req.body;
    if (!fullName && !email && !password && !organization) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await Admin.findOne({ email });
    if (user) {
        throw new ApiError(400, "User already exists")
    }
    const newUser = new Admin({ fullName, password, email, organization });
    await newUser.save();
    const token = generateToken(newUser);
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }
    return res.//for getting data on front end about user
        status(200).
        cookie("token", token, options).
        json({
            message: `${newUser.fullName} registered successfully`,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                profilePhoto: newUser.profilePhoto,
                organization: newUser.organization,
                department: newUser.department,
                professionalBio: newUser.professionalBio
            },
            role: newUser.role,
            name: newUser.fullName
        })
})

const LoginHandler = asyncHandler(async (req, res) => {

    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findOne({ email }).select("+password"); // Need password for compare
    if (!user) {
        throw new ApiError(400, "Kindly Enter valid credentials")
    }
    const isPasswordValid = await user.isPasswordValid(password);//custom method
    if (!isPasswordValid) {
        throw new ApiError(400, "Kindly Enter valid credentials")
    }

    // Check if temp password has expired (24h)
    if (user.tempPasswordExpiresAt && new Date() > user.tempPasswordExpiresAt) {
        throw new ApiError(403, "Your temporary password has expired. Please contact the interviewer for a new invitation.")
    }

    // Track last login
    user.lastLogin = new Date();
    user.tempPasswordExpiresAt = null; // Clear expiry after successful login
    await user.save();

    const token = generateToken(user);
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }
    return res.//for getting data on front end about user
        status(200).
        cookie("token", token, options).
        json({
            message: `${user.fullName} logged in successfully`,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto,
                organization: user.organization,
                department: user.department,
                professionalBio: user.professionalBio
            },
            role: user.role,
            name: user.fullName
        })

})

const logoutHandler = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }
    return res.status(200).clearCookie("token", options).json(new ApiResponse(200, {}, "Successfully LoggedOut!"))
})

const forgetPassword=asyncHandler(async(req,res)=>{
    const {email}=req.body;

    if(!email){
        throw new ApiError(400, "Email is required")
    }
    const user=await User.findOne({email});
    if(!user){
        throw new ApiError(404, "User not found")
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.forgetPasswordOTP=otp;
    user.forgetPasswordExpiry=Date.now()+10*60*1000;//set for 10 minutes in milliseconds
    await user.save();
    //send email
    const result=await sendEmail(process.env.GOOGLE_USER,email,"Forget Password", getOtpContent(otp))
    if(!result) throw new ApiError(500,"Error! in sending email")
    return res.status(200).json(new ApiResponse(200,{},"Otp sent successfully!"))

})

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.forgetPasswordOTP !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (user.forgetPasswordExpiry < Date.now()) {
        throw new ApiError(400, "OTP has expired");
    }

    return res.status(200).json(new ApiResponse(200, {}, "OTP verified successfully!"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;
    
    if (!email || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    user.password = newPassword;
    user.forgetPasswordOTP = null;
    user.forgetPasswordExpiry = null;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully!"));
});

const getProfile = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, {
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profilePhoto: user.profilePhoto,
            organization: user.organization,
            department: user.department,
            professionalBio: user.professionalBio
        }
    }, "Profile fetched successfully"));
});

export {
    registerHandler,
    LoginHandler,
    logoutHandler,
    forgetPassword,
    verifyOTP,
    resetPassword,
    getProfile
}