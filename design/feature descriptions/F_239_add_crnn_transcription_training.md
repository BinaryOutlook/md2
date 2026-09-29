---
id: F_239
internalId: d3cc171c-1653-468b-b55a-76315754706a
title: Add spatial transcription training
status: ready
owner: JB
after: 3a2383c9-3255-481c-8820-adbeec7d49d7
affects:
  - detector/app/engine/models/model_factory.py
  - detector/app/engine/models/torch
  - detector/app/engine/models/training
  - detector/app/engine/data_fetcher.py
policy:
  checkLinting: true
  requireTests: true
agents:
  - design/activity/card__d3cc171c-1653-468b-b55a-76315754706a.json
changedFiles:
  - design/feature descriptions/F_236_add_transcribe_model_purpose.md
  - design/feature descriptions/F_238_add_transcription_training_data_pipeline.md
  - design/feature descriptions/F_240_add_crnn_transcription_inference.md
  - detector/app/engine/data_fetcher.py
  - detector/app/engine/models/inference/crnn_transcription_inference_model.py
  - detector/app/engine/models/inference/ctc_line_transcription_inference_model.py
  - detector/app/engine/models/inference/text_line_splitter.py
  - detector/app/engine/models/model_factory.py
  - detector/app/engine/models/torch/crnn_transcription_model.py
  - detector/app/engine/models/torch/ctc_line_transcription_model.py
  - detector/app/engine/models/torch/spatial_transcription_model.py
  - detector/app/engine/models/training/ctc_line_transcription_trainer.py
  - detector/app/engine/models/training/transcription_metrics.py
  - detector/app/engine/models/training/transcription_model_trainer.py
  - detector/app/engine/models/training/transcription_training_debug.py
  - detector/tests/test_ctc_line_transcription.py
  - detector/tests/test_generate_synthetic_transcription_data.py
  - detector/tests/test_transcription_data_fetcher.py
  - detector/tests/test_transcription_inference.py
  - detector/tests/test_transcription_training.py
  - detector/tools/audit_text_line_splitter.py
  - detector/tools/evaluate_line_transcription.py
  - detector/tools/generate_synthetic_transcription_data.py
  - vidsy_ai_electron/public/storage/mongo/mongo_training_metrics.js
  - vidsy_ai_electron/public/storage/sqlite/migrations/v_18.js
  - vidsy_ai_electron/public/storage/sqlite/migrations/v_19.js
  - vidsy_ai_electron/public/storage/sqlite/sqlite_migrations_service.js
  - vidsy_ai_electron/public/storage/sqlite/sqlite_training_metrics.js
  - vidsy_ai_electron/src/main_window/model_config/__tests__/categories.test.jsx
  - vidsy_ai_electron/src/main_window/model_config/__tests__/model_def_config.test.jsx
  - vidsy_ai_electron/src/main_window/model_config/categories.jsx
  - vidsy_ai_electron/src/main_window/model_config/category.jsx
  - vidsy_ai_electron/src/main_window/model_config/category_row.jsx
  - vidsy_ai_electron/src/main_window/model_config/model_def_base_card.jsx
  - vidsy_ai_electron/src/main_window/model_config/model_def_config.jsx
  - vidsy_ai_electron/src/main_window/model_config/model_def_validator.js
  - vidsy_ai_electron/src/main_window/model_config/model_def_validator.test.js
  - vidsy_ai_electron/src/main_window/training/__tests__/epoch_chart.test.jsx
  - vidsy_ai_electron/src/main_window/training/__tests__/stage_chart.test.jsx
  - vidsy_ai_electron/src/main_window/training/epoch_chart.jsx
  - vidsy_ai_electron/src/main_window/training/stage_chart.jsx
  - vidsy_ai_electron/src/main_window/training/trainer_data_view.js
  - vidsy_ai_electron/src/services/db/__tests__/mongo_training_metrics.test.js
  - vidsy_ai_electron/src/services/db/__tests__/sqlite_migration_service.test.js
  - vidsy_ai_electron/src/services/db/__tests__/sqlite_training_metrics.test.js
  - vidsy_ai_electron/src/services/db/base_model_definitions.js
  - vidsy_ai_electron/src/services/indexes/__tests__/index_helpers.test.js
  - vidsy_ai_electron/src/services/indexes/__tests__/models_map_service.test.js
  - vidsy_ai_electron/src/services/indexes/index_helpers.js
  - vidsy_ai_electron/src/services/indexes/models_map_service.js
  - vidsy_ai_electron/src/services/indexes/training/__tests__/transcription_training_pipeline.test.js
  - vidsy_ai_electron/src/services/indexes/training/image_training_data_preparer.js
  - vidsy_ai_electron/src/services/indexes/training/model_training_validator.js
---

## Goal

Train one text recognizer that reads single-line and multiline image crops, including explicit line breaks.

## Model

* ResNet-18 retains a two-dimensional feature map with row and column positions.
* An autoregressive text decoder attends to the feature map and emits characters in reading order.
* Space and newline are alphabet characters. Start, end, and padding tokens are internal.
* Input uses configured width and height with aspect-preserving resize and padding.
* Training uses teacher-forced cross-entropy, ignoring padding positions.

## Training behavior

Add a dedicated trainer selected by `purpose == 'transcribe'`. Report decoder loss, exact-text accuracy, and character error rate, counting newlines. Select the best checkpoint by character error rate.

Save model state, ordered alphabet, internal token indices, architecture, input dimensions, preprocessing settings, and training state in `model.pt`. Resume must fail when the saved alphabet or architecture differs from the configured model.

Initial training parameters will be finalized during implementation from synthetic and representative camera-overlay validation data. Do not expose unsupported parameters in the UI.

## Tests

Cover spatial features, decoder output and stopping, repeated characters and newlines, optimizer steps, metrics, checkpoint save/resume, and alphabet mismatch failure.

## Acceptance criteria

* A transcription Index can train and save a spatial transcription checkpoint.
* Metrics reach the existing training progress flow.
* Saved models retain the exact alphabet used during training.
