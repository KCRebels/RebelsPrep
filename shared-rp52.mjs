// Compatibility entry point for the current RebelsPrep app.
// Keep one canonical shared-practice implementation so auth, activation,
// concurrency, check-in, and portal behavior cannot drift between bundles.
export * from './shared.mjs?v=rp129';
