# Deployment Guide

## 🚀 Getting Started

This guide covers the complete setup and deployment process for the Eye Doo Client Portal. The application can be deployed to various platforms including Vercel, Netlify, Firebase Hosting, and Docker containers.

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (or yarn, pnpm, bun)
- **Git**: For version control and deployment
- **Firebase CLI**: For Firebase-related deployments

### Required Accounts
- **Firebase Account**: For backend services
- **Deployment Platform Account**: Vercel, Netlify, or similar
- **GitHub/GitLab Account**: For source code hosting

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. **Visit Firebase Console**
   - Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Click "Create a project" or "Add project"

2. **Project Configuration**
   - Enter project name (e.g., "eye-doo-client-portal")
   - Enable Google Analytics (optional)
   - Choose analytics account or create new one
   - Click "Create project"

3. **Project Setup**
   - Wait for project creation to complete
   - Click "Continue" to proceed

### 2. Enable Firebase Services

#### Firestore Database
1. **Navigate to Firestore**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Security Rules**
   - Choose "Start in test mode" for development
   - Select database location (choose closest to your users)
   - Click "Done"

3. **Configure Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Project access control
       match /projects/{projectId} {
         allow read, write: if request.auth != null && 
           request.auth.token.projectId == projectId;
         
         // Subcollection access
         match /{subcollection}/{document=**} {
           allow read, write: if request.auth != null && 
             request.auth.token.projectId == projectId;
         }
       }
       
       // Master data access (read-only)
       match /masterData/{document} {
         allow read: if request.auth != null;
         allow write: if false; // No writes allowed
       }
     }
   }
   ```

#### Authentication
1. **Navigate to Authentication**
   - Click "Authentication" in the left sidebar
   - Click "Get started"

2. **Sign-in Methods**
   - Enable "Custom" provider
   - Configure custom token authentication

#### Cloud Functions (Optional)
1. **Navigate to Functions**
   - Click "Functions" in the left sidebar
   - Click "Get started"

2. **Enable Functions**
   - Choose billing plan (Blaze plan required for external calls)
   - Select function location
   - Click "Done"

### 3. Get Firebase Configuration

1. **Project Settings**
   - Click the gear icon next to "Project Overview"
   - Select "Project settings"

2. **Web App Configuration**
   - Click "Add app" and select web icon
   - Register app with nickname
   - Copy configuration object

3. **Environment Variables**
   Create `.env.local` file with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### 4. Populate Master Data

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in Project**
   ```bash
   firebase init
   ```

4. **Populate Data**
   ```bash
   # Run the master data population script
   node --AddMasterDataToFirestore.js
   ```

## 🏗️ Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd eye-doo-client-portal
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your Firebase configuration
nano .env.local
```

### 4. Start Development Server
```bash
npm run dev
# or
yarn dev
```

