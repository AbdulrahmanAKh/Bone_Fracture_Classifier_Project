'use strict';
const $ = id => document.getElementById(id);
const descriptions = {
  'Avulsion fracture': 'A fragment of bone separates where a tendon or ligament attaches.',
  'Comminuted fracture': 'The bone breaks into multiple fragments.',
  'Compression-Crush fracture': 'Bone collapses or is compressed under pressure.',
  'Fracture Dislocation': 'A fracture occurs together with displacement at a joint.',
  'Greenstick fracture': 'A partial break in which the bone bends and cracks on one side.',
  'Hairline Fracture': 'A fine, narrow crack that can be subtle on an X-ray.',
  'Impacted fracture': 'Broken bone ends are driven into one another.',
  'Intra-articular fracture': 'The break extends into a joint surface.',
  'Longitudinal fracture': 'The break runs along the length of the bone.',
  'Oblique fracture': 'The break runs diagonally across the bone.',
  'Pathological fracture': 'A break occurs in bone weakened by an underlying condition; cause requires clinical context.',
  'Spiral Fracture': 'A twisting force produces a fracture that winds around the bone.'
};
let session, metadata, currentSample = null, selected = false, busy = false, resultData = null;
let objectURL = null, selectionVersion = 0;
const modelReady = initialize();

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}
function updateButton() {
  $('analyze').disabled = !selected || busy || !session;
  $('analyze').textContent = busy ? 'Analyzing image…' : selected ? 'Analyze X-ray' : 'Choose an image to begin';
}
async function getJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}
async function initialize() {
  for (const [name, description] of Object.entries(descriptions)) {
    const details = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = name;
    const p = document.createElement('p'); p.textContent = description;
    details.append(summary, p); $('class-guide').append(details);
  }
  // Sample loading is independent of model loading: visitors can inspect images while weights load.
  loadSamples();
  try {
    metadata = await getJSON('model/metadata.json');
    if (metadata.classes.length !== 12 || metadata.size !== 224 || metadata.normalization !== 'embedded') {
      throw new Error('Model metadata does not match this application.');
    }
    renderMetrics(metadata.metrics);
    status('Loading model weights. First visit may take a moment…');
    if (!globalThis.ort) throw new Error('ONNX Runtime did not load. Check your connection and reload.');
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';
    ort.env.wasm.numThreads = 1; // Works on GitHub Pages without cross-origin isolation headers.
    session = await ort.InferenceSession.create('model/fracture.onnx', { executionProviders: ['wasm'] });
    status('Model ready. Select an X-ray to explore.');
  } catch (error) {
    status(`Model unavailable: ${error.message} Reload to retry.`, true);
  }
  updateButton();
}
async function loadSamples() {
  try {
    const samples = await getJSON('samples.json'); $('samples').replaceChildren();
    samples.forEach(sample => {
      const button = document.createElement('button'); button.className = 'sample';
      button.setAttribute('aria-pressed', 'false'); button.title = sample.label;
      const image = document.createElement('img'); image.src = sample.file; image.alt = `${sample.label} example X-ray`; image.loading = 'lazy';
      const caption = document.createElement('span'); caption.textContent = sample.label;
      button.append(image, caption); button.addEventListener('click', () => selectImage(sample.file, sample.label, sample, button));
      $('samples').append(button);
    });
  } catch (error) { $('samples').textContent = 'Sample library unavailable. You can still upload an image.'; }
}
function renderMetrics(metrics) {
  if (!metrics) return;
  const entries = [['Architecture', 'EfficientNet-B0'], ['Held-out accuracy', `${(metrics.test_accuracy * 100).toFixed(1)}%`],
    ['Macro-F1', metrics.test_macro_f1.toFixed(3)], ['Cleaned test images', String(metrics.test_images)]];
  $('metrics').replaceChildren();
  entries.forEach(([key, value]) => {
    const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = key; dd.textContent = value; row.append(dt, dd); $('metrics').append(row);
  });
  if (metrics.audit) {
    const audit = metrics.audit;
    const note = document.createElement('p');
    note.textContent = `Data audit: ${audit.conflicting_hashes} groups of identical images had conflicting labels; ${audit.excluded_images} image entries were excluded. Teaching slides and watermarks may introduce visual shortcuts.`;
    $('metrics').after(note);
  }
}
async function selectImage(url, name, sample = null, button = null) {
  if (busy) return;
  const version = ++selectionVersion;
  selected = false; currentSample = null; resultData = null; $('result').hidden = true; updateButton();
  try {
    const img = new Image(); img.src = url; await img.decode();
    if (version !== selectionVersion) return;
    if (objectURL && objectURL !== url) { URL.revokeObjectURL(objectURL); objectURL = null; }
    $('preview').src = url; $('preview').alt = sample ? `Sample X-ray labeled ${sample.label}` : 'Your uploaded image';
    $('preview').hidden = false; $('empty').hidden = true; $('image-name').textContent = name;
    currentSample = sample; selected = true;
    document.querySelectorAll('.sample').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    $('brightness').value = $('contrast').value = 100; updateView();
    if (session) status('Image ready. Select Analyze X-ray.');
  } catch (error) { status('This image could not be decoded. Choose a valid PNG, JPEG or WebP.', true); }
  updateButton();
}
function upload(file) {
  if (busy || !file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    status('Choose a PNG, JPEG or WebP image. DICOM files are not supported.', true); return;
  }
  if (file.size > 10 * 1024 * 1024) { status('This file exceeds 10 MB. Choose a smaller image.', true); return; }
  if (objectURL) URL.revokeObjectURL(objectURL);
  objectURL = URL.createObjectURL(file); selectImage(objectURL, file.name);
}
function updateView() { $('preview').style.filter = `brightness(${$('brightness').value}%) contrast(${$('contrast').value}%)`; }
$('brightness').addEventListener('input', updateView); $('contrast').addEventListener('input', updateView);
$('upload').addEventListener('change', event => upload(event.target.files[0]));
for (const name of ['dragover', 'dragleave', 'drop']) {
  $('dropzone').addEventListener(name, event => {
    event.preventDefault(); $('dropzone').classList.toggle('dragging', name === 'dragover');
    if (name === 'drop') upload(event.dataTransfer.files[0]);
  });
}
$('reset').addEventListener('click', () => {
  if (busy) return;
  selectionVersion++; selected = false; currentSample = null; resultData = null;
  $('preview').hidden = true; $('preview').removeAttribute('src'); $('empty').hidden = false;
  $('result').hidden = true; $('image-name').textContent = 'No image selected'; $('upload').value = '';
  if (objectURL) { URL.revokeObjectURL(objectURL); objectURL = null; }
  $('brightness').value = $('contrast').value = 100; updateView();
  document.querySelectorAll('.sample').forEach(el => el.setAttribute('aria-pressed', 'false'));
  if (session) status('Model ready. Select an X-ray to explore.'); updateButton();
});
function toTensor(image, size) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.fillStyle = '#000'; context.fillRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);
  const rgba = context.getImageData(0, 0, size, size).data, plane = size * size;
  const pixels = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    pixels[i] = rgba[i * 4] / 255; pixels[plane + i] = rgba[i * 4 + 1] / 255; pixels[2 * plane + i] = rgba[i * 4 + 2] / 255;
  }
  return new ort.Tensor('float32', pixels, [1, 3, size, size]);
}
function softmax(logits) {
  const max = Math.max(...logits), exp = Array.from(logits, x => Math.exp(x - max));
  const total = exp.reduce((a, b) => a + b, 0); return exp.map(x => x / total);
}
$('analyze').addEventListener('click', async () => {
  await modelReady;
  if (!session || !selected || busy) return;
  busy = true; updateButton(); $('result').hidden = true;
  $('processing-visual').hidden = false;
  $('dropzone').classList.add('scanning'); $('upload').disabled = true; $('reset').disabled = true;
  document.querySelectorAll('.sample').forEach(el => el.disabled = true);
  status('Running the classifier on your device…');
  const started = performance.now();
  let tensor, output;
  try {
    // Yield one frame so the scan state paints before preprocessing.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await $('preview').decode();
    tensor = toTensor($('preview'), metadata.size);
    output = await session.run({ pixels: tensor });
    const probabilities = softmax(output.logits.data);
    if (probabilities.length !== metadata.classes.length || probabilities.some(p => !Number.isFinite(p))) throw new Error('Invalid model output.');
    const ranked = probabilities.map((score, index) => ({ label: metadata.classes[index], score })).sort((a, b) => b.score - a.score);
    $('prediction').textContent = ranked[0].label; $('score').textContent = `${(ranked[0].score * 100).toFixed(1)}%`;
    $('rankings').replaceChildren();
    ranked.slice(0, 3).forEach(item => {
      const row = document.createElement('div'); row.className = 'rank';
      const label = document.createElement('div'), name = document.createElement('span'), score = document.createElement('span');
      name.textContent = item.label; score.textContent = `${(item.score * 100).toFixed(1)}%`; label.append(name, score);
      const track = document.createElement('div'); track.className = 'track';
      const bar = document.createElement('i'); bar.style.width = `${item.score * 100}%`; track.append(bar); row.append(label, track); $('rankings').append(row);
    });
    const elapsed = performance.now() - started;
    $('sample-truth').textContent = currentSample ? `Dataset label: ${currentSample.label}. ${currentSample.label === ranked[0].label ? 'Matches the top prediction.' : 'The model disagrees with this label.'}` : 'Uploaded image: no reference label is available.';
    $('timing').textContent = `${(elapsed / 1000).toFixed(2)} s · processed locally · top 3 model scores`;
    resultData = { model: metadata.model, image: $('image-name').textContent, predictions: ranked,
      reference_label: currentSample?.label || null, inference_ms: Math.round(elapsed),
      limitation: 'Educational fracture-type classifier. No normal class. Scores are uncalibrated and are not a diagnosis.' };
    $('result').hidden = false; status('Analysis complete. Review the model scores and limitations.');
  } catch (error) { status(`Analysis failed: ${error.message} Try another image or reload.`, true); }
  finally {
    tensor?.dispose(); if (output) Object.values(output).forEach(value => value.dispose());
    busy = false; $('dropzone').classList.remove('scanning'); $('upload').disabled = false; $('reset').disabled = false;
    $('processing-visual').hidden = true;
    document.querySelectorAll('.sample').forEach(el => el.disabled = false); updateButton();
  }
});
$('download').addEventListener('click', () => {
  if (!resultData) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(resultData, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'fracture-atlas-result.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
