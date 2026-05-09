# Repository Guidelines

## Project Overview

Photo Border is a React 19 + TypeScript + Vite PWA for adding camera-info borders to uploaded photos. It supports single or batch image uploads, reads JPEG EXIF when available, lets users edit camera metadata, matches camera brand logos, previews the final output with Canvas, and exports the rendered image.

The live preview and exported file must stay visually consistent. Both paths should use the same Canvas template renderer.

## Project Structure & Module Organization

- `src/App.tsx` owns app state, upload handling, editor controls, template selection, batch export, and export orchestration.
- `src/components/CanvasPreview.tsx` renders the live preview by calling the selected template's Canvas renderer.
- `src/templates/` contains border templates. Each template exports one `TemplateDefinition` with metadata, control declarations, optional canvas sizing, and its Canvas export renderer.
- `src/brand/` contains brand icon matching and Canvas logo drawing helpers.
- `src/lib/` contains reusable utilities such as EXIF parsing/writing, image loading/drawing, and color readability logic.
- `src/data/` contains static options and defaults.
- `public/camera-logos/` contains brand logo SVG files.
- `public/example/` contains template example images.
- `public/` is for static assets. Keep unused starter assets out of the repo.

## Current User-Facing Features

- Upload one or more photos.
- Read JPEG EXIF metadata and prefill brand, device, exposure parameters, and shooting time when possible.
- Manually edit border text metadata.
- Select matched brand logo variants and adjust logo scale.
- Switch templates, with the control panel showing only the settings required by the selected template.
- Export the current photo or batch export all uploaded photos.

## Current Templates

- `white-bottom`: white bottom information panel. Shows brand, device, Logo, parameters, and time.
- `blur-frame`: blurred background frame. Shows Logo and parameters, and supports border width, corner radius, and blur intensity controls.

## Template Architecture

Template previews are Canvas-based by design. Do not reintroduce DOM/CSS overlays for the photo output unless the export path is updated to use the same rendering source.

When adding or changing a template:

- Keep template-specific drawing logic inside `src/templates/`; do not move Canvas layout constants back into `App.tsx`.
- Export a `TemplateDefinition`.
- Use `id`, `name`, and `description` for the template picker.
- Use `controls` to declare which settings the template needs, including metadata fields, logo controls, border width, and template-specific adjustment sliders.
- Implement `drawExport` for Canvas rendering. Preview and export both call this renderer.
- Implement `getCanvasWidth` only when the template changes the export canvas width.
- Register new templates in `src/templates/index.ts`.

When changing templates, test upload, template switching, border width changes, logo changes, template-specific adjustments, and image export.

## Brand Logo Assets

Brand logo files in `public/camera-logos/` come from the Camera-Logos-SVG project:

<https://github.com/HiSeatown/Camera-Logos-SVG>

Keep attribution in README when changing these assets.

## Build, Test, and Development Commands

Use `pnpm`.

- `pnpm dev` starts the Vite development server.
- `pnpm build` runs TypeScript project checks and creates a production build in `dist/`.
- `pnpm lint` runs ESLint across the repository.
- `pnpm preview` serves the production build locally.

## Coding Style & Naming Conventions

Use TypeScript and functional React components. Keep modules small and named by responsibility, for example `whiteBottom.tsx`, `blurFrame.tsx`, `exif.ts`, and `brandIcons.ts`.

Prefer named exports for shared utilities and template definitions. Use `PascalCase` for React components and `camelCase` for functions, variables, and files that are not components.

Run `pnpm lint` before handing off changes.

## Testing Guidelines

No automated test framework is currently configured. For now, verify changes with:

1. `pnpm build`
2. `pnpm lint`
3. Manual browser testing through `pnpm dev`

For visual or template changes, include screenshots or exported sample images in pull requests when possible.

## Commit & Pull Request Guidelines

The current history only has `init project`, so no strict commit convention is established. Use short imperative commit messages, for example `Add canvas preview renderer` or `Fix white template logo color`.

Pull requests should include a clear summary, screenshots or exported sample images for visual changes, and notes on validation commands run. Link related issues when available.

@RTK.md
