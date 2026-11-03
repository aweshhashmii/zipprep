ZIPPREP VECTOR MAP UI FIX

This update removes the OpenStreetMap raster tile background from both the India and West Bengal maps. The map is rendered as a clean, built-in vector layer inside the ZipPrep UI, using clickable GeoJSON administrative boundaries. The India state boundary loader first tries the open GeoJSON dataset and falls back to geoBoundaries.

Deployment:
1. Back up your current index.html.
2. Upload this index.html to the root of your GitHub Pages repository, replacing the existing index.html.
3. Commit to main and wait for GitHub Pages to publish.
4. Keep notes.html, pyqs.html, bundle-notes.html and all other assets unchanged.

Note: The GeoJSON boundary data is still loaded over the internet. This removes the third-party map tile imagery, but does not bundle all geographical data offline. West Bengal district data still depends on the geoBoundaries source and may display an error if that source is unavailable.
