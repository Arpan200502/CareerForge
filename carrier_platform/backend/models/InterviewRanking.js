const mongoose = require("mongoose");

const interviewRankingSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  userName:       { type: String, required: true },
  category:       { type: String, required: true },
  interviewScore: { type: Number, required: true },
  jobTitle:       { type: String, default: "" },
  interviewType:  { type: String, default: "" },
  difficulty:     { type: String, default: "" },
  completedAt:    { type: Date, default: Date.now },
});

interviewRankingSchema.index({ category: 1, interviewScore: -1 });
interviewRankingSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("InterviewRanking", interviewRankingSchema);
