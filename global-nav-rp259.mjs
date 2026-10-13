// Build 349: legacy global Start Over disabled.
// The native builder and the dedicated Teams-page navigation module own Start Over now.
// Keeping this file as a no-op prevents duplicate controls, capture-phase click interception,
// and DOM churn from the old global nav recreation loop.
document.getElementById('rp-global-nav')?.remove();
