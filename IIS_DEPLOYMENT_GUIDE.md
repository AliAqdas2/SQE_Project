# Plegit 2.0 - IIS Deployment Guide

This guide covers deploying the Plegit 2.0 Node.js application to Windows Server with IIS.

## Prerequisites

### Server Requirements

1. **Windows Server** 2016, 2019, or 2022
2. **IIS** (Internet Information Services) enabled
3. **Node.js** v18.x or v20.x LTS installed
4. **PostgreSQL** database (local or remote)

### Required IIS Modules

1. **iisnode** - Hosts Node.js applications in IIS
   - Download: https://github.com/azure/iisnode/releases
   - Install the x64 version: `iisnode-full-v0.2.21-x64.msi`

2. **URL Rewrite Module**
   - Download: https://www.iis.net/downloads/microsoft/url-rewrite

3. **Application Request Routing (ARR)** - Optional, for advanced scenarios
   - Download: https://www.iis.net/downloads/microsoft/application-request-routing

---

## Deployment Steps

### Step 1: Build the Application

On your development machine or build server:

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates:
- `dist/index.js` - Compiled server
- `dist/public/` - Static frontend assets

### Step 2: Prepare Deployment Package

Copy these files/folders to your Windows server:

```
plegit/
├── dist/                  # Compiled application
│   ├── index.js          # Server entry point
│   └── public/           # Frontend assets
├── node_modules/          # Dependencies (or run npm install on server)
├── package.json
├── package-lock.json
├── web.config            # IIS configuration
├── iisnode.yml           # iisnode settings
└── .env                  # Environment variables (create from .env.example)
```

### Step 3: Configure Environment Variables

#### Option A: Windows Environment Variables (Recommended for secrets)

1. Open **System Properties** > **Advanced** > **Environment Variables**
2. Add System Variables:
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `SESSION_SECRET` = A random 32+ character string
   - `STRIPE_SECRET_KEY` = Your Stripe secret key
   - `OPENAI_API_KEY` = Your OpenAI API key

#### Option B: .env File

1. Copy `.env.example` to `.env`
2. Fill in your production values
3. Ensure `.env` is listed in `hiddenSegments` in web.config (it is by default)

### Step 4: Set Up PostgreSQL

1. Create a new database for Plegit
2. Run database migrations:

```bash
# From the deployment directory
npm run db:push
```

### Step 5: Configure IIS

#### Create Application Pool

1. Open **IIS Manager**
2. Right-click **Application Pools** → **Add Application Pool**
3. Configure:
   - **Name**: `PlegitAppPool`
   - **.NET CLR Version**: `No Managed Code`
   - **Managed Pipeline Mode**: `Integrated`
4. Right-click the new pool → **Advanced Settings**:
   - **Start Mode**: `AlwaysRunning`
   - **Idle Time-out (minutes)**: `0` (never timeout)
   - **Process Model > Identity**: `ApplicationPoolIdentity` or a service account

#### Create Website

1. Right-click **Sites** → **Add Website**
2. Configure:
   - **Site name**: `Plegit`
   - **Application pool**: `PlegitAppPool`
   - **Physical path**: `C:\inetpub\wwwroot\plegit` (or your deployment path)
   - **Binding**: 
     - Type: `https` (recommended)
     - Port: `443`
     - Host name: `your-domain.com`
     - SSL Certificate: Your SSL certificate

#### Set Folder Permissions

The IIS application pool identity needs access:

1. Right-click deployment folder → **Properties** → **Security**
2. Click **Edit** → **Add**
3. Add: `IIS AppPool\PlegitAppPool`
4. Grant: **Read & Execute**, **List folder contents**, **Read**
5. For the `iisnode` folder (logs): Also grant **Write**

### Step 6: Test the Deployment

1. Browse to your site: `https://your-domain.com`
2. Check iisnode logs if issues occur: `C:\inetpub\wwwroot\plegit\iisnode\`

---

## Configuration Files Reference

### web.config

The main IIS configuration file. Key sections:

- **handlers**: Routes requests to iisnode
- **rewrite rules**: URL routing for API and static files
- **security**: Hides sensitive directories
- **iisnode**: Node.js runtime settings

### iisnode.yml

Additional iisnode configuration:

- Process count and concurrency
- Logging settings
- Debugging options (disable in production)

---

## Troubleshooting

### Common Issues

#### HTTP 500 Errors

1. Check iisnode logs in the `iisnode` folder
2. Enable `devErrorsEnabled="true"` temporarily in web.config
3. Verify Node.js is in the system PATH

#### Database Connection Failed

1. Verify `DATABASE_URL` is correctly set
2. Test connection: `psql "your-connection-string"`
3. Check firewall allows PostgreSQL port (5432)

#### Static Files Not Loading

1. Verify `dist/public` folder exists
2. Check URL rewrite rules in web.config
3. Ensure MIME types are configured

#### Application Won't Start

1. Check if port is available
2. Verify all dependencies are installed: `npm install --production`
3. Test manually: `node dist/index.js`

### Viewing Logs

iisnode logs are in the `iisnode` folder:

- `stdout` and `stderr` output
- Timestamped log files

Enable logging in web.config:
```xml
<iisnode loggingEnabled="true" logDirectory="iisnode" />
```

---

## Security Checklist

- [ ] SSL/TLS certificate installed
- [ ] Environment variables set (not in code)
- [ ] `devErrorsEnabled` set to `false`
- [ ] `debuggingEnabled` set to `false`
- [ ] Sensitive folders hidden (node_modules, .env, etc.)
- [ ] Database credentials secured
- [ ] Session secret is unique and strong
- [ ] Stripe webhook secret configured
- [ ] Regular security updates scheduled

---

## Maintenance

### Updating the Application

1. Build new version: `npm run build`
2. Stop the website in IIS
3. Replace `dist` folder
4. Update `node_modules` if dependencies changed
5. Start the website

### Database Migrations

```bash
npm run db:push
```

### Monitoring

- IIS logs: `C:\inetpub\logs\LogFiles\`
- iisnode logs: `[app_folder]\iisnode\`
- Application logs: Check Node.js console output in iisnode logs

---

## Alternative: Reverse Proxy Setup

For more flexibility, you can run Node.js separately and use IIS as a reverse proxy:

1. Run Node.js as a Windows Service (using PM2 or node-windows)
2. Configure IIS with ARR to proxy requests to `localhost:5000`

This approach offers:
- Better process management
- Easier debugging
- Independent Node.js updates

See the reverse proxy web.config example in the `examples` folder.

---

## Support

For issues specific to:
- **iisnode**: https://github.com/tjanczuk/iisnode/issues
- **IIS URL Rewrite**: Microsoft documentation
- **Plegit application**: Contact your development team
