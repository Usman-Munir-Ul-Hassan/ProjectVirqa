import { Router } from "express";
import { 
        getProfile,
        handleProfile,
        updateEmployee,
        getManageEmployees,
        addEmployee,
        deleteEmployee,
        getDashboardStats
    } from "../controllers/admin.controller.js";
import { verifyJwt, restrictToRole } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const adminRouter=Router()
adminRouter.get("/profile",
    verifyJwt,
    restrictToRole("admin"),
    getProfile
)
adminRouter.get("/dashboard-stats",
    verifyJwt,
    restrictToRole("admin"),
    getDashboardStats
)
adminRouter.post("/profile",
    verifyJwt,
    restrictToRole("admin"),
     upload.fields([
    { name: "profilePhoto", maxCount: 1 }
     ]),
    handleProfile
)
adminRouter.post("/add-employee",
    verifyJwt,
    restrictToRole("admin"),
    addEmployee
)

adminRouter.patch("/update-employee",
    verifyJwt,
    restrictToRole("admin"),
    updateEmployee
)

adminRouter.get("/manage-employee",
    verifyJwt,
    restrictToRole("admin"),
    getManageEmployees
)
adminRouter.delete("/employee/:id",
    verifyJwt,
    restrictToRole("admin"),
    deleteEmployee
)

export default adminRouter