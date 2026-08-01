import { TAG_INTERACTIVES_FN } from './_shared.js';

export const CAPTURE_SCRIPT = `
(async () => {
  ${TAG_INTERACTIVES_FN}

  // -- 1. Find the chat container --
  // First try the normal chat container
  let container =
    document.querySelector('.scrollbar-hide[class*="overflow-y-auto"]') ||
    document.querySelector('[data-testid="conversation-view"]') ||
    document.getElementById('conversation') ||
    document.getElementById('chat') ||
    document.getElementById('cascade');

  // Detect "new session" page: either the scrollbar-hide container has zero height,
  // or no container was found at all (AG removes it from DOM when switching views).
  // In both cases, capture the new session page content area instead.
  let isNewSessionPage = false;
  if (!container || container.clientHeight === 0) {
    const inputBox = document.getElementById('antigravity.agentSidePanelInputBox');
    if (inputBox) {
      // Walk up from inputBox to find the new session page root.
      // It has class "animate-fade-in" and contains the full session setup UI.
      let newSessionRoot = inputBox;
      for (let i = 0; i < 10; i++) {
        if (!newSessionRoot.parentElement) break;
        newSessionRoot = newSessionRoot.parentElement;
        const cls = newSessionRoot.className?.toString() || '';
        if (cls.includes('animate-fade-in')) break;
      }
      container = newSessionRoot;
      isNewSessionPage = true;
    }
  }

  if (!container) return null;

  // -- 2. Detect if agent is generating --
  const stopBtn =
    document.querySelector('[data-tooltip-id="input-send-button-cancel-tooltip"]') ||
    document.querySelector('button svg.lucide-square')?.closest('button');
  const agentRunning = !!(stopBtn && stopBtn.offsetParent !== null);

  // -- 3. Scroll info --
  const scrollInfo = {
    scrollTop: container.scrollTop,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
  };

  // -- 4. Mark positioned elements + tag chat interactives --
  const marked = [];
  container.querySelectorAll('*').forEach(el => {
    try {
      const cls = (el.className || '').toString();
      const role = el.getAttribute('role');
      const isToast = el.hasAttribute('data-radix-toast-list') || 
                      el.hasAttribute('data-sonner-toaster') ||
                      role === 'status' || role === 'alert' ||
                      cls.includes('toast') || cls.includes('sonner');
      
      if (isToast) {
        el.setAttribute('data-ag-toast', '1');
        marked.push(el);
      }
      
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') {
        if (!isToast) {
          el.setAttribute('data-ag-remove', '1');
          marked.push(el);
        }
      }
      if (cs.position === 'sticky') {
        el.setAttribute('data-ag-sticky', '1');
        marked.push(el);
      }
    } catch {}
  });
  const chatTagged = tagInteractives(container, 'chat', false, true, 80);

  // -- 5. Clone chat container --
  const clone = container.cloneNode(true);

  // -- 6. Unmark originals --
  marked.forEach(el => {
    el.removeAttribute('data-ag-remove');
    el.removeAttribute('data-ag-sticky');
  });
  untagAll(chatTagged);

  // -- 7. Clean clone: capture queue/tasks but remove MAIN editor --
  if (!isNewSessionPage) {
    const realInputBox = document.getElementById('antigravity.agentSidePanelInputBox');
    if (realInputBox && !container.contains(realInputBox)) {
      // Tag interactives on the live DOM first so coordinates work
      const queueTagged = tagInteractives(realInputBox, 'queue', false, true);
      const boxClone = realInputBox.cloneNode(true);
      untagAll(queueTagged);
      
      // Nuke ONLY the text editor/form so we don't see the desktop input box
      // In Antigravity, the text input is wrapped in a .bg-card, while queue is in a sibling div
      const bgCard = boxClone.querySelector('.bg-card');
      if (bgCard) {
        bgCard.remove();
      } else {
        // Fallback if .bg-card not found: just remove the editor itself
        const editor = boxClone.querySelector('[contenteditable="true"], [data-lexical-editor], [role="textbox"], form');
        if (editor) editor.remove();
      }
      
      // Make the wrapper float at the bottom (above mobile input) and invisible so it doesn't block clicks
      boxClone.style.position = 'fixed';
      boxClone.style.bottom = '80px';
      boxClone.style.left = '16px';
      boxClone.style.right = '16px';
      boxClone.style.zIndex = '9000';
      boxClone.style.background = 'transparent';
      boxClone.style.border = 'none';
      boxClone.style.padding = '0';
      boxClone.style.margin = '0';
      boxClone.style.minHeight = '0';
      boxClone.style.boxShadow = 'none';
      boxClone.style.pointerEvents = 'none'; // wrapper shouldn't block clicks on chat behind it
      
      // Let children (pills/tasks) receive clicks
      Array.from(boxClone.children).forEach(child => {
        child.style.pointerEvents = 'auto';
      });
      
      clone.appendChild(boxClone);
    }
  }

  // -- 8. Remove fixed/absolute overlays (protect action bars) --
  clone.querySelectorAll('[data-ag-remove]').forEach(el => {
    let isActionBar = false;
    el.querySelectorAll('button, [role="button"]').forEach(b => {
      const label = b.textContent?.trim() || b.getAttribute('aria-label') || '';
      if (/^(Allow|Deny|Review|Run|Confirm|Undo)/i.test(label)) isActionBar = true;
    });
    if (!isActionBar) el.remove();
    else el.removeAttribute('data-ag-remove');
  });

  // -- 8.5 Ensure Toasts inside chat container are visible --
  clone.querySelectorAll('[data-ag-toast="1"]').forEach(el => {
    el.removeAttribute('data-ag-toast');
    el.classList.remove('opacity-0', 'invisible');
    el.classList.add('opacity-100', 'visible');
    el.style.opacity = '1';
    el.style.visibility = 'visible';
    el.style.zIndex = '9999';
    if (el.style.position === 'fixed') {
      el.style.bottom = '120px'; // force above ag2r input bar
    }
  });

  // -- 9. Force sticky backgrounds --
  clone.querySelectorAll('[data-ag-sticky]').forEach(el => {
    el.style.backgroundColor = '#101010';
  });

  // -- 10. Fix inline div-inside-span/p --
  clone.querySelectorAll('span > div, p > div').forEach(div => {
    const span = document.createElement('span');
    span.innerHTML = div.innerHTML;
    span.style.display = 'inline-flex';
    span.style.alignItems = 'center';
    for (const attr of div.attributes) {
      if (attr.name !== 'style') span.setAttribute(attr.name, attr.value);
    }
    div.replaceWith(span);
  });

  // -- 11. Force paragraph display block --
  clone.querySelectorAll('p').forEach(p => { p.style.display = 'block'; });

  // -- 11.5 Capture Toasts/Snackbars from body --
  document.body.querySelectorAll('ol[role="region"], ul[role="region"], [role="status"], [role="alert"], [data-sonner-toaster], [data-radix-toast-list]').forEach(toast => {
    // Only capture actual toasts that are outside the chat container and visible
    const isToast = toast.hasAttribute('data-radix-toast-list') || 
                    toast.hasAttribute('data-sonner-toaster') ||
                    toast.getAttribute('role') === 'status' || 
                    toast.getAttribute('role') === 'alert' ||
                    toast.className.includes('fixed') ||
                    toast.className.includes('toast') ||
                    toast.className.includes('sonner');
    if (isToast && !container.contains(toast) && toast.textContent.trim().length > 0 && toast.offsetParent !== null) {
      const toastClone = toast.cloneNode(true);
      // Force position so it appears at the bottom of the chat view
      toastClone.style.position = 'fixed';
      toastClone.style.bottom = '120px';
      toastClone.style.left = '50%';
      toastClone.style.transform = 'translateX(-50%)';
      toastClone.style.zIndex = '9999';
      toastClone.style.width = 'max-content';
      toastClone.style.maxWidth = '90%';
      toastClone.style.pointerEvents = 'none';
      toastClone.style.opacity = '1';
      toastClone.style.visibility = 'visible';
      toastClone.classList.remove('opacity-0', 'invisible');
      toastClone.classList.add('opacity-100', 'visible');
      toastClone.querySelectorAll('.opacity-0, .invisible').forEach(t => {
        t.classList.remove('opacity-0', 'invisible');
        t.classList.add('opacity-100', 'visible');
        t.style.opacity = '1';
        t.style.visibility = 'visible';
      });
      clone.appendChild(toastClone);
    }
  });

  // -- 11.6 Extract Remote Editor Text --
  let editorText = '';
  const editorCandidates = document.querySelectorAll(
    '[data-lexical-editor="true"], [contenteditable="true"][role="textbox"], [contenteditable="true"]'
  );
  let activeEditor = null;
  for (const el of editorCandidates) {
    if (el.offsetParent !== null) activeEditor = el;
  }
  if (activeEditor) {
    editorText = activeEditor.innerText || activeEditor.textContent || '';
  }

  // -- 12. Get chat HTML + strip [object Object] --
  let html = clone.innerHTML;
  html = html.replace(/class="([^"]*)"/g, (match, classes) => {
    if (!classes.includes('[object Object]')) return match;
    const cleaned = classes.replace(/\\[object Object\\]/g, '').replace(/\\s+/g, ' ').trim();
    return 'class="' + cleaned + '"';
  });

  // -- 13. Collect CSS --
  let css = '';
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) { css += rule.cssText + '\\n'; }
    } catch {}
  }

  // -- 13b. Extract ALL CSS custom properties from DOM --
  // AG defines theme vars on DOM elements (not in stylesheets). Instead of a
  // hardcoded list, enumerate every --* property so diff colors, chart colors,
  // and any future vars are captured automatically.
  const rootStyle = getComputedStyle(document.documentElement);
  const bodyStyle = document.body ? getComputedStyle(document.body) : null;
  const themeRules = [];
  const seen = new Set();
  for (const source of [rootStyle, bodyStyle]) {
    if (!source) continue;
    for (const name of source) {
      if (name.startsWith('--') && !seen.has(name)) {
        const val = source.getPropertyValue(name).trim();
        if (val) {
          themeRules.push(name + ':' + val);
          seen.add(name);
        }
      }
    }
  }
  if (themeRules.length > 0) {
    css = ':root{' + themeRules.join(';') + '}\\n' + css;
  }

  // -- 14. Capture LEFT sidebar (bg-sidebar) --
  let leftSidebarHtml = null;
  let sidebarAttentionItems = [];
  try {
    let leftRoot = null;
    const sidebars = document.querySelectorAll('.bg-sidebar');
    for (const el of sidebars) {
      const r = el.getBoundingClientRect();
      if (r.height > 200) {
        leftRoot = el;
        break;
      }
    }
    if (leftRoot && leftRoot.offsetParent !== null) {
      const leftTagged = tagInteractives(leftRoot, 'left', true, true);
      const leftClone = leftRoot.cloneNode(true);
      // Make group-hover icons (like the New Conversation "+" button) always visible on mobile
      leftClone.querySelectorAll('.opacity-0, .invisible').forEach(el => {
        el.classList.remove('opacity-0', 'invisible');
        el.classList.add('opacity-100', 'visible');
      });
      untagAll(leftTagged);
      leftSidebarHtml = leftClone.outerHTML;
      // Extract conversation IDs that need attention, classified by type.
      // AG uses different status indicators in the sidebar:
      //   - SVG icon + animate-unread-ping → agent needs intervention (e.g., command permission)
      //   - Simple CSS dot (no SVG) → agent just finished (no intervention needed)
      // Each ping dot is inside a sidebar item whose descendant has data-testid="convo-pill-<uuid>"
      const seenIds = new Set();
      leftRoot.querySelectorAll('.animate-unread-ping').forEach(ping => {
        // Walk up to the sidebar item (role="button"), then find the convo-pill testid
        let el = ping;
        for (let i = 0; i < 10 && el; i++) {
          const pill = el.querySelector('[data-testid^="convo-pill-"]');
          if (pill) {
            const id = pill.getAttribute('data-testid').replace('convo-pill-', '');
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              // Classify attention type by checking for SVG icon near the ping.
              // The ping lives inside a status container (group-hover:invisible div).
              // AG uses Lucide SVG icons to indicate why the agent is blocked:
              //   - lucide-terminal* → command needs approval
              //   - lucide-message* → agent has a question
              //   - other SVG       → generic attention (fallback)
              //   - no SVG          → agent just finished (completed)
              let statusContainer = ping;
              for (let j = 0; j < 5 && statusContainer; j++) {
                if ((statusContainer.getAttribute('class') || '').includes('group-hover:invisible')) break;
                statusContainer = statusContainer.parentElement;
              }
              const svgEl = statusContainer ? statusContainer.querySelector('svg') : null;
              let type = 'completed';
              if (svgEl) {
                // Positively identify the question icon by its Material Symbols path data.
                // Everything else with an SVG defaults to command.
                const pathD = (svgEl.querySelector('path')?.getAttribute('d') || '');
                const QUESTION_ICON_PATH = 'M477.92-295.77q17.15,0 28.96-11.81t11.81-28.96T506.88-365.5t-28.96-11.81T448.96-365.5t-11.81,28.96t11.81,28.96t28.96,11.81ZM449.62-439h56.31q0.38-15.08 2.08-25.92T514.69-486t12.69-19.73t20.54-22.35q31.92-31.92 45.65-54.27t13.73-50.81q0-49.92-34.08-80.5t-87.77-30.58q-48.85,0-83.5,24.88t-49.27,64.81l51.38,20.61q8.54-25.46 28.38-41.58t49.77-16.12q32.39,0 50.58,17.58T551-631.31q0,18.54-11,36.38t-33.92,38.54q-15.85,14-26.35,27.12t-17.5,26.96t-9.81,28.81T449.62-439ZM480-68.46L368.46-180H212.31Q182-180 161-201t-21-51.31V-787.69Q140-818 161-839t51.31-21H747.69Q778-860 799-839t21,51.31v535.38Q820-222 799-201t-51.31,21H591.54L480-68.46ZM212.31-240H392.77L480-152.77L567.23-240H747.69q5.39,0 8.85-3.46t3.46-8.85V-787.69q0-5.39-3.46-8.85T747.69-800H212.31q-5.39,0-8.85,3.46T200-787.69v535.38q0,5.39 3.46,8.85t8.85,3.46ZM480-520Z';
                type = (pathD === QUESTION_ICON_PATH) ? 'question' : 'command';
              }
              // Extract conversation name from the sidebar item text
              let name = '';
              let nameEl = ping;
              for (let k = 0; k < 10 && nameEl; k++) {
                if (nameEl.getAttribute('role') === 'button') {
                  name = (nameEl.textContent || '').trim();
                  break;
                }
                nameEl = nameEl.parentElement;
              }
              sidebarAttentionItems.push({ id, type, name });
            }
            break;
          }
          el = el.parentElement;
        }
      });
    }
  } catch (e) {
    console.debug('[AG2R] Left sidebar capture error:', e.message);
  }

  // -- 15. Sidebar signature (lightweight change detection for right sidebar) --
  // Instead of cloning the entire right sidebar DOM every poll (can be 100KB+),
  // capture a ~50 byte signature: tab IDs + which tab is active.
  // The full sidebar HTML is fetched on-demand via GET /right-sidebar.
  let sidebarSignature = null;
  try {
    const tabBtns = document.querySelectorAll('[data-tab-id]');
    if (tabBtns.length > 0) {
      const tabs = [];
      for (const b of tabBtns) {
        const id = b.getAttribute('data-tab-id');
        const active = (b.className || '').includes('bg-secondary') ? '*' : '';
        tabs.push(id + active);
      }
      sidebarSignature = tabs.join(',');
    }
  } catch (e) {
    console.debug('[AG2R] Sidebar signature error:', e.message);
  }
  // Sidebar open state: AG wraps the sidebar in a collapse container with inline styles:
  //   closed: style="width: 0%; visibility: hidden; overflow: hidden"
  //   open:   style="width: ~47%; visibility: visible; overflow: hidden"
  // Check the collapse container's inline style.width (instant, not affected by
  // CSS transitions) instead of getBoundingClientRect (which reflects animated
  // position and is fragile across different window sizes).
  const firstTab = document.querySelector('[data-tab-id]');
  let isSidebarOpen = false;
  if (firstTab) {
    let el = firstTab;
    let foundCollapse = false;
    for (let i = 0; i < 20 && el; i++) {
      el = el.parentElement;
      if (!el) break;
      const s = getComputedStyle(el);
      if (s.overflow === 'hidden' || s.overflowX === 'hidden') {
        const r = el.getBoundingClientRect();
        // Skip small containers (e.g. the tab button itself has overflow:hidden)
        if (r.height > 100) {
          // Found the collapse container — check inline style, not computed.
          // Inline style.width changes instantly on toggle; computed style
          // reflects the animated/transitioning value.
          const inlineWidth = el.style.width;
          isSidebarOpen = inlineWidth !== '0%' && inlineWidth !== '0px' && inlineWidth !== '';
          foundCollapse = true;
          break;
        }
      }
    }
    if (!foundCollapse) {
      // No collapse container = sidebar is fully visible (no wrapper)
      isSidebarOpen = true;
    }
  }
  console.debug('[SidebarMirror:capture] isSidebarOpen:', isSidebarOpen, 'tab:', firstTab ? 'exists' : 'null');
  // -- 8. Capture portal elements (dropdowns, dialogs) from body --
  // AG renders these outside #root as direct body children.
  let dropdownHtml = null;
  let dialogHtml = null;
  let settingsHtml = null;
  try {
    for (const child of document.body.children) {
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
      const text = child.textContent.trim();
      if (!text) continue;

      // The target element for portal detection: either the child itself,
      // or a nested portal inside an ID-wrapped Radix container (div#radix-:rXX:).
      // Radix wraps portals in ID'd divs — we need to look inside them.
      const targets = child.id
        ? Array.from(child.querySelectorAll('[role="dialog"], [role="listbox"]'))
        : [child];

      for (const target of targets) {
        // Dropdown menu (role="listbox")
        if (!dropdownHtml && target.getAttribute('role') === 'listbox') {
          const tagged = tagInteractives(target, 'dropdown', true, false);
          const clone = target.cloneNode(true);
          untagAll(tagged);
          dropdownHtml = clone.outerHTML;
        }

        // Dialog/modal (fixed overlay with buttons) or Popover dialog (role="dialog")
        const cls = (target.className || '').toString();
        const isFixedInset = cls.includes('fixed') && cls.includes('inset-0');
        const isDialogRole = target.getAttribute('role') === 'dialog';
        
        if (isFixedInset || isDialogRole) {
          // Identify if it's a large settings/preferences modal
          // Check both inner elements and the target itself
          const isLargeModal = target.querySelector('[class*="max-w-4xl"], [class*="max-w-5xl"], [class*="max-w-6xl"], [role="tablist"]') || 
                               cls.includes('max-w-4xl') || cls.includes('max-w-5xl') || cls.includes('max-w-6xl');
          
          if (isLargeModal) {
            if (!settingsHtml) {
              const settingsCard = target.querySelector('[class*="max-w-4xl"], [class*="max-w-5xl"], [class*="max-w-6xl"], [class*="rounded-2xl"]') || target;
              const tagged = tagInteractives(settingsCard, 'settings', true, false);
              const clone = settingsCard.cloneNode(true);
              untagAll(tagged);
              clone.querySelectorAll('style').forEach(s => s.remove());
              settingsHtml = clone.outerHTML;
            }
          } else if (!dialogHtml) {
            const tagged = tagInteractives(target, 'dialog', true, false);
            const clone = target.cloneNode(true);
            untagAll(tagged);
            clone.querySelectorAll('style').forEach(s => s.remove());
            dialogHtml = clone.outerHTML;
          }
        }
      }
    }


  } catch (e) {
    console.debug('[AG2R] Portal capture error:', e.message);
  }

  // -- 8b. Capture Settings modal (fallback if rendered inside #root, not body) --
  if (!settingsHtml) {
  try {
    const settingsOverlay = document.querySelector('#root .fixed.inset-0[class*="z-[5000]"]');
    if (settingsOverlay && settingsOverlay.getBoundingClientRect().width > 0) {
      // Find the settings content container inside the overlay
      const settingsCard = settingsOverlay.querySelector('[class*="max-w-5xl"]') ||
                           settingsOverlay.querySelector('[class*="rounded-2xl"]');
      if (settingsCard) {
        const tagged = tagInteractives(settingsCard, 'settings', true, false);
        const clone = settingsCard.cloneNode(true);
        untagAll(tagged);
        clone.querySelectorAll('style').forEach(s => s.remove());
        settingsHtml = clone.outerHTML;
      }
    }
  } catch (e) {
    console.debug('[AG2R] Settings capture error:', e.message);
  }
  }

  // -- 9. Detect active tab URI for commenting --
  // Active tab has 'bg-secondary' class; inactive tabs don't.
  // Supports both artifact tabs (artifact__xxx) and code diff file tabs.
  let activeArtifactUri = null;
  let activeFileUri = null;
  try {
    const activeTab = document.querySelector('[data-tab-id].bg-secondary');
    if (activeTab) {
      const tabId = activeTab.getAttribute('data-tab-id');
      // Skip structural tabs — not commentable content
      if (tabId !== 'overview' && tabId !== 'review') {
        if (tabId.startsWith('artifact__')) {
          activeArtifactUri = tabId.replace('artifact__', '');
        } else {
          activeFileUri = tabId;
        }
      }
    }
  } catch (e) {
    console.debug('[AG2R] Active tab detection error:', e.message);
  }

  // -- 10. Detect and capture ask_question modal --
  // The ask_question widget is rendered inline in the chat (inside #root) as a card
  // with a radiogroup + Submit/Skip buttons. It has no role="dialog" or fixed overlay.
  // Detect via Submit+Skip buttons and walk up to the card wrapper.
  let askQuestionHtml = null;
  let askQuestionContainer = null; // Used to guard permission capture below
  try {
    const allBtns = Array.from(document.querySelectorAll('button'));
    const skipBtn = allBtns.find(b => b.textContent.trim() === 'Skip');
    const submitBtn = allBtns.find(b => /^Submit/.test(b.textContent.trim()));
    if (skipBtn && submitBtn) {
      // Walk up from Skip button to find the container that also has Submit
      let container = skipBtn;
      for (let i = 0; i < 20 && container.parentElement; i++) {
        container = container.parentElement;
        if (container.contains(submitBtn)) break;
      }
      // Walk up to the card border wrapper (rounded-2xl bg-card-border)
      let cardRoot = container;
      for (let i = 0; i < 5 && cardRoot.parentElement; i++) {
        const cls = (cardRoot.className || '').toString();
        if (cls.includes('bg-card-border')) break;
        cardRoot = cardRoot.parentElement;
      }
      askQuestionContainer = cardRoot;
      // Tag interactive elements: radio/checkbox labels and buttons
      let askIdx = 0;
      const askTagged = [];
      cardRoot.querySelectorAll('[role="radiogroup"] label, [role="group"] label').forEach(el => {
        el.setAttribute('data-ag-click-id', 'ask:' + askIdx);
        el.setAttribute('data-ag-click-label', (el.textContent || '').trim().substring(0, 50));
        askIdx++;
        askTagged.push(el);
      });
      cardRoot.querySelectorAll('button').forEach(el => {
        el.setAttribute('data-ag-click-id', 'ask:' + askIdx);
        el.setAttribute('data-ag-click-label', (el.textContent || '').trim().substring(0, 50));
        askIdx++;
        askTagged.push(el);
      });
      const askClone = cardRoot.cloneNode(true);
      askTagged.forEach(el => {
        el.removeAttribute('data-ag-click-id');
        el.removeAttribute('data-ag-click-label');
      });
      askClone.querySelectorAll('style').forEach(s => s.remove());
      askQuestionHtml = askClone.outerHTML;
    }
  } catch (e) {
    console.debug('[AG2R] Ask question capture error:', e.message);
  }

  // -- 11. Detect and capture permission/approval banner --
  let permissionHtml = null;
  try {
    const radioGroup = document.querySelector('[role="radiogroup"]');
    // Guard: skip if the radiogroup belongs to an ask_question widget (already captured above)
    if (radioGroup && !(askQuestionContainer && askQuestionContainer.contains(radioGroup))) {
      // Walk up to find the full banner container
      let banner = radioGroup;
      for (let i = 0; i < 10; i++) {
        if (!banner.parentElement || banner.parentElement === document.body) break;
        banner = banner.parentElement;
        if (/allow|permission/i.test(banner.textContent) && banner.querySelectorAll('button').length >= 1) break;
      }
      // Tag interactive elements: radio labels and buttons
      let permIdx = 0;
      const permTagged = [];
      banner.querySelectorAll('[role="radiogroup"] label').forEach(el => {
        el.setAttribute('data-ag-click-id', 'perm:' + permIdx);
        el.setAttribute('data-ag-click-label', (el.textContent || '').trim().substring(0, 50));
        permIdx++;
        permTagged.push(el);
      });
      banner.querySelectorAll('button').forEach(el => {
        el.setAttribute('data-ag-click-id', 'perm:' + permIdx);
        el.setAttribute('data-ag-click-label', (el.textContent || '').trim().substring(0, 50));
        permIdx++;
        permTagged.push(el);
      });
      const permClone = banner.cloneNode(true);
      permTagged.forEach(el => {
        el.removeAttribute('data-ag-click-id');
        el.removeAttribute('data-ag-click-label');
      });
      permissionHtml = permClone.outerHTML;
    }
  } catch (e) {
    console.debug('[AG2R] Permission banner capture error:', e.message);
  }

  // -- 12. Extract environment/worktree and branch from new session bottom bar --
  // The environment button (aria-label="Select Environment") shows "Local" or "New Worktree" or a worktree name.
  // The branch button (aria-label="Select Default Branch") shows the branch name and only appears in worktree mode.
  let environmentName = null;
  let branchName = null;
  try {
    const envBtn = document.querySelector('[aria-label="Select Environment"]');
    if (envBtn) {
      const span = envBtn.querySelector('span');
      environmentName = span ? span.textContent.trim() : (envBtn.textContent || '').trim();
    }
    const branchBtn = document.querySelector('[aria-label="Select Default Branch"]');
    if (branchBtn) {
      const span = branchBtn.querySelector('span');
      branchName = span ? span.textContent.trim() : (branchBtn.textContent || '').trim();
    }
  } catch (e) {
    console.debug('[AG2R] Environment/branch extraction error:', e.message);
  }

  // -- 13. Extract model name from model selector button --
  let modelName = null;
  try {
    const modelBtn = document.querySelector('[aria-label*="Select model"]');
    if (modelBtn) {
      const span = modelBtn.querySelector('span');
      modelName = span ? span.textContent.trim() : (modelBtn.textContent || '').trim();
    }
  } catch (e) {
    console.debug('[AG2R] Model name extraction error:', e.message);
  }

  // -- 14. Detect subagent view --
  // Two independent signals, both required to confirm subagent view:
  // -- 14a. Subagent view detection --
  // Two independent heuristics:
  //   1. isInputBoxHidden: AG's input box is missing or invisible → hide AG2R's text box
  //   2. isSubagentView: "Cannot send" text found → show yellow border + subagent banner
  let isInputBoxHidden = false;
  let isSubagentView = false;
  let parentConversationName = '';
  try {
    const inputBox = document.getElementById('antigravity.agentSidePanelInputBox');
    if (!inputBox) {
      isInputBoxHidden = !isNewSessionPage && !!container;
    } else {
      // Input box exists in DOM — check if it's actually visible
      isInputBoxHidden = inputBox.offsetParent === null || inputBox.getBoundingClientRect().height === 0;
    }

    // "Cannot send" detection: search for short-text elements that aren't inside
    // the chat container. The "Cannot send message" label is a small UI element,
    // not a chat message (which would be long and inside the scrollable container).
    if (isInputBoxHidden) {
      const candidates = document.querySelectorAll('div, span, p');
      for (const el of candidates) {
        if (container && container.contains(el)) continue; // skip chat content
        const txt = (el.textContent || '').trim();
        if (txt.length > 5 && txt.length < 100 &&
            (txt.toLowerCase().includes('cannot send') || txt.toLowerCase().includes('cannot prompt'))) {
          isSubagentView = true;
          break;
        }
      }
    }

    // Breadcrumb: extract parent conversation name from navigation bar above container
    if (isSubagentView && container) {
      const cvParent = container.parentElement;
      if (cvParent) {
        for (const child of cvParent.children) {
          if (child === container) break;
          const rect = child.getBoundingClientRect();
          if (rect.height > 8 && rect.height < 80) {
            const text = child.textContent.trim();
            if (text.length > 0 && text.length < 300) {
              const parts = text.split(/[/›>]/).map(s => s.trim()).filter(Boolean);
              if (parts.length >= 2) {
                parentConversationName = parts[parts.length - 2];
              } else {
                parentConversationName = parts[0] || text;
              }
              break;
            }
          }
        }
      }
    }
    console.debug('[SubagentDetect] inputBox:', inputBox ? 'exists' : 'null', 'isInputBoxHidden:', isInputBoxHidden, 'isSubagentView:', isSubagentView);
  } catch (e) {
    console.debug('[AG2R] Subagent detection error:', e.message);
  }

  // -- 14b. Capture subagent info panel --
  // When in subagent view, AG renders a "cannot prompt subagents" message and
  // "Open overview" button somewhere in the page. Search for it and capture.
  let subagentInfoHtml = null;
  if (isSubagentView) {
    try {
      // Find the narrowest container with "cannot prompt" or "open overview" text
      const allDivs = document.querySelectorAll('div');
      let infoPanel = null;
      for (const div of allDivs) {
        const txt = div.textContent.trim().toLowerCase();
        if ((txt.includes('cannot') && txt.includes('prompt')) || 
            (txt.includes('open') && txt.includes('overview'))) {
          // Prefer the narrowest (most specific) container
          if (!infoPanel || (infoPanel.contains(div) && div !== infoPanel)) {
            infoPanel = div;
          }
        }
      }
      if (infoPanel) {
        // Tag interactive elements for click proxying
        let subIdx = 0;
        const subTagged = [];
        infoPanel.querySelectorAll('button, a, [role="button"]').forEach(el => {
          el.setAttribute('data-ag-click-id', 'subinfo:' + subIdx);
          el.setAttribute('data-ag-click-label', (el.textContent || '').trim().substring(0, 80));
          subIdx++;
          subTagged.push(el);
        });
        const subClone = infoPanel.cloneNode(true);
        subTagged.forEach(el => {
          el.removeAttribute('data-ag-click-id');
          el.removeAttribute('data-ag-click-label');
        });
        subagentInfoHtml = subClone.outerHTML;
      }
    } catch (e) {
      console.debug('[AG2R] Subagent info capture error:', e.message);
    }
  }

  // -- 12. Detect and capture /btw side question box --
  let btwHtml = null;
  try {
    const span = Array.from(document.querySelectorAll('span')).find(s => s.textContent.trim().startsWith('Side Question'));
    if (span) {
      let container = span;
      for (let i = 0; i < 5 && container; i++) {
        const cls = (container.className || '').toString();
        if (cls.includes('border-border') && cls.includes('rounded-md')) {
          break;
        }
        container = container.parentElement;
      }
      if (container) {
        let btwIdx = 0;
        const btwTagged = [];
        container.querySelectorAll('button, a, [role="button"]').forEach(el => {
          if (el.closest('#antigravity\\.agentSidePanelInputBox') || el.closest('[class*="bg-card-border"]')) return;
          el.setAttribute('data-ag-click-id', 'btw:' + btwIdx);
          el.setAttribute('data-ag-click-label', (el.textContent || '').trim().substring(0, 50));
          btwIdx++;
          btwTagged.push(el);
        });
        const btwClone = container.cloneNode(true);
        const inputWrapper = btwClone.querySelector('#antigravity\\.agentSidePanelInputBox') || btwClone.querySelector('[class*="bg-card-border"]');
        if (inputWrapper) {
          inputWrapper.remove();
        }
        btwTagged.forEach(el => {
          el.removeAttribute('data-ag-click-id');
          el.removeAttribute('data-ag-click-label');
        });
        btwClone.querySelectorAll('style').forEach(s => s.remove());
        btwHtml = btwClone.outerHTML;
      }
    }
  } catch (e) {
    console.debug('[AG2R] BTW capture error:', e.message);
  }

  return { html, css, agentRunning, scrollInfo, leftSidebarHtml, sidebarAttentionItems, sidebarSignature, isSidebarOpen, isNewSessionPage, isInputBoxHidden, isSubagentView, parentConversationName, subagentInfoHtml, dropdownHtml, dialogHtml, settingsHtml, activeArtifactUri, activeFileUri, askQuestionHtml, permissionHtml, environmentName, branchName, modelName, btwHtml, editorText };
})()
`;
