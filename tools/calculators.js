const number = id => Number(document.getElementById(id)?.value);

const set = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

const EMPTY = '—';
const INVALID_NUMBER = 'Enter numbers that are 0 or greater.';

// Blank the result cells so an error never sits next to stale numbers.
const clearResults = ids => ids.forEach(id => set(id, EMPTY));

const isInvalid = (...values) => values.some(v => !Number.isFinite(v) || v < 0);

// Mark the offending fields (red border) so the problem is visible where the user is typing.
const flag = (id, bad) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (bad) el.setAttribute('aria-invalid', 'true');
  else el.removeAttribute('aria-invalid');
};

// required: fields that must be > 0, optional: fields that may be 0.
// Returns the message to show, or '' when everything is fine.
const validate = (required, optional, zeroMessage) => {
  let negative = false,
    zero = false;
  for (const [id, v] of Object.entries(required)) {
    const bad = isInvalid(v);
    flag(id, bad || !v);
    if (bad) negative = true;
    else if (!v) zero = true;
  }
  for (const [id, v] of Object.entries(optional)) {
    const bad = isInvalid(v);
    flag(id, bad);
    if (bad) negative = true;
  }
  return negative ? INVALID_NUMBER : zero ? zeroMessage : '';
};

/* ---------- Beam ---------- */
function beam() {
  const L = number('span'),
    P = number('point'),
    w = number('uniform'),
    E = number('e'),
    I = number('i');
  const outputs = ['ra', 'rb', 'shear', 'moment', 'deflection'];

  const problem = validate(
    { span: L, e: E, i: I },
    { point: P, uniform: w },
    'Span, elastic modulus, and moment of inertia must be greater than 0.'
  );
  set('error', problem);
  if (problem) {
    clearResults(outputs);
    return;
  }

  const r = P / 2 + (w * L) / 2,
    m = (P * L) / 4 + (w * L * L) / 8,
    v =
      (P * Math.pow(L * 12, 3)) / (48 * E * I) +
      (5 * (w / 12) * Math.pow(L * 12, 4)) / (384 * E * I);

  set('ra', r.toFixed(3) + ' kip');
  set('rb', r.toFixed(3) + ' kip');
  set('shear', Math.max(r, Math.abs(r - P)).toFixed(3) + ' kip');
  set('moment', m.toFixed(3) + ' kip-ft');
  set('deflection', v.toFixed(3) + ' in');
  set('beam-label', L + ' ft span');
}

/* ---------- Concrete ---------- */
function concrete() {
  const shape = document.getElementById('shape').value,
    L = number('length'),
    W = number('width'),
    D = number('depth'),
    waste = number('waste');
  const isSlab = shape === 'slab';
  const outputs = ['net', 'total', 'yards', 'bags60', 'bags80'];

  flag('length', false);
  const problem = validate(
    isSlab ? { length: L, width: W, depth: D } : { width: W, depth: D },
    { waste },
    'Enter dimensions greater than 0.'
  );
  set('error', problem);
  if (problem) {
    clearResults(outputs);
    return;
  }

  const net = isSlab ? (L * W * D) / 12 : (Math.PI * Math.pow(W / 2, 2) * D) / 12,
    total = net * (1 + waste / 100);

  set('net', net.toFixed(3) + ' ft³');
  set('total', total.toFixed(3) + ' ft³');
  set('yards', (total / 27).toFixed(3) + ' yd³');
  set('bags60', Math.ceil(total / 0.45) + ' bags');
  set('bags80', Math.ceil(total / 0.6) + ' bags');

  const path = document.getElementById('concrete-shape'),
    text = document.getElementById('dimension-label');

  if (!isSlab) {
    const d = Math.min(130, Math.max(45, W * 25)),
      h = Math.min(110, Math.max(35, D * 8)),
      k = d * 0.42;
    // Cylinder: sides, front-bottom arc, and a full ellipse for the top face.
    path.setAttribute(
      'd',
      `M${300 - d} 55v${h}c0 ${k} ${d * 2} ${k} ${d * 2} 0V55` +
        `c0 ${k} -${d * 2} ${k} -${d * 2} 0c0 -${k} ${d * 2} -${k} ${d * 2} 0`
    );
    text.textContent = W + ' ft diameter × ' + D + ' in height';
    document.getElementById('length-group').classList.add('hidden');
    document.getElementById('width-label').textContent = 'Diameter';
    document.getElementById('depth-label').textContent = 'Height';
  } else {
    const a = Math.min(260, Math.max(80, L * 20)),
      b = Math.min(120, Math.max(30, W * 12)),
      c = Math.min(105, Math.max(20, D * 10));
    path.setAttribute(
      'd',
      `M100 62h${a}l${b} ${b * 0.48}v${c}H${100 + b}l-${b} -${b * 0.48}z` +
        `M100 62l${b} ${b * 0.48}h${a}M${100 + b} ${62 + b * 0.48}v${c}`
    );
    text.textContent = L + ' ft × ' + W + ' ft × ' + D + ' in';
    document.getElementById('length-group').classList.remove('hidden');
    document.getElementById('width-label').textContent = 'Width';
    document.getElementById('depth-label').textContent = 'Depth';
  }

  // Centre the label over whatever shape was just drawn.
  const box = path.getBBox();
  text.setAttribute('x', (box.x + box.width / 2).toFixed(1));
  text.setAttribute('y', Math.max(28, box.y - 12).toFixed(1));
}

/* ---------- Rebar ---------- */
function rebar() {
  const data = {
      '#3': 0.376,
      '#4': 0.668,
      '#5': 1.043,
      '#6': 1.502,
      '#7': 2.044,
      '#8': 2.67,
      '#9': 3.4,
      '#10': 4.303,
      '#11': 5.313,
    },
    size = document.getElementById('size').value,
    L = number('bar-length'),
    q = number('quantity');
  const outputs = ['unit-weight', 'total-length', 'total-weight', 'tons'];

  const problem = validate(
    { 'bar-length': L, quantity: q },
    {},
    'Length and quantity must be greater than 0.'
  );
  set('error', problem);
  if (problem) {
    clearResults(outputs);
    return;
  }

  const t = L * q,
    w = t * data[size];

  set('unit-weight', data[size].toFixed(3) + ' lb/ft');
  set('total-length', t.toFixed(3) + ' ft');
  set('total-weight', w.toFixed(3) + ' lb');
  set('tons', (w / 2000).toFixed(4) + ' short tons');

  // Bar line, deformation marks that stay on the bar, and a centred label.
  const len = Math.min(430, Math.max(130, L * 21.5));
  let marks = '';
  for (let x = 115; x + 18 <= 85 + len - 10; x += 38) marks += `M${x} 55l18 30`;
  document.getElementById('rebar-line').setAttribute('d', 'M85 70h' + len);
  document.getElementById('rebar-marks').setAttribute('d', marks);
  const label = document.getElementById('rebar-label');
  label.setAttribute('x', (85 + len / 2).toFixed(1));
  set('rebar-label', L + ' ft × ' + q);
}

/* ---------- Wire up whichever calculator is on the page ---------- */
const bind = (ids, handler, selectId) => {
  ids.forEach(id =>
    document.getElementById(id).addEventListener(id === selectId ? 'change' : 'input', handler)
  );
  handler();
};

if (document.getElementById('span')) bind(['span', 'point', 'uniform', 'e', 'i'], beam);
if (document.getElementById('shape'))
  bind(['shape', 'length', 'width', 'depth', 'waste'], concrete, 'shape');
if (document.getElementById('size'))
  bind(['size', 'bar-length', 'quantity'], rebar, 'size');
