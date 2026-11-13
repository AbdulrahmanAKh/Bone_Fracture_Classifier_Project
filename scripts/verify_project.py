"""Check the exported model, notebook and website assets without retraining."""
import json, re
from html.parser import HTMLParser
from pathlib import Path
import numpy as np
import onnx
import onnxruntime as ort

root = Path(__file__).resolve().parents[1]
docs = root / 'docs'
class PageIds(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])

page = PageIds()
page.feed((docs / 'index.html').read_text(encoding='utf-8'))
assert len(page.ids) == len(set(page.ids)), 'Duplicate HTML IDs can break upload controls.'
referenced = re.findall(r"\$\('([^']+)'\)", (docs / 'app.js').read_text(encoding='utf-8'))
assert set(referenced) <= set(page.ids), 'JavaScript references a missing page control.'
notebook = json.loads((root / 'Bone_Fracture_Classifier.ipynb').read_text(encoding='utf-8'))
assert notebook['nbformat'] == 4
for cell in notebook['cells']:
    if cell['cell_type'] == 'code':
        source = ''.join(cell['source'])
        if not source.startswith('%pip') and '%pip' not in source:
            compile(source, '<notebook-cell>', 'exec')
        assert not any(output.get('output_type') == 'error' for output in cell['outputs'])

metadata = json.loads((docs / 'model/metadata.json').read_text())
assert len(metadata['classes']) == len(set(metadata['classes'])) == 12
assert metadata['normalization'] == 'embedded'
samples = json.loads((docs / 'samples.json').read_text())
assert len(samples) == 12
assert set(s['label'] for s in samples) == set(metadata['classes'])
for sample in samples:
    assert (docs / sample['file']).is_file()

model_path = docs / 'model/fracture.onnx'
onnx.checker.check_model(str(model_path))
session = ort.InferenceSession(str(model_path), providers=['CPUExecutionProvider'])
image = np.random.default_rng(42).random((1, 3, 224, 224), dtype=np.float32)
logits = session.run(None, {'pixels': image})[0]
assert logits.shape == (1, 12), logits.shape
assert np.isfinite(logits).all()
metrics = metadata['metrics']
assert metrics['test_images'] == metrics['audit']['test']
assert metrics['comparable_to_original'] is False
assert 0 <= metrics['test_accuracy'] <= 1
assert 0 <= metrics['test_macro_f1'] <= 1
assert metadata['onnx_max_abs_error'] < 1e-3
print('PASS: notebook syntax, real outputs, labels, sample files, ONNX structure and inference.')
