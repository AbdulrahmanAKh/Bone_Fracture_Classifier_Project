# Experiment report

## Executed result

The revised EfficientNet-B0 achieved **49.07% accuracy** and **0.465 macro-F1** on **428 cleaned held-out images**.
Mean class recall (balanced accuracy) was **47.41%**. The image-bootstrap 95% accuracy interval was **44.39%–53.97%**. It does not account for unknown patient correlations.

This was a real local CPU training/evaluation run. Metrics were not fabricated or copied from another experiment.
The best checkpoint was selected by validation macro-F1, not test accuracy. The test folder was evaluated afterward.

## Original notebook findings

| Observation | Implication | Revision |
|---|---|---|
| Best reported accuracy 50.29%; final 47.96%; final training 89.24% | Overfitting and no best-checkpoint restoration | Best validation macro-F1 checkpoint, regularization and early stopping |
| `test/` used for validation every epoch | Test-informed model selection | Validation derived from training; test reserved for final evaluation |
| K-fold datasets built from full lists rather than fold indices | Training/evaluation leakage | Removed the invalid bonus routine; documented correct fold indexing |
| Hard-coded labels separate from ImageFolder order | Potential decoding errors | Derive class order once and export it with the model |
| `.squeeze()` applied to multiclass logits | Batch-size-one failures | Preserve `[batch, classes]` logits |
| No class-level results or deployment artifact | Limited insight and no usable demo model | Class report, confusion matrix, mistakes, ONNX export and browser inference |

The original peak and revised test accuracy use **different evaluation protocols**. Their numerical difference is not a controlled estimate of model improvement.
To isolate model architecture, rerun both candidates on identical cleaned training/validation splits and use a new final holdout after choosing the model.

## Dataset audit

- Original images: 1,686.
- Conflicting identical-image groups: 124.
- Excluded image entries (conflicts and repetitions): 288.
- Cleaned split: 776 train / 194 validation / 428 test.
- Unreadable images: 0.

The duplicate check hashes decoded RGB pixels including image dimensions. It does not identify every transformed duplicate.
Visual inspection found CT/MRI images, non-radiograph stock photos, multi-panel figures, teaching slides, annotations and watermarks. These are possible shortcut signals.
No patient identifiers or reliable acquisition grouping are provided; independence at the patient or institution level is unverified.

## Deployment verification

- ONNX graph checked with `onnx.checker`.
- PyTorch/ONNX same-input maximum absolute logit difference: 0.00000077.
- Input: RGB float32 `[1, 3, 224, 224]`, pixels in `[0,1]`; normalization is embedded in the exported graph.
- Browser canvas and Pillow resizing are not bit-identical; small interpolation differences are possible.
- The 12 demo samples use seed 42, one per class, with five visually reviewed radiograph replacements. Image type/presentation quality, not prediction correctness, guided replacements. Source hashes are recorded in samples.json.
- The website runs ONNX Runtime Web locally in the browser. GitHub Pages serves static files only.

## Practical interpretation

This dataset contains fracture types only. The model cannot establish whether a fracture is present, does not localize a fracture,
does not estimate clinical severity, and does not reject unrelated inputs. Softmax scores are not calibrated probabilities.
The animated scan indicates computation. It does not show a detected fracture region.

See the executed notebook, `artifacts/classification_report.csv`, `artifacts/training_curves.png`, and `artifacts/confusion_matrix.png` for the complete evidence.
