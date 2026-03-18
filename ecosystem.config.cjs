module.exports = {
  apps: [
    {
      name: "invite-bonus",
      script: "./invite-bonus",
      args: "-p 8000",
      cwd: __dirname,
      interpreter: "none",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
