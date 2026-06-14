// Resolves a root-relative path (e.g. '/audio/foo.wav') against the app's
// configured base URL, so it works whether the app is served from a domain
// root or a subpath (e.g. a GitHub Pages project site).
export const assetPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
