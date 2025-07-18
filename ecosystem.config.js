module.exports = {
  apps: [{
    name: 'dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/root/Dan-Dashboard',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      NODE_OPTIONS: '--max-old-space-size=400'
    },
    restart_delay: 3000,
    max_restarts: 50,
    min_uptime: '30s',
    max_memory_restart: '350M',
    watch: false,
    ignore_watch: ['node_modules', '.next', '.git'],
    log_file: '/var/log/pm2/dashboard.log',
    error_file: '/var/log/pm2/dashboard-error.log',
    out_file: '/var/log/pm2/dashboard-out.log',
    time: true
  }]
};