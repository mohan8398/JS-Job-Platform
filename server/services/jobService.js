const {
    fetchAdzuna,
    fetchRemotive,
    fetchTheMuse,
    fetchJSearch
} = require("./providers");

const { rankJobs } = require("./aiRanker");
// const { setCache, getCache } = require("./cache");

const deduplicate = (jobs) => {
    const seen = new Set();
    return jobs.filter(job => {
        const key = job.title + job.company;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const searchJobs = async (query, location) => {
    // const cacheKey = `${query}-${location}`;
    // const cached = getCache(cacheKey);
    // if (cached) return cached;

    const results = await Promise.allSettled([
        fetchAdzuna(query, location),
        // fetchArbeitnow(query),
        // fetchRemotive(query),
        // fetchTheMuse(query),
        fetchJSearch(query, location)
    ]);

    let jobs = [];

    results.forEach((r, i) => {
        if (r.status === "fulfilled") {
            console.log(`Provider ${i} returned ${r.value.length} jobs`);
            jobs.push(...r.value);
        } else {
            console.error(`Provider ${i} failed:`, r.reason);
        }
    });

    console.log(`Total raw jobs fetched: ${jobs.length}`);

    if (!jobs.length) return [];

    // STRICT FILTER: Node.js/MERN + Bengaluru/Remote + Full-time
    jobs = jobs.filter(j => {
        const title = j.title.toLowerCase();
        const desc = j.description.toLowerCase();
        const loc = j.location.toLowerCase();
        const source = j.source.toLowerCase();

        // Stack Check
        const matchesStack = title.includes('node') ||
            title.includes('mern') ||
            title.includes('react') ||
            title.includes('fullstack') ||
            desc.includes('node.js') ||
            desc.includes('mongodb') ||
            desc.includes('express.js');

        // Location Check (Bengaluru or Remote)
        const isRemote = loc.includes('remote') ||
            title.includes('remote') ||
            source === 'remotive' ||
            source === 'arbeitnow';
        const isBengaluru = loc.includes('bengaluru') || loc.includes('bangalore') || title.includes('bengaluru') || title.includes('bangalore');

        const matchesLocation = isRemote || isBengaluru;

        // Type Check (Strict Full-time)
        // If it explicitly says internship or part-time, reject. Otherwise, look for full-time or assume.
        const isRejectedType = title.includes('intern') || title.includes('part-time') || title.includes('parttime');
        const isExplicitFullTime = title.includes('full-time') || title.includes('fulltime') || desc.includes('full-time') || desc.includes('fulltime');

        // We'll be slightly lenient if it doesn't say "part-time", but prioritize explicit full-time
        const matchesType = !isRejectedType;

        return matchesStack && matchesLocation && matchesType;
    });

    console.log(`Jobs remaining after filter: ${jobs.length}`);

    jobs = deduplicate(jobs);

    const ranked = await rankJobs(jobs, query);

    // setCache(cacheKey, ranked, 300);

    return ranked;
};

module.exports = { searchJobs };

