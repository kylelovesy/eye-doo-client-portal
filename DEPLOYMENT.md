# **Deployment Guide**

## **🚀 Getting Started**

This guide covers the setup and deployment process for the Eye Doo Client Portal. The application is built with Next.js and is best deployed on Vercel, but can also be hosted on other platforms that support Node.js applications.

## **📋 Prerequisites**

### **Required Software**

* **Node.js**: ^18.18.0 || ^20.9.0 || \>=21.1.0  
* **npm / yarn / pnpm**: For dependency management.  
* **Git**: For version control.  
* **Firebase CLI**: (Optional) For managing Firebase projects from the command line.

### **Required Accounts**

* **Firebase Account**: For the backend services (Firestore, Auth, Functions).  
* **Deployment Platform Account**: Vercel (recommended), Netlify, etc.  
* **GitHub/GitLab/Bitbucket Account**: For source code hosting and CI/CD.

## **🔥 Firebase Setup**

### **1\. Create a Firebase Project**

* Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.

### **2\. Enable Firebase Services**

In your new project, enable the following services:

* **Firestore Database**: Create a database in production mode. You will need to set up security rules.  
* **Authentication**: Enable the "Custom" provider for custom token authentication.  
* **Cloud Functions**: Set up Cloud Functions to handle secure backend logic. You will need to upgrade to the Blaze (pay-as-you-go) plan.

### **3\. Get Firebase Configuration**

* In your Project Settings, create a new Web App.  
* Copy the firebaseConfig object. You will need these values for your environment variables.

### **4\. Set Up Firebase Security Rules**

Your Firestore security rules should be configured to only allow access to authenticated users who are associated with a specific project. All write operations should ideally be handled by Cloud Functions for maximum security.

Example Rules:

rules\_version \= '2';  
service cloud.firestore {  
  match /databases/{database}/documents {

    // Helper function to check if the user is an authenticated client for a specific project  
    function isPortalClient(projectId) {  
      // The UID for a client is their projectId  
      return request.auth.uid \== projectId && request.auth.token.portalAccess \== true;  
    }

    // Projects can be read by their owners or by an authenticated portal client  
    match /projects/{projectId} {  
      // Allow client to read top-level project doc  
      allow read: if isPortalClient(projectId);  
      // Disallow client writes to top-level doc; must go through functions  
      allow write: if false;

      // Rules for all section subcollections  
      match /{subcollection}/{docId} {  
        allow read: if isPortalClient(projectId);  
        // Disallow direct client writes; must go through functions  
        allow write: if false;  
      }  
    }  
  }  
}

### **5\. Create .env.local**

Create a .env.local file in the project root and add your Firebase configuration:

NEXT\_PUBLIC\_FIREBASE\_API\_KEY=your\_api\_key  
NEXT\_PUBLIC\_FIREBASE\_AUTH\_DOMAIN=your\_auth\_domain  
NEXT\_PUBLIC\_FIREBASE\_PROJECT\_ID=your\_project\_id  
NEXT\_PUBLIC\_FIREBASE\_STORAGE\_BUCKET=your\_storage\_bucket  
NEXT\_PUBLIC\_FIREBASE\_MESSAGING\_SENDER\_ID=your\_messaging\_sender\_id  
NEXT\_PUBLIC\_FIREBASE\_APP\_ID=your\_app\_id

## **🏗️ Local Development**

1. **Clone Repository**  
   git clone \<repository-url\>  
   cd GEM-36-PORTAL

2. **Install Dependencies**  
   npm install

3. **Run Development Server**  
   npm run dev

4. Access Application  
   Open http://localhost:3000 in your browser. The app will run in demo mode. To test with a real project, append query parameters: http://localhost:3000/?project=YOUR\_PROJECT\_ID\&token=YOUR\_ACCESS\_TOKEN.

## **🌐 Deployment (Vercel \- Recommended)**

### **Why Vercel?**

* Optimized for Next.js applications.  
* Automatic deployments on every Git push (CI/CD).  
* Global CDN for fast performance.  
* Easy environment variable management.

### **Setup Steps**

1. **Import Project**: Go to your Vercel dashboard and import the project from your Git provider.  
2. **Configure Project**: Vercel will automatically detect that it is a Next.js project. The default settings for build commands and output directories should be correct.  
3. **Add Environment Variables**: In the project settings on Vercel, navigate to "Environment Variables" and add all the Firebase configuration variables from your .env.local file.  
4. **Deploy**: Trigger a deployment. Vercel will build and deploy your application. Any subsequent pushes to the main branch will trigger automatic deployments.

### **Build Configuration**

The package.json file contains the necessary scripts for building and running the application.

{  
  "scripts": {  
    "dev": "next dev",  
    "build": "next build",  
    "start": "next start",  
    "lint": "next lint"  
  }  
}

Vercel will use the next build command automatically.

## **🧪 Pre-deployment Checklist**

* \[ \] All required environment variables are set in the deployment environment.  
* \[ \] Firebase Security Rules are correctly configured for production (i.e., not in test mode).  
* \[ \] The application builds without errors (npm run build).  
* \[ \] Linting passes without errors (npm run lint).