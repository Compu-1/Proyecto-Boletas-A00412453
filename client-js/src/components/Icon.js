const iconPaths = {
  cart: [
    { tag: 'path', d: 'M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 1.9-1.4L21 9H6' },
    { tag: 'circle', cx: '10', cy: '20', r: '1' },
    { tag: 'circle', cx: '18', cy: '20', r: '1' },
  ],
  check: [{ tag: 'path', d: 'm5 12 4 4L19 6' }],
  close: [{ tag: 'path', d: 'm6 6 12 12M18 6 6 18' }],
  clock: [
    { tag: 'circle', cx: '12', cy: '12', r: '9' },
    { tag: 'path', d: 'M12 7v5l3 2' },
  ],
  error: [
    { tag: 'circle', cx: '12', cy: '12', r: '9' },
    { tag: 'path', d: 'm9 9 6 6m0-6-6 6' },
  ],
  info: [
    { tag: 'circle', cx: '12', cy: '12', r: '9' },
    { tag: 'path', d: 'M12 11v5m0-8h.01' },
  ],
  refresh: [
    { tag: 'path', d: 'M20 7v5h-5M4 17v-5h5' },
    { tag: 'path', d: 'M5.5 9A7 7 0 0 1 17 6.5L20 12M4 12l3 5.5A7 7 0 0 0 18.5 15' },
  ],
  ticket: [
    { tag: 'path', d: 'M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16a2 2 0 0 0 0-4v-2a2 2 0 0 0 0-4z' },
    { tag: 'path', d: 'M12 8v1m0 2v1m0 2v1' },
  ],
  warning: [
    { tag: 'path', d: 'M10.3 4.5 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.7 4.5a2 2 0 0 0-3.4 0z' },
    { tag: 'path', d: 'M12 9v4m0 3h.01' },
  ],
};

export function createIcon(name, className = 'ui-icon') {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('class', className);
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');

  for (const shape of iconPaths[name] || []) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', shape.tag);
    for (const [attribute, value] of Object.entries(shape)) {
      if (attribute !== 'tag') element.setAttribute(attribute, value);
    }
    icon.appendChild(element);
  }

  return icon;
}
