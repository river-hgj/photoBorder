# Repository Guidelines

## Project Structure & Module Organization

This is a React 19 + TypeScript + Vite app for adding camera-info borders to uploaded photos.

- `src/App.tsx` owns app state, upload handling, editor controls, and template selection.
- `src/templates/` contains border templates. Each template exports one `TemplateDefinition` and its Canvas export renderer.
- `src/components/CanvasPreview.tsx` renders the live preview by calling the same Canvas renderer used for export.
- `src/brand/` contains brand icon matching and Canvas logo drawing helpers.
- `src/lib/` contains reusable utilities such as EXIF parsing, image drawing, and color readability logic.
- `src/data/` contains static options and defaults.
- `public/` is for static assets. Keep unused starter assets out of the repo.

## Build, Test, and Development Commands

Use `pnpm`.

- `pnpm dev` starts the Vite development server.
- `pnpm build` runs TypeScript project checks and creates a production build in `dist/`.
- `pnpm lint` runs ESLint across the repository.
- `pnpm preview` serves the production build locally.

## Coding Style & Naming Conventions

Use TypeScript and functional React components. Keep modules small and named by responsibility, for example `whiteBottom.tsx`, `exif.ts`, and `brandIcons.ts`.

Prefer named exports for shared utilities and template definitions. Use `PascalCase` for React components and `camelCase` for functions, variables, and files that are not components. Keep template-specific drawing logic inside `src/templates/`; do not move Canvas layout constants back into `App.tsx`.

Run `pnpm lint` before handing off changes.

## Testing Guidelines

No automated test framework is currently configured. For now, verify changes with:

1. `pnpm build`
2. `pnpm lint`
3. Manual browser testing through `pnpm dev`

When changing templates, test upload, template switching, border width changes, logo changes, and PNG export. Preview and export must remain visually consistent because both should use the same Canvas renderer.

## Commit & Pull Request Guidelines

The current history only has `init project`, so no strict commit convention is established. Use short imperative commit messages, for example `Add canvas preview renderer` or `Fix white template logo color`.

Pull requests should include a clear summary, screenshots or exported sample images for visual changes, and notes on validation commands run. Link related issues when available.

## Architecture Notes

Template previews are Canvas-based by design. Do not reintroduce DOM/CSS overlays for the photo output unless the export path is updated to use the same rendering source.

@RTK.md
