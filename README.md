# Clock Factory

A studio for designing printable clock faces, available in a browser or as a Windows desktop app. The browser editor bundles its geometry libraries and needs no external services at runtime. Development requires Node.js 22.12.0 or newer; Electron and packaging tools are development dependencies for the desktop version.

```sh
npm start
```

Run `npm ci` once to install build tools. The browser development server listens on port 3000 (override with `PORT`). `npm start` and `npm run dev` rebuild the browser script and STL worker before starting. Run `npm ci` before developing the desktop app or running the complete test suite; `npm test` covers geometry, HTTP, and desktop assets.

For static hosting, run `npm ci` followed by `npm run build` and serve `index.html`, `style.css`, `studio.js`, `export-worker.js`, `mesh-view.js`, and `THIRD_PARTY_NOTICES.txt` together. Relative asset URLs support hosting under a subdirectory. After updating, reload the page to load the new browser script. The worker is bundled from `mesh.js`, `mesh-extrusion.js`, `contours.js`, and `export-worker-source.js`; the lazy 3D viewer is bundled from `mesh-view-source.js`. Edit these sources and rebuild rather than editing generated scripts.

STL generation runs in a background worker so the editor stays usable while exporting. You can cancel an in-progress export. Preview, print checks, and download share in-progress builds; cancelling the preview cannot cancel a download using that model. The two most recent meshes and last print file are cached. Color, camera, and display changes reuse geometry. Hosts that block workers use a local fallback.

## Projects and editing

Name your project and use **Save project** to download a portable `.clock` file containing all settings, the original SVG, and its orientation. **Open project** restores it in the browser or Windows app, including on another device. This is an editable project backup, separate from STL/3MF print exports. Imported project files are limited to 12 MB, embedded SVGs to 5 MB. Invalid files leave the current design intact. Restored SVGs pass through the same sanitizer as direct imports, and local-save failures are shown honestly while the project remains usable for the session.

Undo/redo stores up to 60 design states, including imported artwork and reset operations. Slider movements are grouped into a single undo step. Use the toolbar, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, or Ctrl+Y; text fields keep their normal text-editing undo. Ctrl/Cmd+S saves a project and Ctrl/Cmd+O opens one. The Windows File and Edit menus offer the same project and history actions. History stays in the current session; the latest design is saved locally and project files provide portable backups. Reset keeps the saved SVG library.

Set the diameter from 100 to 300 mm in 1 mm steps using the slider or exact-size field. **Show hands** controls the illustrative hands in Design view; they never appear in print files. The welcome card can be dismissed, tabs support arrow-key navigation, and the workspace adapts to mobile screens.

## Real 3D preview and print checks

**Design** shows the artwork with optional illustrative hands. **Print mesh** displays the actual validated STL geometry, including shaft opening, thickness, SVG relief, and hour details. Drag to orbit, scroll/pinch or use the buttons to zoom, and use Front/Angle to inspect the surface. The optional edges, build-plate, and SVG-color displays do not alter the exported model. SVG colors use the same embedded texture placement as 3MF. Three.js is bundled locally and loaded only when needed; rendering runs on changes rather than in a continuous animation loop. If 3D graphics are unavailable, design editing, model checks, and downloads remain usable.

**Check model** reports the measured X × Y × Z bounds, solid volume in cm³, and number of connected parts. Solid volume describes the model geometry, not an infill-dependent material estimate or print-time estimate. The build-plate settings accept 80–500 mm per side and check both direct and quarter-turn fit. **Make it fit** reduces the diameter with a 2 mm margin per side when possible. The 100 mm minimum still applies. Multiple disconnected SVG pieces are reported so they can be assembled or given a backing; no connecting geometry is silently added. Print checks supplement inspection in the printer's slicer.

