# Kenney model assets

The bridge template expects 26 CC0 Kenney `.glb` files in this directory. They are not bundled in this repository because the original checkout did not include their source archive or provenance metadata.

Use models obtained from the official [Kenney asset library](https://kenney.nl/assets) and keep their original filenames. Run `npm run check:runtime` to print the exact missing paths.

Do not substitute unrelated models silently: scale, material names, silhouettes, sight-line culling, and recolouring in `templates/bridge/build.ts` depend on the expected Kenney models.
