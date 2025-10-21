# LabTech GeoLab Backend API

Backend API server for the LabTech GeoLab user tracking system. Built with Node.js, Express, and TypeScript.

## Features

- 🔐 JWT-based authentication with MFA support
- 📊 User activity tracking and logging
- 🗄️ PostgreSQL database integration
- 🔄 Real-time updates via WebSocket
- 🛡️ Security hardening (Helmet, CORS, rate limiting)
- 📝 Structured logging
- 🚀 TypeScript with strict mode
- 🎨 ESLint + Prettier for code quality

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL 12.x or higher
- Redis 6.x or higher (for session management)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - Database connection URL
   - JWT secrets (generate secure random strings)
   - Redis connection URL
   - Other service configurations

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

## Building

Build the TypeScript code:
```bash
npm run build
```

The compiled JavaScript will be in the `dist/` directory.

## Production

Start the production server:
```bash
npm run start:prod
```

## Code Quality

### Linting

Run ESLint:
```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint:fix
```

### Formatting

Check code formatting:
```bash
npm run format:check
```

Format code:
```bash
npm run format
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── controllers/     # API endpoint controllers
│   ├── services/        # Business logic services
│   ├── repositories/    # Data access layer
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models and types
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── dist/                # Compiled JavaScript (generated)
├── logs/                # Application logs (generated)
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint configuration
└── .prettierrc.json     # Prettier configuration
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Info
- `GET /api/v1` - API version and documentation info

More endpoints will be added as features are implemented.

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables (Production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing

### Optional Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `REDIS_URL` - Redis connection string
- `CORS_ORIGIN` - Allowed CORS origins
- And many more (see .env.example)

## TypeScript Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
import { SomeController } from '@controllers/some.controller';
import { SomeService } from '@services/some.service';
import { SomeRepository } from '@repositories/some.repository';
import { SomeMiddleware } from '@middleware/some.middleware';
import { SomeModel } from '@models/some.model';
import { someUtil } from '@utils/some.util';
import config from '@config';
```

## Security Considerations

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use strong JWT secrets** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS in production** - Use reverse proxy (Nginx) with SSL
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Follow principle of least privilege** - Database users, file permissions

## Contributing

1. Follow the existing code style (enforced by ESLint/Prettier)
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed

## License

MIT
