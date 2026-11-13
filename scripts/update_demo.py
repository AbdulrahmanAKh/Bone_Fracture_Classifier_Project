"""Copy notebook exports into the static demo after a local training run."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
source, destination = root / 'artifacts/web', root / 'docs'
if not (source / 'model/fracture.onnx').is_file():
    raise SystemExit('Run the notebook export cell first, or extract browser-assets.zip into docs/.')
for folder in ['model', 'samples']:
    shutil.copytree(source / folder, destination / folder, dirs_exist_ok=True)
shutil.copy2(source / 'samples.json', destination / 'samples.json')
print('Updated docs/ with the model, class metadata and sample images.')
