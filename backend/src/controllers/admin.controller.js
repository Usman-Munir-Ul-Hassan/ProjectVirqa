import { Admin, Employee, Candidate, User } from "../models/user.model.js";
import Interview from "../models/interview.model.js";
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js";
import { deleteDataFromCloudinary } from "../utils/FileRemovalCloudinary.js";
import { uploadOnCloudinary } from "../utils/FileUploadCloudinary.js";
import sendEmail from "../utils/Email.js";
import { ApiError } from "../utils/ApiError.js";
import { createAndEmitNotification } from "./notification.controller.js";

//My Profile --GET
const getProfile = asyncHandler(async (req, res) => {
    const user = await Admin.findById(req.user._id);
    if (!user) throw new ApiError(404, "Admin not found");

    return res.status(200).json(new ApiResponse(200, {
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto || null,
        organization: user.organization || null,
        department: user.department || null,
        professionalBio: user.professionalBio || null
    }, "Success!"));
});

//My Profile --POST
const handleProfile = asyncHandler(async (req, res) => {
    const user = await Admin.findById(req.user._id);
    if (!user) throw new ApiError(404, "Admin not found");

    // update only if values are provided
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.password) user.password = req.body.password; // bcrypt by prehook
    if (req.body.department) user.department = req.body.department;
    if (req.body.organization) user.organization = req.body.organization;
    if (req.body.professionalBio) user.professionalBio = req.body.professionalBio;

    // handle profile photo
    if (req.files?.profilePhoto?.[0]) {
        const file = req.files.profilePhoto[0];
        const oldProfileUrl = user.profilePhoto;

        const url = await uploadOnCloudinary(file.path, "admins/profilePhotos");
        if (url) user.profilePhoto = url;

        // delete old profile photo if it exists
        if (oldProfileUrl) {
            try {
                await deleteDataFromCloudinary(oldProfileUrl);
            } catch (err) {
                console.log("Failed to delete old profile:", err.message);
            }
        }
    }

    await user.save();

    return res.status(200).json(new ApiResponse(200, {
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto || null,
        organization: user.organization || null,
        department: user.department || null,
        professionalBio: user.professionalBio || null
    }, "Profile updated successfully!"));
});

//Manage Employees(add employee) --POST
const addEmployee = asyncHandler(async (req, res) => {
    //search 
    const { email, role } = req.body
    // check if employee already exists
    const existingUser = await Employee.findOne({ email });
    if (existingUser) throw new ApiError(400, "employee already exists");
    // create activation token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    // save employee in DB
    const user = await Employee.create({
        email,
        jobTitle: role,
        status: "Pending",
        verificationToken: token,
        createdBy: req.user._id,
        verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });
    await user.save({ validateBeforeSave: false });
    // activation link
    const activationLink = `http://localhost:5173/activate-account?token=${token}`;

    const activationContent = `
    <h2>Welcome to VIRQA!</h2>
    <p>Hi there,</p>
    <p>We're thrilled to have you on board. To get started and unlock all the features of your new account, please verify your email address by clicking the button below.</p>
    <div class="button-container">
      <a href="${activationLink}" class="button">Verify Email Address</a>
    </div>
    <p>If you didn't create an account with VIRQA, you can safely ignore this email.</p>
    <p>Best regards,<br><strong>The VIRQA Team</strong></p>
  `;

    const result = await sendEmail(process.env.GOOGLE_USER, email, "EMPLOYEE", activationContent)
    if (!result) throw new ApiError(500, "Error! in sending email")

    // Notify all admins about the new employee
    try {
      const io = global._io;
      const admins = await Admin.find({}).select("_id").lean();
      for (const admin of admins) {
        await createAndEmitNotification({
          io,
          recipientId: admin._id,
          senderId: req.user._id,
          type: "employee",
          title: "New Employee Added",
          message: `${email} has been added as ${role || "Employee"}.`,
          details: "The employee will receive an activation email shortly.",
          link: "/api/v1/admin/manage/employee",
          relatedEntity: { entityType: "user", entityId: user._id },
        });
      }
    } catch (notifErr) {
      console.error("Notification error (addEmployee):", notifErr.message);
    }

    return res.status(200).json({
        message: "Employee invited successfully",
        activationLink
    });
})



//Manage Employees -- PATCH (update employee)
const updateEmployee = asyncHandler(async (req, res) => {
    const { oldEmail, email, role } = req.body;

    //finding user with oldemail for updating the user
    const employee = await Employee.findOne({ email: oldEmail });
    // Update email & role
    if (email) employee.email = email;
    if (role) employee.jobTitle = role;
    await employee.save();
    return res.status(200).json(
        new ApiResponse(200, email, "updated sucessfully")
    );
});
//Manage Employees -- DELETE (delete employee)
const deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    //check new email
    const employee = await Employee.findById(id);//checking if id is right or wrong
    if (!employee)
        throw new ApiError(404, "id doesnot exists!");
    // Delete from DB
    await Employee.findByIdAndDelete(id);
    return res.status(200).json({
        message: "Employee deleted permanently",
        id
    });
});


//Manage Employees --GET
const getManageEmployees = asyncHandler(async (req, res) => {
    const employees = await Employee.find({ createdBy: req.user._id });
    return res.status(200).json(new ApiResponse(200,
        employees
        , "Success!"));

})

// Dashboard Stats --GET
const getDashboardStats = asyncHandler(async (req, res) => {
    const [employeeCount, candidateCount, interviewCount, recentCandidates] = await Promise.all([
        Employee.countDocuments({ role: 'employee' }),
        Candidate.countDocuments({ role: 'candidate' }),
        Interview.countDocuments(),
        Candidate.find({ role: 'candidate' })
            .sort({ createdAt: -1 })
            .limit(6)
            .select("fullName email createdAt overallConfidenceScore")
    ]);

    // Map candidate data to format expected by frontend
    const candidates = recentCandidates.map(c => ({
        id: c._id,
        name: c.fullName,
        role: "Candidate", // We can add specific role if stored in DB later
        score: c.overallConfidenceScore || null,
        status: "Pending", // Default or derived from data
        date: c.createdAt.toISOString().split('T')[0]
    }));

    return res.status(200).json(new ApiResponse(200, {
        stats: {
            totalEmployees: employeeCount,
            totalCandidates: candidateCount,
            totalInterviews: interviewCount
        },
        recentCandidates: candidates
    }, "Dashboard stats fetched successfully"));
});

export {
    getProfile,
    handleProfile,
    addEmployee,
    getManageEmployees,
    updateEmployee,
    deleteEmployee,
    getDashboardStats
}