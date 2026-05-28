const axios = require("axios");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL;
const GROQ_MODEL   = process.env.GROQ_MODEL;

const CATEGORIES = [
  "MERN Stack", "MEAN Stack", "Frontend", "Backend", "Java", "Python",
  "DevOps", "Cloud", "Data Science", "Machine Learning", "Android", "iOS",
  "Golang", "Rust", "Blockchain", "QA/Testing", "Product Manager",
  "UI/UX", "Data Engineer", "Full Stack"
];

async function classifyJobCategory(jobTitle, jobDescription) {
  if (!jobTitle && !jobDescription) return "Full Stack";

  const descSnippet = (jobDescription || "").slice(0, 500);
  const prompt = `Analyze this job title and description. Classify into EXACTLY ONE category from this list:
${CATEGORIES.join(", ")}

Job Title: ${jobTitle || ""}
Job Description: ${descSnippet}

Return ONLY the category name. Nothing else.`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a job classifier. Return only the category name." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        timeout: 10000
      }
    );

    const category = (response.data?.choices?.[0]?.message?.content || "").trim();
    if (CATEGORIES.includes(category)) return category;
    return "Full Stack";
  } catch (err) {
    console.error("[classifyJobCategory] AI call failed:", err.message);
    return "Full Stack";
  }
}

module.exports = classifyJobCategory;
