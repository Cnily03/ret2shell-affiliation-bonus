module.exports = {
  apps: [
    {
      name: "aff-bonus",
      script: "./aff-server",
      args: "-p 8000",
      cwd: __dirname,
      interpreter: "none",
      uid: "nobody",
      gid: "nobody",
      watch: false,
      max_restarts: 10,
      restart_delay: 2500,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
