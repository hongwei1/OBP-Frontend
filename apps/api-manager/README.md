# API Manager II

A modern web application for managing Open Bank Project (OBP) APIs, built with SvelteKit, TypeScript, and Tailwind CSS.

## 📖 Documentation

- **[UI Patterns & Component Guidelines](./UI_PATTERNS.md)** - Required reading for anyone creating new pages or components. Defines the UI frameworks, patterns, and styling conventions used in this project.

## Overview

API Manager II provides an intuitive interface for managing and monitoring Open Bank Project APIs. It features OAuth2/OIDC authentication, real-time metrics monitoring, and comprehensive API management capabilities.

## Features

- **OAuth2/OIDC Authentication**: Secure authentication with OBP servers
- **API Metrics Monitoring**: Real-time API call metrics with filtering and refresh capabilities
- **Recent API Calls**: Live tracking of API usage with detailed information
- **Responsive Design**: Modern UI built with Tailwind CSS and Skeleton UI
- **Session Management**: Redis-based session storage
- **TypeScript Support**: Full type safety throughout the application

## Tech Stack

- **Frontend**: SvelteKit, TypeScript, Tailwind CSS
- **UI Components**: Skeleton Labs, Lucide Icons, Bits UI
- **Authentication**: Arctic (OAuth2/OIDC), JWT
- **Session Storage**: Redis with svelte-kit-sessions
- **Build Tool**: Vite
- **Testing**: Vitest

## Prerequisites

- Node.js 18+
- Redis server
- Open Bank Project (OBP) server with OAuth2 configured

## Installation

1. **Clone the repository**

   ```bash
   git clone git@github.com:OpenBankProject/API-Manager-II.git
   cd API-Manager-II
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # OBP API Configuration
   PUBLIC_OBP_BASE_URL=http://127.0.0.1:9000

   # OAuth Client Configuration
   OBP_OAUTH_CLIENT_ID=your-client-id
   OBP_OAUTH_CLIENT_SECRET=your-client-secret

   # Application Configuration
   APP_CALLBACK_URL=http://localhost:3003/login/obp/callback

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Server Configuration
   PORT=3003
   ```

4. **Start Redis server**

   ```bash
   redis-server
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3003`.

## Configuration

### OAuth Setup

1. Register your application with your OBP server
2. Configure the callback URL: `http://localhost:3003/login/obp/callback`
3. Update your `.env` file with the client credentials

For detailed OAuth setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## Development

### Available Scripts

- `npm run dev` - Start development server on port 3003
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type check the project
- `npm run format` - Format code with Prettier
- `npm run lint` - Check code formatting
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

### Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── stores/         # Svelte stores for state management
│   └── utils/          # Utility functions
├── routes/
│   ├── (protected)/    # Protected routes requiring authentication
│   │   └── management/ # API management features
│   │       ├── api/    # API management pages
│   │       └── metrics/ # Metrics and monitoring
│   ├── login/          # Authentication routes
│   └── logout/         # Logout handling
└── hooks.server.ts     # Server-side hooks
```

## Features Detail

### Metrics Dashboard

- Real-time API metrics with auto-refresh (configurable intervals)
- Advanced filtering by date ranges, API versions, and more
- Visual countdown indicators for refresh timing
- Color-coded timestamps for visual feedback

### API Management

- Comprehensive API endpoint management
- Real-time API call monitoring
- Detailed request/response tracking

### Authentication

- Multi-provider OAuth2/OIDC support
- Secure session management with Redis
- Automatic token refresh handling

## Deployment

### Production Build

```bash
npm run build
```

### Docker (Coming Soon)

Docker configuration will be available in future releases.

### Environment Variables

Ensure all production environment variables are properly configured:

- `PUBLIC_OBP_BASE_URL` - Your OBP server URL
- `OBP_OAUTH_CLIENT_ID` - OAuth client ID
- `OBP_OAUTH_CLIENT_SECRET` - OAuth client secret
- `APP_CALLBACK_URL` - Production callback URL
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Open an issue on GitHub
- Check the [SETUP_GUIDE.md](./SETUP_GUIDE.md) for configuration help
- Review the project documentation

## Related Projects

- [Open Bank Project](https://github.com/OpenBankProject/OBP-API) - The core OBP API server
- [API Explorer](https://github.com/OpenBankProject/API-Explorer) - Interactive API documentation
