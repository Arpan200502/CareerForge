const mongoose = require("mongoose");

const resumeRankingSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  userName:       { type: String, required: true },
  category:       { type: String, required: true },
  resumeScore:    { type: Number, required: true },
  jobTitle:       { type: String, default: "" },
  analyzedAt:     { type: Date, default: Date.now },
  resumeSnapshot: { type: String, default: "" },
});

resumeRankingSchema.index({ category: 1, resumeScore: -1 });
resumeRankingSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("ResumeRanking", resumeRankingSchema);
