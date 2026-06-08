import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String
  },
  aiPrompt: {
    type: String
  },

  // The person who created the interview
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // The people being interviewed (array)
  // Users invited to the interview
  candidates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],

  // Users who have actually joined / completed the interview
  joinedCandidates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],

  // Scheduling
  startDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 60
  }, // in minutes
  timezone: {
    type: String
  },
  deadline: {
    type: Date
  },
  startAt: {
    type: Date
  },

  status: {
    type: String,
    enum: ["Scheduled", "Ongoing", "Completed", "Cancelled"],
    default: "Scheduled"
  },

  // Results (populated later)
  overallScore: {
    type: Number,
    default: 0
  },
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report"
  },
  numberOfQuestions: {
    type: Number,
    default: 5
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },
  conversation: [
    {
      role:      { type: String, required: true },
      content:   { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  finalScores: {
    type: mongoose.Schema.Types.Mixed
  },
  endedAt: {
    type: Date
  }
}, { timestamps: true });

// Pre-save hook: validate candidates and joinedCandidates
interviewSchema.pre('save', async function (next) {
  // 1. Internal duplicate check 
  if (this.candidates?.length) {
    const uniq = new Set(this.candidates.map(id => id.toString()));
    if (uniq.size !== this.candidates.length) {
      return next(new Error('Duplicate candidates are not allowed in the same interview.'));
    }

    // 2. Calculate incoming interview's boundaries
    const incomingStart = new Date(this.startAt);
    const incomingEnd = new Date(incomingStart.getTime() + this.duration * 60 * 1000);

    // 3. Query the database for time conflicts
    const timeConflictExists = await this.model('Interview').exists({
      _id: { $ne: this._id }, // Exclude this interview itself
      status: { $ne: 'Cancelled' }, // Ignore cancelled interviews
      candidates: { $in: this.candidates }, // Look for the same candidates
      $expr: {
        $and: [
          // Condition 1: Existing interview starts BEFORE incoming interview ends
          { $lt: ["$startAt", incomingEnd] },
          // Condition 2: Existing interview ends AFTER incoming interview starts
          {
            $gt: [
              { $add: ["$startAt", { $multiply: ["$duration", 60 * 1000] }] }, // Calculates existing interview's end time
              incomingStart
            ]
          }
        ]
      }
    });

    if (timeConflictExists) {
      return next(new Error('One or more candidates have a scheduling conflict with another interview.'));
    }
  }

  // Internal joinedCandidates check 
  if (this.joinedCandidates?.length) {
    const uniqJoined = new Set(this.joinedCandidates.map(id => id.toString()));
    if (uniqJoined.size !== this.joinedCandidates.length) {
      return next(new Error('Duplicate joined candidates are not allowed.'));
    }
  }
  next();
});

// Pre-update hook for findOneAndUpdate, updateOne and updateMany
interviewSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
  const update = this.getUpdate();
  // Validate candidates updates
  if (update && update.candidates && update.candidates.length) {
    const ids = update.candidates.map(id => id.toString());
    const unique = Array.from(new Set(ids));
    if (unique.length !== ids.length) {
      return next(new Error('Duplicate candidates are not allowed.'));
    }
    const Interview = this.model('Interview');
    const query = this.getQuery();
    for (const candId of ids) {
      const existing = await Interview.findOne({ candidates: candId, _id: { $ne: query._id } });
      if (existing) {
        return next(new Error('Candidate is already assigned to another interview.'));
      }
    }
  }
  // Validate joinedCandidates updates
  if (update && update.joinedCandidates && update.joinedCandidates.length) {
    const joinedIds = update.joinedCandidates.map(id => id.toString());
    const uniqueJoined = Array.from(new Set(joinedIds));
    if (uniqueJoined.length !== joinedIds.length) {
      return next(new Error('Duplicate joined candidates are not allowed.'));
    }
  }
  next();
});

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;
