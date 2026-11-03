# Clock Factory

A studio for designing printable clock faces, available in a browser or as a Windows desktop app. The browser editor bundles its geometry libraries and needs no external services at runtime. Development requires Node.js 22.12.0 or newer; Electron and packaging tools are development dependencies for the desktop version.

```sh
npm start
```

Run `npm ci` once to install build tools. The browser development server listens on port 3000 (override with `PORT`). `npm start` and `npm run dev` rebuild the browser script and STL worker before starting. Run `npm ci` before developing the desktop app or running the complete test suite; `npm test` covers geometry, HTTP, and desktop assets.

For static hosting, run `npm ci` followed by `npm run build` and serve `index.html`, `style.css`, `studio.js`, and `export-worker.js`, and `THIRD_PARTY_NOTICES.txt` together. Relative asset URLs support hosting under a subdirectory. After updating, reload the page to load the new browser script. The worker is bundled from `mesh.js`, `mesh-extrusion.js`, `contours.js`, and `export-worker-source.js`; edit those sources and rebuild rather than editing generated scripts.

STL generation runs in a background worker so the editor stays usable while exporting. You can cancel an in-progress export. The last print file is cached for immediate repeat downloads, including after color-only changes; shape, size, texture, marker, or mechanism changes produce a new file. Hosts that block workers use a local fallback.

Choose one of six designs or upload SVG artwork (filled shapes, stroked outlines, local styles, symbols, and clipping), adjust dimensions and finish, and download a binary STL. STL units are millimeters. Export traces antialiased contours at approximately 0.15 mm sampling, triangulates flat faces, and uses analytic circular geometry for the shaft opening and ripple rings. Curve simplification is limited to 0.02 mm. A narrow smooth rim keeps surface details clear of outer edges and cutouts; very thin artwork can remain smooth. Surface relief adds up to 0.8 mm. Slicer inspection is recommended, particularly for disconnected uploaded artwork. Hands and movements are not included. There is no rear movement recess; choose a shaft long enough for the face and relief. Colors are illustrative. Preset settings are stored locally; up to eight recent SVG files are saved locally on the device. No account, API keys, or installation is needed.

## Windows desktop app

The Windows version runs the editor offline in its own desktop window. There are two ways to use it:

- Run `Clock-Factory-1.2.0-Windows-Portable.exe` directly, without installation.
- Run `Clock-Factory-1.2.0-Windows-Setup.exe` to install it, then open **Clock Factory** from the Start menu.

End users do not need Node.js or a development server. SVG files are opened locally, and STL files are saved on the computer. Download names use the app version, so later versions will have a different version number.

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

The **Windows desktop app** GitHub Actions workflow can be run manually from the repository's Actions tab, or by pushing a version tag such as `v1.0.0`. It installs locked dependencies, builds the assets, runs the tests, and packages both downloads in the same Windows job. Download the **Clock-Factory-Windows-x64** artifact from the completed run; it contains the installer, portable app, and `SHA256SUMS.txt`. Creating the workflow does not start a remote build or publish a release.

SVG imports are fitted to their visible artwork, including drawings with large viewBoxes and transformed groups. Preview and STL share the same normalized silhouette; original SVG colors become the selected face color. External resources and executable content are removed. Imports up to 5 MB are saved locally in an eight-file recent library, and the selected artwork and quarter-turn/mirror orientation are restored on reopening. When local storage is unavailable, the current SVG remains usable for the session and is clearly marked as unsaved.

Run `npm run test:svg` for desktop SVG import regressions, including visible preview pixels and STL output. Run `npm run test:svg-library` for saved artwork, drag-and-drop, orientation, restart restoration, removal, and storage-error checks. On display-free Linux, run `npm run build` followed by `npx electron --no-sandbox --ozone-platform=headless --disable-gpu tests/svg-import.electron.cjs`.

Mesh regressions check the serialized STL for closed seams, consistent winding, dimensions, volume, smooth outer curves, and shaft fit. Texture and marker layers are clipped together before meshing, without intersecting duplicate solids.

Upload an SVG by choosing a file or dropping it onto the upload area. The imported-artwork card shows its thumbnail, filename, and save status; use the rotate/flip controls to orient the artwork without rotating the hands. Preview and exported STL share the same transform. Choose a saved thumbnail to reuse it, or Remove to delete that local saved SVG. Reset design keeps the recent library.
