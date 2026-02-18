module.exports = {
    apps: [{
        name: "find-j-server",
        script: "index.js",
        instances: "max",
        exec_mode: "cluster",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
};
