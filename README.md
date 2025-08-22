# Eye Doo Client Portal

A comprehensive wedding photography client planning portal built with Next.js 15, React 19, TypeScript, and Firebase. This application allows wedding photography clients to collaboratively plan their special day through an intuitive, step-by-step interface.

## 🎯 Project Overview

The Eye Doo Client Portal is a sophisticated web application designed to streamline the wedding photography planning process. It provides clients with a structured, guided approach to planning their wedding day photography, covering all essential aspects from key people and locations to timeline and special photo requests.

### Key Features
- **Multi-step Planning Process**: Guided workflow through 5 main planning steps
- **Real-time Collaboration**: Live updates using Firebase real-time listeners
- **Comprehensive Planning Sections**: Locations, key people, group shots, photo requests, and timeline
- **Professional Photography Focus**: Built specifically for wedding photography workflows
- **Responsive Design**: Modern UI built with Tailwind CSS and custom components
- **Data Persistence**: Secure Firebase backend with real-time synchronization

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, CSS Modules
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: React hooks with local state management
- **Build Tools**: ESLint, PostCSS

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main portal page
│   ├── globals.css        # Global styles
│   └── portal.module.css  # Portal-specific styles
├── components/             # React components
│   ├── layouts/           # Layout components (Header, StatusBar)
│   ├── sections/          # Main planning sections
│   ├── ui/                # Reusable UI components
│   └── fonts/             # Font configurations
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── projectService.ts  # Main service layer
│   └── useUnsavedChangesPrompt.ts # Custom hooks
├── types/                 # TypeScript type definitions
├── data/                  # Master data and configurations
└── pages/                 # Additional pages (if any)
```

## 🚀 Features

### 1. Planning Steps
The portal guides clients through 5 main planning steps:

1. **Welcome** - Introduction and overview
2. **Key People** - Wedding party and family members
3. **Locations** - Venues and photo locations
4. **Group Photos** - Formal group shot planning
5. **Special Requests** - Custom photo ideas
6. **Timeline** - Day-of event scheduling
7. **Completion** - Final review and submission

### 2. Core Planning Sections

#### Key People Section
- Add wedding party members with roles
- Define special actions (speeches, readings, dances)
- Role-based categorization (bridesmaids, groomsmen, family)
- Notes and special instructions

#### Locations Section
- Multiple venue support
- Location types (ceremony, reception, getting ready, etc.)
- Address management and travel time estimates
- Arrival/departure scheduling

#### Group Shots Section
- Predefined group shot categories
- Custom group shot creation
- Family, wedding party, and extended family organization
- Time allocation and notes

#### Photo Requests Section
- Special photo idea submission
- Request categorization and prioritization
- Detailed descriptions and requirements
- Photographer review workflow

#### Timeline Section
- Event scheduling and timing
- Predefined event types
- Custom event creation
- Flow optimization and coordination

### 3. Data Management
- **Real-time Updates**: Live synchronization across all sections
- **Local State Management**: Optimistic updates with conflict resolution
- **Unsaved Changes Protection**: Prevents accidental data loss
- **Section Locking**: Controlled access based on workflow progress

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Firebase project with Firestore enabled

### Environment Variables
Create a `.env.local` file with the following Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eye-doo-client-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Firebase**
   - Create a Firebase project
   - Enable Firestore database
   - Set up authentication
   - Configure security rules
   - Add the master data using the provided script

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Data Structure

### Firebase Collections

#### Projects Collection
- **Document ID**: Unique project identifier
- **Fields**: Project metadata, client information, photographer details
- **Subcollections**: locations, keyPeople, groupShots, photoRequests, timeline

#### Master Data
- **Kit Categories**: Photography equipment and essentials
- **Couple Shot Categories**: Predefined couple photography scenarios
- **Group Shot Categories**: Family and wedding party groupings
- **Timeline Event Types**: Standard wedding day events

### Data Models

#### Project Data
```typescript
interface ProjectData {
  projectInfo: {
    projectName: string;
    eventDate: Timestamp;
    personA: { firstName: string; surname: string };
    personB: { firstName: string; surname: string };
    location: { locationAddress: string; locationPostcode: string };
    contact: { primaryEmail: string; primaryPhone: string };
  };
  portalStatus: {
    currentStep: number;
    sectionStates: Record<string, SectionStatus>;
  };
}
```

#### Section Data Structure
Each planning section follows a consistent pattern:
```typescript
interface SectionData<T> {
  config: {
    finalized: boolean;
    photographerReviewed: boolean;
    status: SectionStatus;
  };
  items: T[];
}
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture
- Custom hooks for business logic

### Adding New Features
1. Define types in `src/types/`
2. Create components in `src/components/`
3. Add services in `src/lib/`
4. Update the main page to include new sections
5. Add to the planning steps array

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Build command: `npm run build`, Publish directory: `out`
- **Firebase Hosting**: Use Firebase CLI for deployment
- **Docker**: Build and deploy as containerized application

## 🔒 Security

### Authentication
- Custom token authentication via Firebase Cloud Functions
- Secure portal access with project-specific tokens
- Client isolation and data privacy

### Firestore Rules
- Project-based access control
- Client data isolation
- Read/write permissions based on authentication status

## 📱 Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design
- Progressive Web App capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the Firebase console for configuration issues
- Review the browser console for client-side errors
- Verify environment variables are correctly set
- Ensure Firebase security rules allow necessary operations

## 🔮 Future Enhancements

- **Offline Support**: Service worker for offline functionality
- **Multi-language Support**: Internationalization for global clients
- **Advanced Analytics**: Client engagement and planning metrics
- **Integration APIs**: Third-party wedding planning tools
- **Mobile App**: Native mobile applications
- **AI Planning Assistant**: Intelligent suggestions and optimization

---

**Built with ❤️ for wedding photographers and their clients**
