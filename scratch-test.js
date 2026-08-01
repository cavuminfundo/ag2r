const dialogs = document.querySelectorAll('[role="dialog"]');
const info = Array.from(dialogs).map(d => ({
  className: d.className,
  id: d.id,
  text: d.textContent.substring(0, 100),
  htmlLength: d.innerHTML.length,
  hasTabs: !!d.querySelector('[role="tablist"]'),
  hasMaxWidth: !!d.className.match(/max-w-[0-9a-z]+/)
}));
console.log(JSON.stringify(info, null, 2));
