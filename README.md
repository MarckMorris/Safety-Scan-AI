
# Safety Scan AI

Safety Scan AI is a Next.js application that uses advanced AI to scan websites and mobile applications for security vulnerabilities. This platform is built with Next.js, Firebase, and Tailwind CSS, featuring a minimalist, elegant, and modern design.

## Features

-   **AI-Powered Vulnerability Scanner**: Detects common vulnerabilities (OWASP Top 10), SQL injection points, exposed APIs, insecure HTTP headers, and outdated dependencies.
-   **Secure Authentication**: Firebase Auth for login, registration, email verification, and password reset.
-   **Scan Result Display**: User-friendly JSON and natural language format for scan results, with severity classification.
-   **AI Recommendations**: Generates human-readable security improvement reports with best practices.
-   **Scan History Dashboard**: User dashboard with history of scans, search, filter, and sort functionalities.
-   **Role-Based Access**: Basic support for Admin and Regular User roles (extensible).
-   **Modern UI/UX**: Inspired by Apple.com, built with ShadCN UI components and Tailwind CSS.

## Tech Stack

-   **Frontend**: Next.js (App Router), React, TypeScript
-   **Backend**: Firebase (Auth, Firestore, Storage)
-   **Styling**: Tailwind CSS, ShadCN UI
-   **AI**: Genkit with Google AI (Gemini) - flows are pre-built in `src/ai/flows`
-   **Form Management**: React Hook Form, Zod

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (version 18.x or later recommended)
-   npm or yarn
-   Firebase Account and a Firebase project set up.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd safety-scan-ai 
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Firebase Configuration:**
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   In your Firebase project settings, find your web app's Firebase configuration.
    *   Copy the `.env.example` file to a new file named `.env.local`:
        ```bash
        cp .env.example .env.local
        ```
    *   Populate `.env.local` with your Firebase project's configuration values:
        ```
        NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id # Optional, for Analytics
        ```

4.  **Configure Firebase Services:**
    *   **Authentication**: Enable Email/Password sign-in method in Firebase Authentication.
    *   **Firestore**: Create a Firestore database. You'll need to set up security rules. A basic set of rules allowing authenticated users to read/write their own data could be:
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Users can manage their own profile
            match /users/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
            // Users can manage their own scans
            match /users/{userId}/scans/{scanId} {
              allow read, write, delete: if request.auth != null && request.auth.uid == userId;
            }
            // Add other rules as needed, e.g., for admin access
          }
        }
        ```
    *   **Storage** (If used for report storage, etc.): Set up Cloud Storage and configure security rules similarly.

5. **Set up Genkit AI (Google AI Provider):**
   * The application uses Genkit with the Google AI provider. Ensure your environment is configured for Genkit and has access to a Google AI model (like Gemini).
   * You might need to set up `GOOGLE_API_KEY` or similar environment variables if your Genkit setup requires it for the Google AI provider. Refer to Genkit documentation.
   * To run Genkit flows locally for testing or if backend functions are used:
    ```bash
    npm run genkit:dev 
    # or for watching changes
    npm run genkit:watch
    ```

6.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running on [http://localhost:9002](http://localhost:9002) (or the port specified in your `package.json` dev script).

### Building for Production

To build the application for production:

```bash
npm run build
```

This will create an optimized build in the `.next` folder.

### Deployment

This Next.js application can be deployed to various platforms like Vercel, Netlify, or Firebase Hosting.

**Firebase Hosting:**
1.  Install Firebase CLI: `npm install -g firebase-tools`
2.  Login to Firebase: `firebase login`
3.  Initialize Firebase Hosting: `firebase init hosting`
    *   Select your Firebase project.
    *   Specify `out` as your public directory (if exporting a static site) or configure rewrites for a Next.js SSR app. For Next.js with App Router, Firebase Hosting supports it directly or via Cloud Functions/Cloud Run.
4.  Deploy: `firebase deploy`

Refer to the `apphosting.yaml` for Firebase App Hosting configurations. This project is set up to be easily deployable on Firebase App Hosting.

**Vercel:**
Vercel is the recommended platform for deploying Next.js applications.
1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Sign up or log in to [Vercel](https://vercel.com).
3.  Import your Git repository. Vercel will automatically detect it's a Next.js project.
4.  Configure environment variables (your Firebase config) in the Vercel project settings.
5.  Deploy.

## Folder Structure

-   `src/app/`: Next.js App Router pages and layouts.
    -   `(auth)`: Route group for authentication pages.
    -   `(dashboard)`: Route group for protected dashboard pages.
-   `src/components/`: Reusable UI components.
    -   `layout/`: Header, Footer, Sidebar components.
    -   `ui/`: ShadCN UI components.
    -   `auth/`: Auth-related form components.
    -   `dashboard/`: Dashboard-specific components.
-   `src/context/`: React context providers (e.g., `AuthContext`).
-   `src/lib/`: Utility functions, Firebase initialization (`firebase.ts`).
-   `src/types/`: TypeScript type definitions.
-   `src/ai/`: Genkit AI flows and configuration.
    -   `flows/`: Pre-built AI flows for scanning and reporting.
-   `public/`: Static assets.
-   `styles/`: Global styles (though most styling is via Tailwind CSS in components).

## Contributing

Contributions are welcome! Please follow standard Git practices: fork the repository, create a feature branch, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details (if one exists).
If no license is present, it is proprietary.

# Until 6/27/2025 everything is working properly