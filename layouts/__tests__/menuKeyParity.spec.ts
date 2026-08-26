/**
 * Every `selectedMenuItem` a page passes must be registered in BaseLayout — otherwise the
 * page throws "Menu link key not found" at render time. There are TWO registries
 * (BaseLayout's adminLinks + VALID_TOP_MENU_KEYS, and AdminLayout's sidebar), and history
 * shows keys get added to one but not the other. This test reads the actual source files,
 * so the parity can't silently rot.
 */
import fs from 'fs';
import path from 'path';

// ESM test context — no __dirname; jest runs from the repo root.
const root = process.cwd();

const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

function extractKeys(source: string, pattern: RegExp): Set<string> {
  const keys = new Set<string>();
  for (const match of Array.from(source.matchAll(pattern))) keys.add(match[1]);
  return keys;
}

/** All selectedMenuItem string literals across pages/ (recursive). */
function collectPageMenuKeys(dir: string, found: Map<string, string>) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectPageMenuKeys(full, found);
    else if (/\.tsx?$/.test(entry.name)) {
      const source = fs.readFileSync(full, 'utf8');
      for (const match of Array.from(source.matchAll(/selectedMenuItem=\{?['"]([^'"]+)['"]/g))) {
        found.set(match[1], path.relative(root, full));
      }
    }
  }
}

describe('menu key parity across layouts', () => {
  const baseLayout = read('layouts/BaseLayout.tsx');
  const adminLayout = read('layouts/AdminLayout.tsx');

  const adminLinkKeys = extractKeys(baseLayout, /key: '([^']+)'/g);
  const topMenuKeys = extractKeys(
    baseLayout.slice(baseLayout.indexOf('VALID_TOP_MENU_KEYS'), baseLayout.indexOf('])')),
    /'([^']+)'/g
  );
  const registered = new Set([...Array.from(adminLinkKeys), ...Array.from(topMenuKeys)]);

  it('every selectedMenuItem used by a page is registered in BaseLayout', () => {
    const used = new Map<string, string>();
    collectPageMenuKeys(path.join(root, 'pages'), used);
    const unregistered = Array.from(used.entries())
      .filter(([key]) => !registered.has(key))
      .map(([key, file]) => `${key} (${file})`);
    expect(unregistered).toEqual([]);
  });

  it('every data-science menu button in AdminLayout has a BaseLayout registration', () => {
    const siderKeys = Array.from(extractKeys(adminLayout, /key: '([^']+)'/g)).filter(
      key => key.startsWith('data-science') && !key.endsWith('-group') && key !== 'data-science-advanced'
    );
    const missing = siderKeys.filter(key => !adminLinkKeys.has(key));
    expect(missing).toEqual([]);
  });

  it("every data-science menu button's key is in DATA_SCIENCE_KEYS so the submenu auto-opens", () => {
    const dataScienceKeysBlock = adminLayout.slice(
      adminLayout.indexOf('DATA_SCIENCE_KEYS'),
      adminLayout.indexOf('];', adminLayout.indexOf('DATA_SCIENCE_KEYS'))
    );
    const openerKeys = extractKeys(dataScienceKeysBlock, /'([^']+)'/g);
    const siderBlock = adminLayout.slice(adminLayout.indexOf("key: 'data-science-group'"));
    const buttonKeys = Array.from(extractKeys(siderBlock, /key: '(data-science[^']*)'/g)).filter(
      key => !key.endsWith('-group') && key !== 'data-science-advanced'
    );
    const missing = buttonKeys.filter(key => !openerKeys.has(key));
    expect(missing).toEqual([]);
  });
});
