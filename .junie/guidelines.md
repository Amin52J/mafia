# Project Guidelines

This document provides essential information for developing and maintaining the **mafia** project.

## 🛠 Build & Configuration

This project is built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS 4**.

### Core Commands
- `npm run dev`: Starts the development server.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Starts the production server after building.
- `npm run lint`: Runs ESLint for code quality checks.

### Environment Setup
- Local environment variables should be placed in `.env.local`.
- The project uses **TypeScript** with strict mode enabled.

---

## 🧪 Testing

There is no heavy testing framework (like Vitest or Jest) installed by default. Simple logic tests can be executed using Node.js's built-in test runner.

### How to Run Tests
Execute the following command to run all `.test.mjs` files:
```bash
node --test src/**/*.test.mjs
```

### Adding New Tests
1. Create a utility file (e.g., `src/utils/math.js`).
2. Create a corresponding test file with the `.test.mjs` extension (e.g., `src/utils/math.test.mjs`).
3. Use the `node:test` and `node:assert` modules.

**Example Test (`src/utils/sum.test.mjs`):**
```javascript
import test from 'node:test';
import assert from 'node:assert';
import { sum } from './sum.js';

test('sum function adds two numbers', () => {
  assert.strictEqual(sum(1, 2), 3);
});
```

### Advanced Testing
For UI or component testing, it is recommended to install **Vitest** and **React Testing Library**.

---

## 💻 Development Information

### Tech Stack Details
- **React 19 Compiler**: Enabled in `next.config.ts` (`reactCompiler: true`). The compiler automatically optimizes re-renders, reducing the need for `useMemo` and `useCallback`.
- **Tailwind CSS 4**: Uses the new CSS-first engine. Configuration is handled via CSS variables and the `@theme` block in `src/app/globals.css`, rather than a standalone `tailwind.config.ts`.
- **Path Aliases**: Use `@/*` to import from the `src/` directory (e.g., `import { Button } from "@/components/Button"`).

### Project Structure
- `src/app`: Contains the routing logic and page components (App Router).
- `src/components`: (Recommended) For reusable UI components.
- `src/utils`: (Recommended) For pure utility functions.

### Code Quality
- Follow standard React and TypeScript best practices.
- Server Components are preferred; use Client Components (`"use client"`) only when necessary.
