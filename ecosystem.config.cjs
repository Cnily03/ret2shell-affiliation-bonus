module.exports = {
  apps: [
    {
      name: "affiliation-bonus",
      script: "./affiliation-bonus",
      args: "-p 8000",
      cwd: __dirname,
      interpreter: "none",
      uid: "nobody",
      gid: "nobody",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
