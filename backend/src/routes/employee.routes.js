import { Router } from "express";
import { 
    getProfile, 
    handleProfile, 
    activateAccount,
    getDashboardData 
} from "../controllers/employee.controller.js";
import { LoginHandler, logoutHandler } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { 
    createInterview, 
    getInterviews, 
    generatePrompt, 
    addCandidatesToInterview,
    getEmployeeInterviewReport,
    joinInterview,
    extendInterviewDeadline
} from "../controllers/interview.controller.js";
import { verifyJwt } from "../middlewares/authMiddleware.js";
import Report from "../models/report.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


const employeeRouter = Router();

employeeRouter.post("/login", LoginHandler);
employeeRouter.post("/logout", verifyJwt, logoutHandler);

employeeRouter.get("/profile", verifyJwt, getProfile);
employeeRouter.get("/dashboard", verifyJwt, getDashboardData);
employeeRouter.post("/profile",
    verifyJwt,
    upload.fields([
        { name: "profilePhoto", maxCount: 1 }
    ]),
    handleProfile);

employeeRouter.post("/activate-account",
    activateAccount
);

// Interview management
employeeRouter.get("/interviews", verifyJwt, getInterviews);
employeeRouter.post("/create-interview", verifyJwt, createInterview);
employeeRouter.patch("/interview/:id/add-candidates", verifyJwt, addCandidatesToInterview);
employeeRouter.get("/interview/:id/report/:candidateId", verifyJwt, getEmployeeInterviewReport);
employeeRouter.patch("/interview/:id/join", verifyJwt, joinInterview);
employeeRouter.patch("/interview/:id/extend", verifyJwt, extendInterviewDeadline);
employeeRouter.post("/generate-prompt", verifyJwt, generatePrompt);

// Leaderboard endpoint (formerly HR)
employeeRouter.get(
  "/interview-leaderboard",
  verifyJwt,
  asyncHandler(async (req, res) => {
    const leaderboard = await Report.aggregate([
      { $match: { gradingStatus: "completed", pdfUrl: { $exists: true } } },
      {
        $lookup: {
          from: "interviews",
          localField: "interview",
          foreignField: "_id",
          as: "interviewInfo",
        },
      },
      { $unwind: "$interviewInfo" },
      {
        $lookup: {
          from: "users",
          localField: "candidate",
          foreignField: "_id",
          as: "candidateInfo",
        },
      },
      { $unwind: "$candidateInfo" },
      {
        $project: {
          _id: 0,
          name: "$candidateInfo.fullName",
          role: "$candidateInfo.role",
          overallScore: "$overallScore",
          pdfUrl: 1,
        },
      },
      { $sort: { overallScore: -1 } },
    ]);
    return res.status(200).json(new ApiResponse(200, leaderboard, "Leaderboard fetched"));
  })
);

export default employeeRouter;