import mongoose from "mongoose";
const questionSchema = new mongoose.Schema({
  text: String,
  category: String,
  difficulty: {
    type: String,
    enum: ["basic","intermediate","advanced"]
  },
  baseWeight: Number
});

const Question = mongoose.model("Question", questionSchema);
export default Question;