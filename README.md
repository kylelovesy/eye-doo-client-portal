# **Eye Doo Client Portal**

A comprehensive wedding photography client planning portal built with Next.js, React, TypeScript, and Firebase. This application allows wedding photography clients to collaboratively plan their special day through an intuitive, step-by-step interface.

## **🎯 Project Overview**

The Eye Doo Client Portal is a sophisticated web application designed to streamline the wedding photography planning process. It provides clients with a structured, guided approach to planning their wedding day photography, covering all essential aspects from key people and locations to timeline and special photo requests.

### **Key Features**

* **Multi-step Planning Process**: Guided workflow through planning steps including Welcome, Key People, Locations, Group Photos, Special Requests, and Timeline.  
* **Real-time Collaboration**: Live updates using Firebase real-time listeners.  
* **Centralized State Management**: Uses Zustand for predictable and efficient state management across the application.  
* **Type Safety**: Built with TypeScript and Zod for robust data validation and schema definition.  
* **Modern UI**: Responsive design built with Tailwind CSS and custom React components, featuring consistent button patterns, standardized alerts, and improved form layouts.  
* **Data Persistence**: Secure Firebase backend with real-time data synchronization.  
* **Unsaved Changes Prompt**: Prevents clients from accidentally losing their work.

## **🏗️ Architecture**

### **Technology Stack**

* **Framework**: Next.js  
* **Library**: React  
* **Language**: TypeScript  
* **Styling**: Tailwind CSS  
* **Backend & Database**: Firebase (Firestore, Auth, Functions)  
* **State Management**: Zustand  
* **Schema Validation**: Zod

### **Project Structure**

src/  
├── app/                  \# Next.js App Router (Main page, layout, global styles)  
├── components/           \# React components  
│   ├── layouts/          \# Layout components (Header, StatusBar)  
│   ├── sections/         \# Main planning section components  
│   └── ui/               \# Reusable UI components (Modals, Containers)  
├── lib/                  \# Utility libraries and hooks  
│   ├── firebase.ts       \# Firebase configuration and initialization  
│   ├── test-data.ts      \# Sample data for testing and demo mode  
│   ├── useEntityManagement.ts \# Custom hook for CRUD operations  
│   └── useUnsavedChangesPrompt.ts \# Custom hook for unsaved changes warning  
├── services/             \# Service layer for data interaction  
│   └── portalService.ts  \# Handles all communication with Firebase  
├── store/                \# Global state management  
│   └── usePortalStore.ts \# Zustand store definition  
└── types/                \# TypeScript type definitions  
    └── types.ts          \# Zod schemas and type definitions

## **🚀 Setup and Installation**

### **Prerequisites**

* Node.js (version specified in package.json)  
* npm, yarn, or pnpm  
* A Firebase project with Firestore, Auth, and Functions enabled.

### **Environment Variables**

Create a .env.local file in the root of the project with your Firebase configuration:

NEXT\_PUBLIC\_FIREBASE\_API\_KEY=your\_api\_key  
NEXT\_PUBLIC\_FIREBASE\_AUTH\_DOMAIN=your\_auth\_domain  
NEXT\_PUBLIC\_FIREBASE\_PROJECT\_ID=your\_project\_id  
NEXT\_PUBLIC\_FIREBASE\_STORAGE\_BUCKET=your\_storage\_bucket  
NEXT\_PUBLIC\_FIREBASE\_MESSAGING\_SENDER\_ID=your\_messaging\_sender\_id  
NEXT\_PUBLIC\_FIREBASE\_APP\_ID=your\_app\_id

### **Installation**

1. **Clone the repository**  
   git clone \<repository-url\>  
   cd GEM-36-PORTAL

2. **Install dependencies**  
   npm install

3. **Run the development server**  
   npm run dev

4. Open your browser  
   Navigate to http://localhost:3000. To enter live mode, append your project ID and access token as query parameters: http://localhost:3000/?project=YOUR\_PROJECT\_ID\&token=YOUR\_ACCESS\_TOKEN. Without these, the app runs in a demo mode using test data.

## **🌐 Deployment**

The application is configured for easy deployment on platforms like Vercel or Netlify.

1. Connect your Git repository to your hosting provider.  
2. Set the environment variables listed above in your provider's dashboard.  
3. Deploy the main branch. The build command is next build.

**Built with ❤️ for wedding photographers and their clients.**