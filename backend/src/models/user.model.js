import mongoose from "mongoose";
import bcrypt from "bcrypt"

//uisng discriminator concept(like inheritence) here

// 1. BASE SCHEMA: Shared by everyone
const baseOptions = {
    discriminatorKey: 'role', // This tells Mongoose which sub-schema to use
    timestamps: true 
};

const userSchema = new mongoose.Schema({
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    profilePhoto: { type: String,default:null },
    phoneNumber:{type:String},
    professionalBio:{type:String},
    organization:{type:String},
    forgetPasswordOTP:{type:String,default:null},
    forgetPasswordExpiry:{type:Date,default:null},
    lastLogin: { type: Date, default: null },
    tempPasswordExpiresAt: { type: Date, default: null },
    // Shared metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, baseOptions);


//hook for encrpting the password
userSchema.pre("save",async function(next){
 if(!this.isModified("password"))//to ensure every time the data is saved the password not changed 
    return next();
 this.password=await bcrypt.hash(this.password, 10);

})

userSchema.methods.isPasswordValid=async function(password){
return await bcrypt.compare(password,this.password)//return a boolean
}
const User = mongoose.model("User", userSchema);


// 2. CANDIDATE SCHEMA: Specific to those taking interviews
const Candidate = User.discriminator('candidate', new mongoose.Schema({
    resumeUrl: { type: String },
    skills: [String],
    location:{type:String},
    experience:{type:String,default:"0"},
    jobTitle: { type: String },
    educations: [{
        id: { type: Number },
        degree: { type: String },
        institution: { type: String },
        location: { type: String },
        year: { type: String },
        description: { type: String }
    }],
    documents: [{
        id: { type: Number },
        name: { type: String },
        size: { type: String },
        url: { type: String }
    }],
    level: {
        type: String,
        enum: ["junior", "mid", "senior"]
    },
    overallConfidenceScore: { type: Number, default: 0 },
    parsedResumeText: { type: String, default: "" },
    performanceReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }] 
}));

// 3. EMPLOYEE SCHEMA: For the "Employer Dashboard" users
const Employee = User.discriminator('employee', new mongoose.Schema({
    jobTitle: { type: String },
    department: { type: String },
    assignedCandidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ["Pending", "Verified", "Deactivated"],
      default: "Pending",
    },
    verificationToken: String,//token for activation of account first time
    verificationTokenExpires: Date
}));

// 4. ADMIN SCHEMA: High-level system access
const Admin = User.discriminator('admin', new mongoose.Schema({
    permissions: [String],
    systemLogsAccess: { type: Boolean, default: true },
    department:{type:String,default:"not given"}
}));


export { User, Candidate, Employee, Admin };