Choose one of six designs or upload SVG artwork, adjust dimensions and finish, and download a binary STL or a standard 3MF model. SVG colors, strokes, gradients, patterns, lettering, local styles, symbols, clipping, masks, embedded images, and common filters are retained in the preview. Original artwork is the default; its color contrast becomes printable relief instead of disappearing into a flat silhouette. STL units are millimeters. Export traces antialiased contours at approximately 0.15 mm sampling, triangulates flat faces, and uses analytic circular geometry for the shaft opening and ripple rings. Curve simplification is limited to 0.02 mm. A narrow smooth rim keeps surface details clear of outer edges and cutouts; very thin artwork can remain smooth. Preset textures and hour markers add up to 0.8 mm; SVG relief is adjustable from 0 to 2 mm, with added hour details up to 0.8 mm above it. Slicer inspection is recommended, particularly for disconnected uploaded artwork. Hands and movements are not included. There is no rear movement recess; choose a shaft long enough for the face and relief. Preset settings are stored locally; up to eight recent SVG files are saved locally on the device. No account, API keys, or installation is needed.

## Windows desktop app

The Windows version runs the editor offline in its own desktop window. There are two ways to use it:

- Run `Clock-Factory-1.5.1-Windows-Portable.exe` directly, without installation.
- Run `Clock-Factory-1.5.1-Windows-Setup.exe` to install it, then open **Clock Factory** from the Start menu.

End users do not need Node.js or a development server. SVGs and projects are opened locally; STL, 3MF, and project files are saved on the computer. Download names use the app version, so later versions will have a different version number.

To develop the desktop app, install Node.js 22.12.0 or newer and run:

```sh
npm ci
npm run desktop
```

To create the Windows x64 installer and portable app on Windows after `npm ci`:

```sh
npm run dist:win
npm run dist:win:portable
```

Both downloads are written to `dist/`. They are currently unsigned; signed distribution requires a code-signing certificate.

The **Windows desktop app** GitHub Actions workflow runs on pushes to `main`, version tags such as `v1.5.0`, or a manual run from the repository's Actions tab. It installs locked dependencies, builds the assets, runs the tests, and packages both downloads in the same Windows job. Download the **Clock-Factory-Windows-x64** artifact from the completed run; it contains the installer, portable app, and `SHA256SUMS.txt`. Creating the workflow alone does not start a remote build or publish a release.

SVG imports are fitted to their visible artwork, including drawings with large viewBoxes and transformed groups. Preview and exported geometry share the same footprint and orientation. External resources and executable content are removed; embed linked images and convert text to paths when exact lettering across devices matters. Self-contained artwork is rasterized at 2048 pixels before fitting; printing details finer than the contour sampling or printer resolution is approximate. Imports up to 5 MB are saved locally in an eight-file recent library, and the selected artwork, detail settings, and quarter-turn/mirror orientation are restored on reopening. When local storage is unavailable, the current SVG remains usable for the session and is clearly marked as unsaved.

The imported-artwork card offers **Original artwork + details** and **Silhouette + filament color**. Original artwork replaces the added ripple/crosshatch texture. **Detail relief** controls its height; **0 mm** keeps the face flat. By default, colors that differ from the dominant painted background are raised, so light lettering on a dark badge and dark lines on paper both work. Dark-area and light-area modes offer explicit alternatives. Relief uses up to eight nested steps in one closed solid with a flat back; it does not reproduce color as separate filament parts. Silhouette mode retains the earlier color and texture customization.

Run `npm run test:svg` for desktop SVG import regressions, including visible preview pixels and STL output. Run `npm run test:svg-library` for saved artwork, drag-and-drop, orientation, restart restoration, removal, and storage-error checks. On display-free Linux, run `npm run build` followed by `npx electron --no-sandbox --ozone-platform=headless --disable-gpu tests/svg-import.electron.cjs`.

Mesh regressions check the serialized STL for closed seams, consistent winding, dimensions, volume, smooth outer curves, and shaft fit. Texture and marker layers are clipped together before meshing, without intersecting duplicate solids.

Upload an SVG by choosing a file or dropping it onto the upload area. The imported-artwork card shows its thumbnail, filename, and save status; use the rotate/flip controls to orient the artwork without rotating the hands. Preview and exported STL share the same transform. Choose a saved thumbnail to reuse it, or Remove to delete that local saved SVG. Reset design keeps the recent library.

