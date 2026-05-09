/**
 * Plegit 2.0 - PM2 Ecosystem Configuration
 * ========================================
 * 
 * PM2 is a production process manager for Node.js with built-in load balancer.
 * 
 * Usage:
 *   pm2 start scripts/pm2.config.cjs
 *   pm2 stop plegit
 *   pm2 restart plegit
 *   pm2 logs plegit
 *   pm2 monit
 * 
 * For Windows:
 *   npm install -g pm2
 *   npm install -g pm2-windows-startup
 *   pm2-startup install
 *   pm2 start scripts/pm2.config.cjs
 *   pm2 save
 */

module.exports = {
  apps: [
    {
      name: 'plegit',
      script: './dist/index.js',
      cwd: __dirname + '/..',
      
      // Instances
      instances: 'max',  // Use all CPU cores, or set a number like 2
      exec_mode: 'cluster',  // Enable clustering
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      
      // Logging
      log_file: './logs/plegit-combined.log',
      out_file: './logs/plegit-out.log',
      error_file: './logs/plegit-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Restart behavior
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      
      // Auto restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'iisnode', '.git'],
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Source maps
      source_map_support: true,
      
      // Health check (optional - requires endpoint)
      // health_check_interval: 30000,
      // health_check_url: 'http://localhost:5000/api/health',
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/plegit.git',
      path: '/var/www/plegit',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload scripts/pm2.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
