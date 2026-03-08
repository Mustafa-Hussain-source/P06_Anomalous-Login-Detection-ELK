# Pandas AI Layer Plan — FP/FN/TP/TN Analyzer

## Objective
Add a lightweight AI/analytics layer that classifies detection outcomes into:
- True Positive (TP)
- False Positive (FP)
- True Negative (TN)
- False Negative (FN)

This is a decision-support layer to improve detection quality and justify UC-020 rollback behavior.

---

## Position in Architecture
- Input: historical login events + mitigation logs + analyst labels.
- Processing: Pandas pipeline for feature extraction and outcome labeling.
- Output: confusion matrix metrics + recommended tuning hints.
- Consumption: dashboard widget, weekly report section, and demo evidence.

---

## Minimal Dataset Contract
Required fields per event:
- timestamp
- user_id / username
- source_ip
- geolocation / country
- risk_score
- event_action
- mitigation_action
- mitigation_status
- analyst_label (ground truth: malicious/benign)

Derived label:
- predicted_malicious (from current detection logic)
- actual_malicious (from analyst_label)
- outcome_class in {TP, FP, TN, FN}

---

## MVP Implementation (Recommended)
1. Build one Python script using Pandas in Sprint 4 folder.
2. Pull events from DB/CSV export on a schedule.
3. Compute TP/FP/TN/FN and precision/recall/F1.
4. Export:
   - CSV summary
   - JSON summary
   - markdown snippet for report inclusion

---

## Stretch Layer (Optional after MVP)
- Add a simple model (e.g., logistic regression) to predict likely false positives.
- Use model output only as advisory score; do not auto-enforce based solely on model.

---

## Why this helps final evaluation
- Shows analytical maturity beyond rule-based detections.
- Justifies tuning and rollback decisions with measurable evidence.
- Creates a strong “cherry on top” story for presentation and demos.

---

## Demo Narrative Hook
1. Trigger anomaly.
2. Show mitigation firing.
3. Show analyst truth label.
4. Show Pandas classifier reporting FP/FN class.
5. If FP, show controlled rollback path (UC-020) with audit trail.
