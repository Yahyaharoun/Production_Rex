module.exports = {
  apps: [{
    name: 'transport-erp-api',
    script: 'dist/server.js',
    instances: 'max', // Utilise tous les cœurs disponibles pour la scalabilité
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    log_file: './logs/pm2-combined.log',
    error_file: './logs/pm2-error.log',
    merge_logs: true,
    time: true,
    max_memory_restart: '1G'
  }]
};
