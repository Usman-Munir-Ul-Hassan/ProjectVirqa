import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";

import cookieParser from "cookie-parser";
import employeeRouter from "./routes/employee.routes.js"
import adminRouter from "./routes/admin.routes.js";
import candidateRouter from "./routes/candidate.routes.js";
import notificationRouter from "./routes/notification.routes.js";

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
  credentials: true, // This allows the frontend to send/receive cookies
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"))//for static files like favicon and pdfs 

//testing
app.get('/', (req, res) => {
  res.send('<h1> VIRQA Backend is working fine</h1>')
})

app.use('/api/v1/user', authRouter);
app.use('/api/v1/employee', employeeRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/candidate', candidateRouter);
app.use('/api/v1/notifications', notificationRouter);


export default app;