## Hour numbers and 3MF

Enable hour details and choose Simple ticks, Numbers (1–12), or Roman (I–XII). Number size and distance from the center are adjustable; labels stay upright when imported SVG artwork is rotated or mirrored. The same built-in vector outlines drive the preview and printed relief. A smooth halo around the numbers keeps texture clear of their edges.

Choose STL or 3MF beside the download button. Both contain the same validated geometry in millimeters. **3MF compatibility** distinguishes printable filament assignments from a visual texture. Switching formats or color limits reuses the prepared mesh. The Windows app supports native Save As dialogs for both formats.

**Bambu Studio · A1 / 0.4 mm** is the default 3MF target. It writes an unsliced A1 project with native facet painting and a numbered filament palette, rather than relying on PNG texture support. Large mesh faces receive adaptive paint subdivisions, so internal SVG colors survive even when several colors lie on one flat triangle. The geometry itself is unchanged. The project references the installed A1 0.4 mm, 0.20 mm Standard, and Generic PLA presets; select the actual filament presets and map the numbered colors to your AMS spools before slicing. No temperatures or machine G-code are embedded. The file leaves flushing volumes unset; configure these in Studio for your selected filaments.

A1 with AMS Lite supplies up to four filaments. Choose a maximum of 2 or 4; gradients and excess colors become solid-color regions. The exported palette appears below the controls. By default, the back matches the dominant SVG color to save a filament slot; **Use selected face color** preserves a separate back color within the same limit. Native downloads end in `-bambu-a1.3mf`. Open the file as a project in Bambu Studio so both painting and the palette are loaded, then check printer/material settings and slice. Re-export older texture-only files using this target to obtain filament assignments.

**Standard 3MF · original color texture** retains the earlier generic export. In original SVG mode it embeds the painted artwork as a PNG using the standard 3MF Materials extension, with UV placement matching rotations and mirroring. The back and base edges use the selected face color. Texture support depends on the consumer; it does not assign AMS filaments. STL contains geometry only, so imported details appear through relief.

The Bambu project uses the native `Application` discriminator required by Bambu's importer; `Creator` identifies Clock Factory as the generator. The native paint serialization follows Bambu's public facet-paint format and is independently implemented. Printer, temperature, and machine-code preset files are not bundled in Clock Factory.

Run `npm run test:numerals-3mf` for desktop checks of number styles, size, position, saved settings, matching STL/3MF geometry, color, and a real native 3MF save. On display-free Linux pass the same Electron headless flags used for the SVG suites.

Run `npm run test:svg-details` for original SVG color, gradient, pattern, fine-line, text, filter, and clipping checks, real detailed STL/3MF downloads, maximum relief with added numerals, texture orientation, worker fallback, and saved detail controls.

Run `npm run test:studio` for project round-trips and native downloads, undo/redo and native menus, exact-size validation, genuine rendered 3D pixels, shared preview/export builds, build-plate fit, disconnected-part detection, cancellation during texture loading, mobile layout, and graphics fallback. The test uses software WebGL for deterministic graphics; the shipped application uses the device's normal graphics settings. On display-free Linux, run `npx electron --no-sandbox --ozone-platform=headless tests/studio.electron.cjs` after building, without `--disable-gpu`.

Run `npm run test:bambu` for real desktop A1 exports, all four source colors, native sub-facet paint, exact STL geometry, color limits, back-color choices, and worker fallback. On display-free Linux use the same headless flags as the other SVG suites.

For an independent consumer check, install Bambu Studio locally and run `node tests/bambu-reference.cjs /path/to/bambu-studio exported-bambu-a1.3mf`. This opens and saves the file in an isolated temporary profile, then asserts that Studio preserved every palette color and every painted facet/subdivision tree. It never slices, uploads, or prints. The A1 export was checked this way with official Bambu Studio 2.9.1.70.
