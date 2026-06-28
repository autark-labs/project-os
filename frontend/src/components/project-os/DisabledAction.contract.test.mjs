import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = process.cwd();

function source(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test('high-friction pages use shared disabled action reasons', () => {
  assert.equal(existsSync(resolve(root, 'src/components/project-os/DisabledAction.tsx')), true);

  const disabledAction = source('src/components/project-os/DisabledAction.tsx');
  const backupsComponents = source('src/pages/BackupsPage/BackupsPage.components.tsx');
  const backupsPage = source('src/pages/BackupsPage/BackupsPage.tsx');
  const privateAccessManager = source('src/pages/NetworkPage/PrivateAccessManager.tsx');

  assert.match(disabledAction, /Tooltip/);
  assert.match(disabledAction, /aria-label/);
  assert.match(disabledAction, /tabIndex=\{0\}/);

  assert.match(backupsComponents, /DisabledAction/);
  assert.match(backupsPage, /DisabledAction/);
  assert.match(privateAccessManager, /DisabledAction/);
});
