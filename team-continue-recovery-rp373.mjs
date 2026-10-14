// Recovery interceptor retired. The native builder flow in app-rpbuild276.mjs already
// handles selected team(s) -> Practice Setup correctly. Keeping this module as a
// harmless no-op avoids stale imports while removing the click interception/reload loop.
try{sessionStorage.removeItem('rp373-team-continue');}catch{}
