# GifCamp Website

A modern React application with OAuth authentication, built with Vite.

## Features

- **OAuth Authentication**: Login with Google OAuth
- **Session Management**: Persistent user sessions with localStorage
- **Responsive Layout**: Template with menu bar, footer, and main content area
- **User Management**: Automatic user registration via API endpoint

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [ENV_SETUP.md](./ENV_SETUP.md)):
   - Create a `.env` file in the root directory
   - Add your Google OAuth Client ID
   - Configure your API endpoint URL

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── Layout/          # Layout components (MenuBar, Footer, Layout)
│   └── LoginModal/      # OAuth login modal
├── contexts/
│   └── AuthContext.jsx  # Authentication context provider
├── pages/
│   └── HomePage.jsx    # Home page component
├── App.jsx              # Main app component
└── main.jsx             # Entry point
```

## Environment Variables

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed information about required environment variables.

## Authentication Flow

1. User clicks "Login" button in the menu bar
2. OAuth modal opens with authentication options
3. User authenticates with Google OAuth
4. User details are sent to the configured API endpoint
5. User session is stored in localStorage
6. Login button changes to "Logout"

## API Integration

After successful OAuth authentication, the app sends a POST request to your configured API endpoint with the following payload:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "method": "google",
  "authToken": "oauth_access_token"
}
```

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Technologies Used

- React 19
- Vite
- React Router DOM
- @react-oauth/google
- Axios