### 5. Access Application
Open [http://localhost:3000](http://localhost:3000) in your browser

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

#### Why Vercel?
- **Next.js Optimized**: Built specifically for Next.js applications
- **Automatic Deployments**: Deploy on every Git push
- **Global CDN**: Fast loading worldwide
- **Environment Variables**: Easy configuration management
- **Preview Deployments**: Test changes before production

#### Setup Steps

1. **Connect Repository**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub/GitLab account
   - Click "New Project"
   - Import your repository

2. **Configure Project**
   - Project name: `eye-doo-client-portal`
   - Framework preset: `Next.js`
   - Root directory: `./` (default)
   - Build command: `npm run build` (auto-detected)
   - Output directory: `.next` (auto-detected)

3. **Environment Variables**
   - Click "Environment Variables"
   - Add all Firebase configuration variables
   - Set production environment

4. **Deploy**
   - Click "Deploy"
   - Wait for build completion
   - Access your live application

#### Custom Domain (Optional)
1. **Add Domain**
   - Go to project settings
   - Click "Domains"
   - Add your custom domain

2. **DNS Configuration**
   - Follow Vercel's DNS instructions
   - Update your domain provider's DNS settings

### Option 2: Netlify

#### Setup Steps

1. **Connect Repository**
   - Visit [netlify.com](https://netlify.com)
   - Sign in with GitHub/GitLab account
   - Click "New site from Git"

2. **Build Configuration**
   - Build command: `npm run build`
   - Publish directory: `out`
   - Base directory: (leave empty)

3. **Environment Variables**
   - Go to "Site settings" → "Environment variables"
   - Add all Firebase configuration variables

4. **Deploy**
   - Click "Deploy site"
   - Wait for build completion

### Option 3: Firebase Hosting

#### Setup Steps

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and Initialize**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Configuration**
   ```bash
   # Select your project
   # Public directory: out
   # Configure as single-page app: Yes
   # Set up automatic builds: No
   ```

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### Option 4: Docker Deployment

#### Dockerfile
```dockerfile
# Use Node.js 18 Alpine image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  client-portal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
      - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
      - NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
      - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
      - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
      - NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
    restart: unless-stopped
```

#### Build and Run
```bash
# Build image
docker build -t eye-doo-client-portal .

# Run container
docker run -p 3000:3000 eye-doo-client-portal

# Or with Docker Compose
docker-compose up -d
```

## 🔧 Build Configuration

### Next.js Configuration

#### next.config.ts
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // For Docker deployment
  experimental: {
    // Enable experimental features if needed
  },
  images: {
    // Configure image optimization
    domains: ['your-domain.com'],
  },
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default nextConfig
```

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next build && next export",
    "docker:build": "docker build -t eye-doo-client-portal .",
    "docker:run": "docker run -p 3000:3000 eye-doo-client-portal"
  }
}
```

## 🔒 Security Configuration

### Environment Variables

#### Production Environment
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
```

#### Development Environment
```env
# Firebase Configuration (Development)
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_dev_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_dev_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_dev_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_app_id

# Development Settings
NODE_ENV=development
```

### Security Headers

#### next.config.ts
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ]
  },
}
```

## 📊 Monitoring and Analytics

### Performance Monitoring

#### Vercel Analytics
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Firebase Performance Monitoring
```typescript
// lib/firebase.ts
import { getPerformance } from 'firebase/performance'

const app = initializeApp(firebaseConfig)
export const perf = getPerformance(app)
```

### Error Tracking

#### Sentry Integration
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

## 🧪 Testing and Quality Assurance

### Pre-deployment Checklist

- [ ] **Environment Variables**: All required variables are set
- [ ] **Firebase Configuration**: Project is properly configured
- [ ] **Security Rules**: Firestore rules are properly configured
- [ ] **Build Process**: Application builds without errors
- [ ] **Linting**: ESLint passes without errors
- [ ] **Type Checking**: TypeScript compilation succeeds
- [ ] **Testing**: All tests pass (if applicable)

### Post-deployment Verification

- [ ] **Application Loads**: Main page loads without errors
- [ ] **Authentication**: Login/logout functionality works
- [ ] **Data Operations**: CRUD operations function correctly
- [ ] **Real-time Updates**: Firebase listeners work properly
- [ ] **Responsive Design**: Mobile and desktop views work
- [ ] **Performance**: Page load times are acceptable
- [ ] **Error Handling**: Error states display correctly

## 🔄 Continuous Deployment

### GitHub Actions Workflow

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
        NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify dependencies
npm ls
```

#### Firebase Connection Issues
```bash
# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# Verify Firebase project configuration
firebase projects:list

# Test Firebase connection
firebase firestore:rules:test
```

#### Deployment Issues
```bash
# Check build logs
vercel logs

# Verify environment variables in deployment platform
vercel env ls

# Test local build
npm run build
```

### Support Resources

- **Firebase Documentation**: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Documentation**: [https://vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: Check GitHub issues or contact development team

## 📚 Additional Resources

### Documentation
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Deployment](https://vercel.com/docs/deployments)

### Tools
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Docker](https://docs.docker.com/)

### Best Practices
- [Security Best Practices](https://firebase.google.com/docs/projects/security)
- [Performance Optimization](https://nextjs.org/docs/advanced-features/performance)
- [SEO Optimization](https://nextjs.org/docs/advanced-features/seo)