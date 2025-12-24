# Environment Variables Setup

This project uses environment-specific configuration files for different deployment environments.

## Environment Files

Vite supports environment-specific files that are automatically loaded:

- **`.env.development`** - Used when running `npm run dev` (localhost development)
- **`.env.production`** - Used when running `npm run build` (for production deployment)
- **`.env.local`** - Local overrides (gitignored, optional)

**Priority:** `.env.local` > `.env.[mode]` > `.env`

## Required Variables

### VITE_GOOGLE_CLIENT_ID
Your Google OAuth 2.0 Client ID. To get one:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure the OAuth consent screen if prompted
6. Create an OAuth 2.0 Client ID for "Web application"
7. Copy the Client ID and add it to your environment file

**Note:** You may need different Client IDs for development and production (different authorized origins).

### VITE_API_ENDPOINT
The HTTP endpoint URL where user login data will be sent after successful OAuth authentication.

**Request Method:** POST

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "method": "google",
  "authToken": "oauth_access_token"
}
```

### VITE_ISDEV (Optional)
Enable development logging. When set to `true`, detailed logs will be output to the terminal/console for all user actions, API calls, and application events.

**Values:** `true` or `false` (default: `false`)

**Note:** Logs will only appear in the terminal when running `npm run dev` if this is set to `true`.

## Setup Instructions

### For Local Development (localhost)

Edit `.env.development` file in the root directory:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_ENDPOINT=http://localhost:5255/login
VITE_ISDEV=true
```

This configuration is automatically used when you run `npm run dev`.

### For Production (DigitalOcean)

Edit `.env.production` file in the root directory:

```
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id_here
VITE_API_ENDPOINT=https://your-production-api.com/login
VITE_ISDEV=false
```

This configuration is automatically used when you run `npm run build`.

### Local Overrides (Optional)

If you need to override settings for your local machine only, create a `.env.local` file (this file is gitignored):

```
VITE_GOOGLE_CLIENT_ID=your_override_client_id
VITE_API_ENDPOINT=http://localhost:5255/login
VITE_ISDEV=true
```

**Note:** All `.env*` files are gitignored and will not be committed to version control for security. Create the `.env.development` and `.env.production` files locally with your actual configuration values.

