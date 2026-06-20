import assert from 'node:assert/strict';
import test from 'node:test';
import { tailscaleSetupGuidance } from './NetworkPage.tailscaleSetup.js';

test('asks users to sign in when Tailscale is installed but disconnected', () => {
  const guidance = tailscaleSetupGuidance({ installed: true, connected: false, message: 'Needs login' });

  assert.equal(guidance.goodState, false);
  assert.equal(guidance.tone, 'amber');
  assert.match(guidance.title, /Sign in/);
});

test('reports connected Tailscale account clearly', () => {
  const guidance = tailscaleSetupGuidance({ installed: true, connected: true, loginName: 'jack@example.com', dnsName: 'project.tail.ts.net' });

  assert.equal(guidance.goodState, true);
  assert.match(guidance.summary, /jack@example.com/);
  assert.match(guidance.action, /project.tail.ts.net/);
});
