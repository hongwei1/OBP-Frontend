# API Manager II - AI Project Documentation

## Project Overview

API Manager II is a modern reimplementation of the existing API Manager with a focus on utilizing the OBP Portal's technology stack for improved performance, maintainability, and user experience.

### Instructions to AI

- Keep it simple stupid (KISS)
- Don't Repeat Yourself (DRY)
- Don't add features without being asked explicilty by a human.
- Don't add place holders or mocked data.
- Don't repeat data already displayed on a page.
- Don't tell the user what you have just done unless you experienced a problem. Be like a linux system where silence is golden.

### Target Portal Stack

- **Framework**: SvelteKit (TypeScript/JavaScript)
- **Frontend**: Svelte 5 + Skeleton UI + TailwindCSS
- **Authentication**: OAuth 2.0/OIDC (Arctic library)
- **Session Management**: Redis-backed sessions
- **Database**: PostgreSQL
- **Build Tool**: Vite
- **Deployment**: Node.js adapter

## Resources and References

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Skeleton UI Components](https://www.skeleton.dev/)
- [Arctic OAuth Library](https://arctic.js.org/)
- [Original API Manager](https://github.com/OpenBankProject/API-Manager)
- [OBP Portal Reference Implementation](https://github.com/OpenBankProject/OBP-Portal)
