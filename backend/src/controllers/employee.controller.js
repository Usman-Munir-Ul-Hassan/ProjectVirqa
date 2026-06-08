import asyncHandler from "../utils/asyncHandler.js";
import { Employee } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import Interview from "../models/interview.model.js";
import { uploadProfilePhoto } from "../services/cloudinaryHelper.js";
import { buildCandidateList, computeStatusCounts, buildChartData } from "../services/dashboardService.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET employee profile
// GET /api/v1/employee/profile
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await Employee.findById(req.user._id);
  if (!user) throw new ApiError(404, "Employee not found");

  return res.status(200).json(new ApiResponse(200, {
    fullName: user.fullName || null,
    email: user.email,
    profilePhoto: user.profilePhoto || null,
    organization: user.organization || null,
    department: user.department || null,
    professionalBio: user.professionalBio || null,
    jobTitle: user.jobTitle || null,
  }, "Success!"));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST update employee profile
// POST /api/v1/employee/profile
// ─────────────────────────────────────────────────────────────────────────────
const handleProfile = asyncHandler(async (req, res) => {
  const user = await Employee.findById(req.user._id).select('+password');

  // Update text fields if provided
  if (req.body.fullName) user.fullName = req.body.fullName;
  if (req.body.professionalBio) user.professionalBio = req.body.professionalBio;

  // Handle password change
  if (req.body.currentPassword) {
    const isValid = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!isValid) {
      throw new ApiError(400, "Kindly provide valid current password");
    }
  }
  if (req.body.newPassword) user.password = req.body.newPassword; // bcrypt by pre-hook

  // Handle profile photo via Cloudinary helper
  if (req.files?.profilePhoto?.[0]) {
    const url = await uploadProfilePhoto(
      req.files.profilePhoto[0].path,
      "employees/profilePhotos",
      user.profilePhoto
    );
    if (url) user.profilePhoto = url;
  }

  await user.save();

  return res.status(200).json(new ApiResponse(200, {
    fullName: user.fullName || null,
    email: user.email,
    profilePhoto: user.profilePhoto || null,
    organization: user.organization || null,
    department: user.department || null,
    professionalBio: user.professionalBio || null,
    jobTitle: user.jobTitle || null,
  }, "Profile updated successfully!"));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST activate employee account (token verification)
// POST /api/v1/employee/activate-account
// ─────────────────────────────────────────────────────────────────────────────
const activateAccount = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(500, "Token or password is missing!");

  const employee = await Employee.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!employee) {
    throw new ApiError(400, "Invalid or expired token");
  }

  employee.password = password;
  employee.status = "Verified";
  employee.verificationToken = null;
  employee.verificationTokenExpires = null;

  await employee.save();
  return res.status(200).json(new ApiResponse(200, "account activated successfuly!", {}));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET EMPLOYEE DASHBOARD DATA
// GET /api/v1/employee/dashboard
// Returns: candidates (with scores + statuses), chartData (avg scores by role), statusCounts
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardData = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;

  // 1. Fetch all interviews for this employee with candidate + report data
  const interviews = await Interview.aggregate([
    { $match: { employee: employeeId } },
    {
      $lookup: {
        from: "users",
        localField: "candidates",
        foreignField: "_id",
        as: "candidateUsers",
      },
    },
    {
      $lookup: {
        from: "reports",
        localField: "_id",
        foreignField: "interview",
        as: "reports",
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        _id: 1,
        jobTitle: 1,
        status: 1,
        createdAt: 1,
        startAt: 1,
        candidateUsers: {
          $map: {
            input: "$candidateUsers",
            as: "c",
            in: {
              _id: "$$c._id",
              fullName: "$$c.fullName",
              email: "$$c.email",
            },
          },
        },
        reports: {
          $map: {
            input: "$reports",
            as: "r",
            in: {
              candidate: "$$r.candidate",
              overallScore: "$$r.overallScore",
              gradingStatus: "$$r.gradingStatus",
            },
          },
        },
      },
    },
  ]);

  // 2. Build flat candidate list using extracted service
  const candidates = buildCandidateList(interviews);

  // 3. Compute status counts
  const statusCounts = computeStatusCounts(candidates);

  // 4. Build chart data
  const chartData = buildChartData(interviews);

  return res.status(200).json(
    new ApiResponse(
      200,
      { candidates, statusCounts, chartData },
      "Dashboard data fetched successfully"
    )
  );
});

export { getProfile, handleProfile, activateAccount, getDashboardData };
