const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const rankJobs = async (jobs, query) => {
    if (!process.env.GEMINI_API_KEY) return jobs;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
            You are a job filter and ranker for a JavaScript/TypeScript developer.

            STEP 1 — FILTER: Keep ONLY jobs that are clearly related to:
            - JavaScript, TypeScript, Node.js, Express, MERN, React, Next.js, NestJS, Fastify
            - Full-stack or backend roles using JS/TS ecosystem

            REMOVE any jobs related to:
            - Java, Python, PHP, Ruby, .NET, C++, C#, Go, Rust, Swift, Kotlin
            - Data Science, ML, DevOps-only, QA-only, Non-tech roles
            - Any non-JS/TS tech stack

            STEP 2 — RANK: Among the filtered jobs, rank by relevance to: "${query}"
            Prefer: Node.js > MERN > JavaScript > TypeScript > React > Full-stack JS

            Return ONLY a raw JSON array of job IDs (no markdown, no explanation):
            ["id1", "id2", "id3"]

    Jobs to evaluate:
        ${JSON.stringify(jobs.map(j => ({
        id: j.id,
        title: j.title,
        description: j.description
    })))}
        `;

    try {
        // const result = await model.generateContent(prompt);
        // const text = result.response.text();

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: prompt },
                ],
                temperature: 0.1,
                max_tokens: 512
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        let rankedIds;
        try {
            const cleanText = text
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/gi, '')
                .trim();

            // extract JSON array even if AI adds extra text
            const match = cleanText.match(/\[[\s\S]*\]/);
            if (!match) return jobs;
            rankedIds = JSON.parse(match[0]);
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
