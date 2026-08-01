// Dismiss the settings overlay by clicking the backdrop or close button.
// Used by POST /dismiss-settings.

export const DISMISS_SETTINGS_SCRIPT = `
  (async () => {
    // 1. Find the modal overlay or container (same logic as capture.js)
    let settingsOverlay = null;
    
    // Check body children
    for (const child of document.body.children) {
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
      const targets = child.id ? Array.from(child.querySelectorAll('[role="dialog"]')) : [child];
      for (const target of targets) {
        const cls = (target.className || '').toString();
        if (target.getAttribute('role') === 'dialog' || (cls.includes('fixed') && cls.includes('inset-0'))) {
          if (target.querySelector('[class*="max-w-4xl"], [class*="max-w-5xl"], [class*="max-w-6xl"], [role="tablist"]') || 
              cls.includes('max-w-4xl') || cls.includes('max-w-5xl') || cls.includes('max-w-6xl')) {
            settingsOverlay = target;
            break;
          }
        }
      }
      if (settingsOverlay) break;
    }
    
    // Check #root fallback
    if (!settingsOverlay) {
      settingsOverlay = document.querySelector('#root .fixed.inset-0[class*="z-[5000]"]');
    }

    if (settingsOverlay) {
      // Try to click the overlay backdrop itself (often the parent or the element with .fixed.inset-0)
      let backdrop = settingsOverlay;
      if (settingsOverlay.getAttribute('role') === 'dialog') {
         const prev = settingsOverlay.previousElementSibling;
         if (prev && prev.className && prev.className.toString().includes('fixed') && prev.className.toString().includes('inset-0')) {
            backdrop = prev;
         }
      }
      
      const clickOpts = { bubbles: true, clientX: 5, clientY: 5 };
      backdrop.dispatchEvent(new MouseEvent('pointerdown', clickOpts));
      backdrop.dispatchEvent(new MouseEvent('mousedown', clickOpts));
      backdrop.dispatchEvent(new MouseEvent('click', clickOpts));
      backdrop.dispatchEvent(new MouseEvent('pointerup', clickOpts));
      backdrop.click();

      // Find any button inside that looks like a Close button
      const closeBtns = Array.from(settingsOverlay.querySelectorAll('button'));
      const xBtn = closeBtns.find(b => {
        const aria = (b.getAttribute('aria-label') || '').toLowerCase();
        if (aria.includes('close') || aria.includes('chiudi')) return true;
        if (b.querySelector('svg.lucide-x')) return true;
        return false;
      });
      if (xBtn) xBtn.click();
      
      // Hit escape on the modal itself
      settingsOverlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
      
      return { ok: true, method: 'found-modal' };
    }

    // Fallbacks if modal not found by generic selector
    const radixOverlay = document.querySelector('[data-radix-portal] > .fixed.inset-0, [data-state="open"].fixed.inset-0');
    if (radixOverlay) radixOverlay.click();
    
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    return { ok: false, reason: 'modal_not_found' };
  })()
`;
