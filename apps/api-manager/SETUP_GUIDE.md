# API Manager II - OBP OAuth Setup Guide

This guide will help you configure API Manager II to work with your Open Bank Project (OBP) OAuth server.

## Prerequisites

1. **OBP Server**: Running on `http://127.0.0.1:9000`
2. **Redis**: Running on `localhost:6379`
3. **Node.js**: Version 18+ with npm
4. **OAuth Client Credentials**: Already provided

## Your OAuth Credentials

```
CLIENT_NAME: obp-api-manager-ii
CONSUMER_ID: 7707cbdb-985f-458a-8b87-e9416c44c421
CLIENT_ID: 39fb9d38-cd0e-44e7-9da5-556d0673e40d
CLIENT_SECRET: NJsso0ugXG6sTT3ngDolw6U_Gr3hfdqCHG-0hvaT54I
```

## Step 1: Environment Configuration

Your `.env` file has been automatically configured with:

```env
# OBP API Configuration
PUBLIC_OBP_BASE_URL=http://127.0.0.1:9000

# OAuth Client Configuration (OBP OIDC)
OBP_OAUTH_CLIENT_ID=39fb9d38-cd0e-44e7-9da5-556d0673e40d
OBP_OAUTH_CLIENT_SECRET=NJsso0ugXG6sTT3ngDolw6U_Gr3hfdqCHG-0hvaT54I

# Application Configuration
APP_CALLBACK_URL=http://localhost:3003/login/obp/callback

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3003
```

## Step 2: Update OBP Client Redirect URIs

⚠️ **IMPORTANT**: You need to update your OBP OAuth client configuration to include the correct callback URL.

### Current Redirect URIs in OBP:

```
http://localhost:3003/callback
http://localhost:3003/oauth/callback
```

### Required Redirect URI for API Manager II:

```
http://localhost:3003/login/obp/callback
```

### How to Update Redirect URIs:

1. **Via OBP Admin Interface** (if available):
   - Login to your OBP admin dashboard
   - Navigate to OAuth clients
   - Find client ID: `39fb9d38-cd0e-44e7-9da5-556d0673e40d`
   - Add/update redirect URI: `http://localhost:3004/login/obp/callback`

2. **Via OBP API** (if you have admin access):

   ```bash
   curl -X PUT http://127.0.0.1:9000/obp/v5.1.0/management/consumers/CONSUMER_ID \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "redirect_urls": [
         "http://localhost:3003/callback",
         "http://localhost:3003/oauth/callback",
         "http://localhost:3003/login/obp/callback"
       ]
     }'
   ```

3. **Manual Configuration**:
   - Contact your OBP administrator to add the redirect URI
   - Or update your server configuration files directly if you have access

## Step 3: OAuth Endpoints Configuration

API Manager II is configured to use these OAuth endpoints:

```
Authorization: http://127.0.0.1:9000/auth
Token: http://127.0.0.1:9000/token
UserInfo: http://127.0.0.1:9000/userinfo
JWKS: http://127.0.0.1:9000/jwks
Discovery: http://127.0.0.1:9000/.well-known/openid-configuration
```

The application uses these OAuth endpoints for authentication.

## Step 4: Verify Prerequisites

### Check Redis

```bash
redis-cli ping
# Should return: PONG
```

### Check OBP Server

```bash
curl http://127.0.0.1:9000/health
# Should return: OK or health status
```

### Check OAuth Endpoints

```bash
# Test authorization endpoint
curl -I http://127.0.0.1:9000/auth

# Test token endpoint
curl -I http://127.0.0.1:9000/token
```

## Step 5: Start the Application

1. **Install dependencies** (if not already done):

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **The application should start on**: `http://localhost:3003`

## Step 6: Test the OAuth Flow

1. **Visit the login page**:

   ```
   http://localhost:3003/login
   ```

2. **Click "Login with Open Bank Project"**

3. **You should be redirected to**:

   ```
   http://127.0.0.1:9000/auth?client_id=39fb9d38-cd0e-44e7-9da5-556d0673e40d&response_type=code&redirect_uri=http://localhost:3003/login/obp/callback&scope=openid&state=...
   ```

4. **After authentication, you should be redirected back to**:

   ```
   http://localhost:3003/login/obp/callback?code=...&state=...
   ```

5. **Finally, you should be redirected to the dashboard**:
   ```
   http://localhost:3003/
   ```

## Troubleshooting

### Common Issues

#### 1. "OAuth provider not configured" Error

- **Cause**: Environment variables not loaded or OAuth client initialization failed
- **Solution**: Check `.env` file exists and restart the server

#### 2. "Invalid redirect_uri" Error

- **Cause**: The callback URL is not registered in your OBP OAuth client
- **Solution**: Add `http://localhost:3003/login/obp/callback` to your OBP client's redirect URIs

#### 3. "Service Unavailable" Error

- **Cause**: OAuth providers not initialized (usually Redis or OBP server issues)
- **Solution**:
  - Check Redis: `redis-cli ping`
  - Check OBP server: `curl http://127.0.0.1:9000/health`

#### 4. Port 3003 Already in Use

- **Solution**: Either:
  - Stop the process using port 3003: `lsof -ti:3003 | xargs kill -9`
  - Or update `.env` to use a different port and update redirect URIs accordingly

#### 5. "Token request failed" Error

- **Cause**: Client credentials incorrect or token endpoint unreachable
- **Solution**:
  - Verify client ID and secret in `.env`
  - Test token endpoint: `curl -I http://127.0.0.1:9000/token`

### Debug Mode

To see detailed OAuth logs, check the browser console and server logs for messages from:

- `OAuthProviderFactory`
- `OBPLogin`
- `OBPLoginCallback`
- `HooksServer`

### Verification Script

Run the configuration verification script:

```bash
node verify-obp-config.cjs
```

This will test:

- OBP server health
- OAuth endpoints accessibility
- Client configuration validity
- Redis connection

## Security Notes

1. **HTTPS in Production**: Use HTTPS URLs for redirect URIs in production
2. **Environment Variables**: Never commit `.env` files to version control
3. **Client Secret**: Keep the client secret secure and rotate it regularly
4. **Session Security**: Configure secure session settings for production

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify all prerequisites are met
3. Test each OAuth endpoint individually
4. Check the OBP client configuration matches the redirect URI
5. Ensure Redis is accessible and working

## OAuth Flow Summary

1. User clicks "Login with Open Bank Project"
2. User is redirected to OBP authorization server (`/auth`)
3. User authenticates with their OBP credentials
4. OBP redirects back to API Manager II callback (`/login/obp/callback`)
5. API Manager II exchanges authorization code for access token (`/token`)
6. API Manager II fetches user info (`/obp/v5.1.0/users/current`)
7. User session is created and user is redirected to dashboard

The entire process should be seamless once properly configured.
