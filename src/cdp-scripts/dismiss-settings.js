// Dismiss the settings overlay by clicking the backdrop.
// Used by POST /dismiss-settings.

export const DISMISS_SETTINGS_SCRIPT = `
  (async () => {
    // 1. Try to click Radix overlay (modern AG)
    const radixOverlay = document.querySelector('[data-radix-portal] > .fixed.inset-0, [data-state="open"].fixed.inset-0');
    if (radixOverlay) {
      radixOverlay.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 }));
      radixOverlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 5, clientY: 5 }));
      radixOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 5, clientY: 5 }));
      radixOverlay.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 5, clientY: 5 }));
      return { ok: true, method: 'radix-overlay' };
    }
    // 2. Try old overlay (legacy AG)
    const overlay = document.querySelector('.fixed.inset-0[class*="z-[5000]"]');
    if (overlay) {
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 5, clientY: 5 }));
      return { ok: true, method: 'backdrop' };
    }
    // 3. Try to click the Close button (usually an X icon)
    const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"], [role="dialog"] button[aria-label="close"]');
    if (closeBtn) {
      closeBtn.click();
      return { ok: true, method: 'close-btn' };
    }
    // 4. Fallback: Escape
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, keyCode: 27 }));
    return { ok: true, method: 'escape' };
  })()
`;
