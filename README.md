# HouseRater App

A modern web and mobile application for rating and comparing houses with multiple users.

## Project Structure

```
HouseRater-App/
├── packages/
│   ├── web/          # Next.js web application
│   ├── mobile/       # React Native mobile app (coming soon)
│   └── shared/       # Shared code and types
├── docs/             # Documentation
└── README.md         # This file
```

## Web Application

The web app is built with:
- **Next.js 16** - React framework with server-side rendering
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### Running the Web App

```bash
cd packages/web
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run lint` - Check code quality

## Modules

The app is organized into independent modules:

1. **Authentication & Account Setup** - User login and multi-user accounts
2. **Category Management** - Add, remove, customize rating categories
3. **Category Weighting** - Rate importance of each category
4. **House Management** - Add houses with map integration
5. **House Rating** - Rate houses against categories
6. **Scoring & Comparison** - Compare houses side-by-side

## Tech Stack

- Frontend: React + Next.js (web), React Native (mobile)
- Backend: Supabase (PostgreSQL + Auth + API)
- Hosting: Vercel (web), Expo (mobile)
- Maps: React Map GL / React Native Maps

## Development Status

- [x] Web project initialized
- [ ] Mobile project setup
- [ ] Supabase backend configuration
- [ ] Database schema implementation
- [ ] Authentication module
- [ ] Category management module
- [ ] Rating and scoring modules

## License

ISC
