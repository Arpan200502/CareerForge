module.exports = {
  free: {
    // Counts are applied per 15-day window (reset mechanism to be implemented separately)
    resumeAnalysis: 5,
    jobFitResume: 5,
    interviewPrep: 1,
    coverLetter: 3,
    viewJobs: 10,
  },
  pro: {
    // Monthly limits
    resumeAnalysis: 50,
    jobFitResume: 30,
    interviewPrep: 20,
    coverLetter: 30,
    viewJobs: 100,
  },
  max: {
    // Monthly limits (max tier)
    resumeAnalysis: 100,
    jobFitResume: 100,
    interviewPrep: 35,
    coverLetter: 60,
    viewJobs: Infinity,
  },
};