import test from 'node:test';
import assert from 'node:assert/strict';
import * as shared from './shared-rp52.mjs';
import * as live from './shared-live-rp133.mjs';

test('live shared runtime keeps all required practice APIs',()=>{
 for(const name of ['activate','control'])assert.equal(typeof live[name],'function',name+' must be exported by the live runtime');
 for(const name of ['activate','control','watchClock','watchPortal','checkinFeed','registry','signInCoach','sendCoachPasswordEmail','refreshCoachAuth','ensureCoachAccount'])assert.equal(typeof shared[name],'function',name+' must be exported by the app shared entry');
});

test('live activation is the shared entry activation',()=>{
 assert.equal(shared.activate,live.activate);
 assert.equal(shared.control,live.control);
});
