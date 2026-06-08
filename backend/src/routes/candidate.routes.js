import { Router } from "express";
import { verifyJwt } from "../middlewares/authMiddleware.js";
import { getProfile, handleProfile } from "../controllers/candidate.controller.js";
import { getCandidateInterviews, chatWithAI, getInterviewReport } from "../controllers/interview.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const candidateRouter = Router();

candidateRouter.get("/interviews", verifyJwt, getCandidateInterviews);
candidateRouter.post("/interview/:id/chat", verifyJwt, chatWithAI);
candidateRouter.get("/interview/:id/report", verifyJwt, getInterviewReport);
candidateRouter.get("/profile", verifyJwt, getProfile);
candidateRouter.post("/profile",
    verifyJwt,
    upload.fields([
        { name: "profilePhoto", maxCount: 1 },
        { name: "documents" }
    ]),
    handleProfile
);

export default candidateRouter;
