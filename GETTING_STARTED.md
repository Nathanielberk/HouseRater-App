# Getting Started with HouseRater

## What We've Built So Far

✅ **Web Application Foundation**
- Next.js project with TypeScript
- Tailwind CSS for styling
- Basic home page with modern design
- Development server running at http://localhost:3000

## How to View Your Website

1. **Open your web browser** (Chrome, Edge, Firefox, etc.)
2. **Go to:** `http://localhost:3000`
3. **You should see:** The HouseRater home page with a gradient title and three feature cards

## How to Stop the Development Server

If you need to stop the server:
```bash
# Press Ctrl+C in the terminal where it's running
# Or we can stop it programmatically
```

## Next Steps

We're going to build these modules in order:

### Phase 1: Backend Setup (Next)
1. Create a Supabase account (free)
2. Set up the database
3. Configure authentication

### Phase 2: Authentication Module
4. Build login/signup pages
5. Add user account creation
6. Multi-user account support (2-5 users per account)

### Phase 3: Category System
7. Display the 29 default categories
8. Add ability to create custom categories
9. Remove unwanted categories
10. Build the weighting interface

### Phase 4: House Rating
11. Add house management (addresses, prices)
12. Integrate maps
13. Build rating interface
14. Create comparison view

### Phase 5: Mobile App
15. Set up React Native project
16. Port web features to mobile
17. Deploy to app stores

## Project Files Explained

- `packages/web/app/page.tsx` - Home page
- `packages/web/app/layout.tsx` - Main wrapper (title, CSS)
- `packages/web/app/globals.css` - Global styles
- `packages/web/next.config.js` - Next.js settings
- `packages/web/tailwind.config.ts` - Tailwind CSS settings
- `packages/web/package.json` - Project dependencies and scripts

## Common Commands

```bash
# Navigate to web project
cd HouseRater-App/packages/web

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Check for code errors
npm run lint

# Build for production
npm run build
```

## Need Help?

If something doesn't work:
1. Check that you're in the right directory (`HouseRater-App/packages/web`)
2. Make sure `npm install` has been run
3. Check that port 3000 isn't already in use
4. Ask Claude for help!
