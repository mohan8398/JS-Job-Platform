const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const rankJobs = async (jobs, query) => {
    if (!process.env.GEMINI_API_KEY) return jobs;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
        Rank these jobs based on relevance to: ${query}.
        Return ONLY JSON array of job IDs sorted by relevance.

        Jobs:
        ${JSON.stringify(jobs.map(j => ({
        id: j.id,
        title: j.title,
        description: j.description
    })))}
        `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let rankedIds;
        try {
            // Clean up possible markdown code blocks from AI response
            const cleanText = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
            rankedIds = JSON.parse(cleanText);
        } catch {
            return jobs;
        }

        const ranked = rankedIds
            .map(id => jobs.find(j => j.id === id))
            .filter(Boolean);

        return ranked.length ? ranked : jobs;
    } catch (err) {
        console.error("AI Ranking failed:", err.message);
        return jobs; // Fallback to unranked jobs
    }
};

module.exports = { rankJobs };
