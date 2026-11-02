import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shapePath,designs } from './geometry.js';
test('all preset outlines are closed SVG paths',()=>{for(const d of designs){const p=shapePath(d.id);assert.ok(p.startsWith('M'));assert.ok(p.endsWith('Z'));assert.ok(!p.includes('NaN'));}});
