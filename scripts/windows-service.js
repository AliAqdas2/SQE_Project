/**
 * Plegit 2.0 - Windows Service Installation Script
 * ================================================
 * 
 * This script helps set up Node.js as a Windows Service using node-windows.
 * 
 * Usage:
 *   node scripts/windows-service.js install    - Install as Windows Service
 *   node scripts/windows-service.js uninstall  - Remove Windows Service
 *   node scripts/windows-service.js start      - Start the service
 *   node scripts/windows-service.js stop       - Stop the service
 * 
 * Prerequisites:
 *   npm install -g node-windows
 *   npm link node-windows
 */

const path = require('path');

// Check if node-windows is available
let Service;
try {
  Service = require('node-windows').Service;
} catch (e) {
  console.error('node-windows is not installed.');
  console.log('');
  console.log('To install:');
  console.log('  npm install -g node-windows');
  console.log('  npm link node-windows');
  console.log('');
  console.log('Then run this script again.');
  process.exit(1);
}

// Service configuration
const svc = new Service({
  name: 'Plegit',
  description: 'Plegit 2.0 - Faith-Based Fundraising Platform',
  script: path.join(__dirname, '..', 'dist', 'index.js'),
  nodeOptions: [],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '5000'
    }
    // Add other environment variables here or use Windows Environment Variables
  ],
  // Restart on crash
  maxRestarts: 10,
  maxRetries: 3,
  wait: 2,
  grow: 0.5
});

// Event handlers
svc.on('install', () => {
  console.log('Service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('uninstall', () => {
  console.log('Service uninstalled successfully!');
});

svc.on('start', () => {
  console.log('Service started!');
  console.log('Plegit is now running at http://localhost:5000');
});

svc.on('stop', () => {
  console.log('Service stopped.');
});

svc.on('error', (err) => {
  console.error('Service error:', err);
});

// Command handling
const command = process.argv[2];

switch (command) {
  case 'install':
    console.log('Installing Plegit as Windows Service...');
    console.log('This requires Administrator privileges.');
    svc.install();
    break;
    
  case 'uninstall':
    console.log('Uninstalling Plegit Windows Service...');
    svc.uninstall();
    break;
    
  case 'start':
    console.log('Starting Plegit service...');
    svc.start();
    break;
    
  case 'stop':
    console.log('Stopping Plegit service...');
    svc.stop();
    break;
    
  default:
    console.log('Plegit Windows Service Manager');
    console.log('==============================');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/windows-service.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  install    Install as Windows Service');
    console.log('  uninstall  Remove Windows Service');
    console.log('  start      Start the service');
    console.log('  stop       Stop the service');
    console.log('');
    console.log('Note: install/uninstall require Administrator privileges.');
}
