import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as shared from './shared-rp52.mjs';
import * as live from './shared-live-rp133.mjs';
import * as completion from './shared-control-rp134.mjs';

test('live shared runtime keeps all required practice APIs',()=>{
 assert.equal(typeof live.activate,'function');
 assert.equal(typeof completion.control,'function');
 for(const name of ['activate','control','watchClock','watchPortal','checkinFeed','registry','signInCoach','sendCoachPasswordEmail','refreshCoachAuth','ensureCoachAccount'])assert.equal(typeof shared[name],'function',name+' must be exported by the app shared entry');
});

test('shared entry explicitly routes activation and completion to isolated runtimes',async()=>{
 const source=await readFile(new URL('./shared-rp52.mjs',import.meta.url),'utf8');
 assert.match(source,/export \{activate\} from '\.\/shared-live-rp133\.mjs\?v=rp134'/);
 assert.match(source,/export \{control\} from '\.\/shared-control-rp134\.mjs\?v=rp134'/);
});
