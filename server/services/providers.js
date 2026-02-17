const axios = require("axios");

//////////////////////////////////////////////////////
// Normalizer
//////////////////////////////////////////////////////

const normalize = (job, source, index) => ({
    id: `${source}-${index + 1}`,
    title: job.title,
    company:
        job.company?.display_name ||
        job.company?.name ||
        job.company ||
        "Unknown",
    location:
        job.location?.display_name ||
        job.candidate_required_location ||
        job.locations?.[0]?.name ||
        "Remote",
    salary:
        job.salary_min && job.salary_max
            ? `₹${job.salary_min} - ₹${job.salary_max}`
            : job.salary || "Not disclosed",
    description: job.description?.replace(/<[^>]*>/g, '').slice(0, 300) || "",
    url: job.redirect_url || job.url || job.refs?.landing_page || "#",
    source,
    tags: [source.toUpperCase(), "Live API", "Verified"],
    posted: job.created ? new Date(job.created).toLocaleDateString() : "Just now",
    badge: index < 2 ? "featured" : index < 4 ? "new" : ""
});

//////////////////////////////////////////////////////
// 1️⃣ Adzuna
//////////////////////////////////////////////////////

const fetchAdzuna = async (query, location) => {
    const res = await axios.get(
        `https://api.adzuna.com/v1/api/jobs/in/search/1`,
        {
            params: {
                app_id: process.env.ADZUNA_APP_ID,
                app_key: process.env.ADZUNA_APP_KEY,
                results_per_page: 50,
                what: query,
                where: location,
                max_days_old: 7
            }
        }
    );

    return res.data.results.map((j, i) =>
        normalize(j, "adzuna", i)
    );
};


//////////////////////////////////////////////////////
// 3️⃣ Remotive (Remote Jobs API)
//////////////////////////////////////////////////////

const fetchRemotive = async (query) => {
    const res = await axios.get(
        `https://remotive.com/api/remote-jobs?search=${query}`
    );

    return res.data.jobs.slice(0, 10).map((j, i) =>
        normalize(j, "remotive", i)
    );
};

//////////////////////////////////////////////////////
// 4️⃣ TheMuse
//////////////////////////////////////////////////////

const fetchTheMuse = async (query) => {
    const res = await axios.get(
        `https://www.themuse.com/api/public/jobs`,
        {
            params: {
                page: 1,
                descending: true
            }
        }
    );

    const filtered = res.data.results.filter(j =>
        j.name.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, 10).map((j, i) =>
        normalize(
            {
                title: j.name,
                company: j.company?.name,
                locations: j.locations,
                description: j.contents,
                refs: j.refs
            },
            "themuse",
            i
        )
    );
};

//////////////////////////////////////////////////////
// 5️⃣ JSearch (RapidAPI)
//////////////////////////////////////////////////////

const fetchJSearch = async (query, location) => {
    const res = await axios.get(
        "https://jsearch.p.rapidapi.com/search",
        {
            params: {
                query: `${query} in ${location}`,
                page: "1",
                num_pages: "1",
                country: 'India',
                date_posted: 'week'
            },
            headers: {
                "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            }
        }
    );
    // console.log('JSearch', res.data);
    return res.data.data.slice(0, 10).map((j, i) =>
        normalize(
            {
                title: j.job_title,
                company: j.employer_name,
                location: j.job_city || j.job_country,
                salary: j.job_salary,
                description: j.job_description,
                url: j.job_apply_link
            },
            "jsearch",
            i
        )
    );
};

//////////////////////////////////////////////////////

module.exports = {
    fetchAdzuna,
    fetchRemotive,
    fetchTheMuse,
    fetchJSearch
};
