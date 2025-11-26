# Polygon Canvas Editor

A Next.js (Pages Router) + TypeScript application that lets users draw, manage, and delete polygons over a canvas-backed image. The UI combines MUI components with TailwindCSS layout utilities, persists polygons via `mongo-lite` (with a JSON fallback), and includes Vitest-based unit tests plus Docker packaging.

## Features
- 🎨 HTML canvas editor with click-to-draw workflow, hover/select highlighting, and Picsum background imagery.
- 🗂️ Sidebar polygon list with cross-highlighting, delete controls, toast notifications, and refresh handling.
- 🔁 API routes (`/api/polygons`) for create/read/delete, each enforcing the required 5-second delay.
- 🧰 `mongo-lite` database wrapper with automatic string IDs and file-based fallback storage for local development.
- 🔔 UX polish: modal error handling, loading overlays, and drawing completion dialog.
- 🧪 Vitest setup with sample geometry tests plus Tailwind v4 + MUI + Emotion integration.
- 🐳 Production-ready Dockerfile and `.dockerignore` for containerized deployments.

## Getting Started
1. **Install dependencies**
	```bash
	npm install
	```
2. **Run the dev server**
	```bash
	npm run dev
	```
3. **Lint & test**
	```bash
	npm run lint
	npm run test
	```
5. **End-to-end tests**
	```bash
	npm run test:e2e
	# first run? install browsers -> npx playwright install --with-deps
	```
4. **Build for production**
	```bash
	npm run build && npm run start
	```

### Environment
- Optional: set `MONGO_URL` to point `mongo-lite` at a running MongoDB instance. When unavailable, the app falls back to `data/polygons.json`.
- Canvas background pulls from `https://picsum.photos/1920/1080`.

## API Summary
| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/polygons` | Returns all polygons after the mandatory 5-second delay. |
| `POST` | `/api/polygons` | Creates a polygon (`{ name, points }`) after waiting 5 seconds. |
| `DELETE` | `/api/polygons/[id]` | Deletes the specified polygon with the same delay. |

Each response is typed as:
```ts
interface Polygon {
  id: string | number;
  name: string;
  points: [number, number][];
}
```

## Canvas Workflow
1. Click **Add Polygon** to enter drawing mode.
2. Click anywhere on the canvas to place vertices (minimum of three points).
3. Choose **Finish Polygon**, provide a name, and the shape is persisted via the API.
4. Hover items in the sidebar or canvas to highlight; click to select.
5. Delete via the sidebar button or the **Delete Selected** button above the canvas.
6. Use **Refresh** to re-fetch polygons; loaders and modals will guide you through slow/failed backend actions.

## Docker
Build and run using the provided multi-stage Dockerfile:
```bash
# Build image
docker build -t polygon-editor .

# Run container
docker run -p 3000:3000 polygon-editor
```
The container installs production dependencies only and exposes the app on port `3000`.

## Testing
- `npm run test`: Vitest unit/integration suite (components, hooks, server logic).
- `npm run test:e2e`: Playwright flows that boot the Next.js dev server and exercise real page interactions.
	- Run `npx playwright install --with-deps` once per machine to provision browsers.

## Project Structure
- `pages/` – Next.js Pages Router screens and API routes.
- `lib/` – `mongo-lite` wrapper plus geometry helpers.
- `types/` – Shared TypeScript interfaces.
- `tests/` – Vitest specs.
- `styles/` – Tailwind v4 global styles.
- `data/` – JSON fallback storage (git-kept for Docker).

Happy drawing! ✨
