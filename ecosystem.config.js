module.exports = {
  apps : [{
    name: "JOYBOY-MD",
    script: "./index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '450M',
    env: {
      NODE_ENV: "production",
    }
  }]
}