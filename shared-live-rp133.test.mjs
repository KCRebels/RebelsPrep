import test from 'node:test';
import assert from 'node:assert/strict';
import * as shared from './shared-rp52.mjs';
import * as live from './shared-live-rp133.mjs';
import * as completion from './shared-control-rp134.mjs';

test('live shared runtime keeps all required practice APIs',()=>{
 assert.equal(typeof live.activate,'function');
 assert.equal(typeof completion.control,'function');
 for(const name of ['activate','control','watchClock','watchPortal','checkinFeed','registry','signInCoach','sendCoachPasswordEmail','refreshCoachAuth','ensureCoachAccount'])assert.equal(typeof shared[name],'function',name+' must be exported by the app shared entry');
});

test('shared entry uses isolated activation and booking-aware completion',()=>{
 assert.equal(shared.activate,live.activate);
 assert.equal(shared.control,completion.control);
});
