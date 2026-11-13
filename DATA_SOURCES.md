# Data and sample attribution

Dataset: **Bone Fracture Split Classification**, by **Shyam Gupta**.

- Dataset: https://www.kaggle.com/datasets/shyamgupta196/bone-fracture-split-classification
- Version: 1 (May 15, 2024).
- Kaggle dataset ID: 5013401.
- Kaggle's dataset listing declares **CC0: Public Domain**, checked November 13, 2026 using the public Kaggle dataset API.
- The demo bundles one example per class from the cleaned test split. Selection uses seed 42 plus five visually reviewed replacements for non-radiographs or branded stock imagery; it does not depend on prediction correctness.
- Training images are downloaded by the notebook, not included in this repository.

Kaggle's license declaration does not independently verify the provenance, consent status, or clinical quality of every source image. The image collection includes varied sources and is used for an educational experiment. Patient IDs are unavailable.

The notebook retains the folder labels supplied by the dataset. Labels and model scores do not constitute medical advice or a radiologist's interpretation.

## Software and design references

- PyTorch/torchvision EfficientNet-B0: https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.efficientnet_b0.html
- ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/
- Frontend design guidance reviewed: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- Educational fracture terminology: https://www.hopkinsmedicine.org/health/conditions-and-diseases/fractures and https://www.orthoinfo.org/diseases--conditions/broken-bones/fractures-broken-bones/

The website uses original HTML, CSS and JavaScript. GitHub and Colab symbols identify links to their respective services; they do not indicate endorsement.
