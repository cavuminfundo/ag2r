// CDP scripts: capture dropdown/portal content during snapshot
// Extracted from server.js captureSnapshot()

// Captures body-level listbox portals (schedule selector dropdowns)
// Tags interactive elements with scheddlg:100+ indices
export function buildCaptureListboxScript() {
  return `
            (() => {
              for (const child of document.body.children) {
                if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
                const targets = child.id
                  ? Array.from(child.querySelectorAll('[role="listbox"], [role="menu"], [role="dialog"], [data-radix-popper-content-wrapper]'))
                  : [child];
                for (const target of targets) {
                  const role = target.getAttribute('role');
                  const hasItems = target.querySelector('[role="option"], [role="menuitem"], [role="menuitemradio"], button, a') !== null;
                  if ((role === 'listbox' || role === 'menu' || hasItems) && target.getBoundingClientRect().width > 0) {
                    let idx = 0;
                    const tagged = [];
                    target.querySelectorAll('[role="option"], [role="menuitem"], [role="menuitemradio"], button, a').forEach(el => {
                      el.setAttribute('data-ag-click-id', 'scheddlg:' + (100 + idx));
                      el.setAttribute('data-ag-click-label', el.textContent.trim().substring(0, 50));
                      idx++;
                      tagged.push(el);
                    });
                    if (idx === 0) continue;
                    const clone = target.cloneNode(true);
                    tagged.forEach(el => {
                      el.removeAttribute('data-ag-click-id');
                      el.removeAttribute('data-ag-click-label');
                    });
                    return clone.outerHTML;
                  }
                }
              }
              return null;
            })()
`;
}

// Captures kebab context menus (popover/dialog portals from isolated context)
// Tags interactive elements with scheddlg:100+ indices
export function buildCaptureKebabMenuScript() {
  return `
            (() => {
              for (const child of document.body.children) {
                if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
                const text = child.textContent.trim();
                if (!text || text.length > 500) continue;
                const targets = child.id
                  ? Array.from(child.querySelectorAll('[role="dialog"], [role="menu"], [role="listbox"], [data-side]'))
                  : [child];
                for (const target of targets) {
                  const role = target.getAttribute('role');
                  const hasSide = target.hasAttribute('data-side') || target.querySelector('[data-side]');
                  const isPopover = role === 'dialog' || role === 'menu' || role === 'listbox' || hasSide;
                  const hasButtons = target.querySelectorAll('button, [role="menuitem"], [role="menuitemradio"], [role="option"]').length > 0;
                  if (!isPopover && !hasButtons) continue;
                  if (target.getBoundingClientRect().width <= 0) continue;

                  let idx = 0;
                  const tagged = [];
                  target.querySelectorAll('button, [role="menuitem"], [role="menuitemradio"], [role="option"], a').forEach(el => {
                    el.setAttribute('data-ag-click-id', 'scheddlg:' + (100 + idx));
                    el.setAttribute('data-ag-click-label', el.textContent.trim().substring(0, 50));
                    idx++;
                    tagged.push(el);
                  });
                  if (idx === 0) continue;
                  const clone = target.cloneNode(true);
                  tagged.forEach(el => {
                    el.removeAttribute('data-ag-click-id');
                    el.removeAttribute('data-ag-click-label');
                  });
                  return clone.outerHTML;
                }
              }
              return null;
            })()
`;
}
