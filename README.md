# Fracture Atlas

An educational, open-source **12-class bone fracture type classifier**, with a straightforward PyTorch notebook and a medical-themed browser demo.

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/AbdulrahmanAKh/Bone_Fracture_Classifier_Project/blob/main/Bone_Fracture_Classifier.ipynb)
[![GitHub](https://img.shields.io/badge/GitHub-Source_code-181717?logo=github)](https://github.com/AbdulrahmanAKh/Bone_Fracture_Classifier_Project)

**Demo:** https://AbdulrahmanAKh.github.io/Bone_Fracture_Classifier_Project/

## Scope

The model assigns scores across twelve fracture types. The dataset has **no normal/no-fracture class**, so the model cannot determine whether a fracture is present. It also scores unrelated images. Scores are uncalibrated and are not clinical probabilities. This is an educational experiment, not a diagnostic tool.

## Executed result

**Held-out accuracy: 49.07% · macro-F1: 0.465 · 428 test images.** See [the experiment report](EXPERIMENT_REPORT.md) and the executed notebook for the data audit and full results. These results use a revised protocol and are not a controlled comparison to the original notebook.

## Notebook improvements

- EfficientNet-B0 with ImageNet initialization, a smaller deployment-friendly candidate than the original EfficientNetV2-M.
- Exact decoded-pixel duplicate removal, conflicting-label checks, and an independent stratified validation split.
- Frozen-backbone warm-up, partial fine-tuning, then full-backbone fine-tuning; frozen batch normalization, mild augmentation, AdamW, label smoothing, scheduling, and early stopping.
- Best checkpoint selected by validation macro-F1; final held-out accuracy, macro-F1, class report, confusion matrix, error examples and image-bootstrap interval.
- Verified ONNX export with normalization embedded and an exported class order shared by the website.

The original notebook reported a 50.29% peak and 47.96% final accuracy using its test folder for validation; training accuracy reached 89.24%. Its K-fold implementation trained and evaluated on the same images because it ignored fold indices. Those results are not an untouched-test benchmark. The revised protocol is different, so a numerical comparison cannot prove the new architecture is superior.

## Run training

Open `Bone_Fracture_Classifier.ipynb` in Colab, enable a T4 GPU, and run all cells. It downloads dataset version 1 from Kaggle. Training also works on CPU, but takes longer. To use a local dataset, set `BONE_DATA_DIR` to a directory containing `train/` and `test/` before running the data cell.

The notebook writes evaluation files to `artifacts/` and creates `artifacts/browser-assets.zip`. Extract the archive into `docs/` to update the browser model and twelve samples together. Never reorder the class metadata independently from the exported model.

After a local notebook run, `python scripts/update_demo.py` copies the exports into the website. `python scripts/verify_project.py` checks the notebook, sample labels and exported ONNX inference without retraining.

For a local Python environment:

```bash
python -m pip install -r requirements.txt
```

## Run the website

```bash
python -m http.server 8000 --directory docs
```

Open http://localhost:8000. Serve over HTTP, rather than opening `index.html` directly. The site loads ONNX Runtime Web 1.23.2 from jsDelivr, and downloads the local model weights on first visit. Network access is needed for that runtime. Images remain in the browser; there is no upload API or inference server.

Features include sample X-rays, upload/drag-and-drop, animated scanning during actual inference, viewer brightness/contrast, top-three scores, reference sample labels, result JSON download, expandable label descriptions, keyboard controls, responsive layout and reduced-motion support. Viewer adjustments do not alter model inputs. The animation is a processing indicator, not fracture localization.

## GitHub Pages

Publish the `main` branch's `/docs` folder in **Settings → Pages → Deploy from a branch**. The site uses relative asset paths and `.nojekyll`, so it works at the repository subpath without a build step. The static host runs no Python server: ONNX inference happens in the visitor's browser.

## Data and limitations

Dataset: [Shyam Gupta · Bone Fracture Split Classification](https://www.kaggle.com/datasets/shyamgupta196/bone-fracture-split-classification). Kaggle lists version 1 under CC0. See [DATA_SOURCES.md](DATA_SOURCES.md) for attribution and provenance limitations.

The executed audit found **124 groups of identical images with conflicting class labels**. Removing ambiguous and repeated images excluded **288 of 1,686 entries**. The cleaned split contains **776 training, 194 validation and 428 test images**. Visual inspection also revealed teaching slides, multi-panel figures, annotations and watermarks, which can create shortcuts unrelated to fracture morphology.

Exact deduplication does not catch every resized copy, crop, or related study. Patient IDs are unavailable; patient-level independence is unverified. Data quality, annotation reliability, limited sample size and source differences limit generalization. The held-out test set supports only this dataset-level experiment. A prospective clinical evaluation has not been performed.

## Author

- GitHub: [@AbdulrahmanAKh](https://github.com/AbdulrahmanAKh)
- LinkedIn: [https://www.linkedin.com/in/abdulrahman-alkhatib/](https://www.linkedin.com/in/abdulrahman-alkhatib/)
- Email: [aboodkhatib90@gmail.com](mailto:aboodkhatib90@gmail.com)
- Portfolio: [https://abdulrahmanakh.github.io/](https://abdulrahmanakh.github.io/)

---

<p align="center">
  <b>Developed &amp; Engineered by Abdulrahman Alkhatib</b><br>
  <i>Computer Science Graduate | Software &amp; AI Engineer</i>
</p>
