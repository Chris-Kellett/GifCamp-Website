# Environment Variables Setup

This project requires the following environment variables to be set in a `.env` file in the root directory.

## Required Variables

### VITE_GOOGLE_CLIENT_ID
Your Google OAuth 2.0 Client ID. To get one:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure the OAuth consent screen if prompted
6. Create an OAuth 2.0 Client ID for "Web application"
7. Copy the Client ID and add it to your `.env` file

### VITE_API_ENDPOINT
The HTTP endpoint URL where user login data will be sent after successful OAuth authentication.

**Format:** `http://your-api-server.com/api/auth/login`

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

## Example .env File

Create a `.env` file in the root directory with the following content:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_API_ENDPOINT=http://localhost:3001/api/auth/login
VITE_ISDEV=true
```

**Note:** The `.env` file is already included in `.gitignore` and will not be committed to version control.

