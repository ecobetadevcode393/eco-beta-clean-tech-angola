/**
 * The faces the app's own overlays wear.
 *
 * Both the account screen and the recycling screen are drawn over the hero, so they have to
 * look like they belong to the page instead of like browser-default overlays. The authored
 * page only ships one face — Lexend, inside `public/landing-pages/inner-green-assets/` — and
 * that is the file declared here, resolved under the deployment subpath exactly the way
 * `SYLVA_HERO_BASE_URL` does it for the frame.
 *
 * It lives in its own module because the two screens must ask for the same face: a second
 * `@font-face` with the same source is the one reliable way to keep the second overlay from
 * falling back to a system font before the first one has loaded.
 */

/** Deployment subpath, needed by every URL this module points at. See next.config.ts. */
const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * The hero's own face. It is the exact file the hero frame has already loaded, so the
 * browser answers from cache rather than fetching the face a second time.
 */
export const ECOBETA_FACE_STYLE = `@font-face{font-family:'Lexend';font-style:normal;font-weight:100 900;font-display:swap;src:url('${PUBLIC_BASE_PATH}/landing-pages/inner-green-assets/lexend-latin.woff2') format('woff2');}`;

/** The hero's face stack: what the account screen and the rest of the app chrome use. */
export const ECOBETA_FACE_STACK = "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/**
 * The recycling screen's stack. Its design calls for Sen, which the site does not bundle, so
 * it is asked for first — an installed copy wins — and Lexend is the fallback, which keeps the
 * screen on the same material as the hero rather than on a browser default if Sen is absent.
 */
export const ECOBETA_RECYCLING_FACE_STACK =
  "'Sen', 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
