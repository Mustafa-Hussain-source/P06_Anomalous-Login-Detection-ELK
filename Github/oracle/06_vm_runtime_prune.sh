#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-preview}"
TARGET="${2:-$HOME/Github/P06_Anomalous-Login-Detection-ELK}"

if [[ "$MODE" != "preview" && "$MODE" != "apply" ]]; then
  echo "Usage: $0 [preview|apply] [target_repo_path]"
  exit 1
fi

if [[ ! -d "$TARGET" ]]; then
  echo "Target not found: $TARGET"
  exit 1
fi

echo "Mode: $MODE"
echo "Target: $TARGET"
echo "--- Size before ---"
du -sh "$TARGET"

echo "--- Candidate files ---"
find "$TARGET" -type f \( -name "*.mp4" -o -name "*.mkv" -o -name "*.mov" -o -name "*.avi" -o -name "*.ppt" -o -name "*.pptx" -o -name "*.doc" -o -name "*.docx" -o -name "*.pdf" -o -name "*.zip" -o -name "*.7z" -o -name "*.rar" \) | sed -n '1,300p'

echo "--- Candidate folders ---"
for p in "$TARGET/Final-Deliverables/Presentation" "$TARGET/Final-Deliverables/Report" "$TARGET/Reviews" "$TARGET/Prototype" "$TARGET/Management" "$TARGET/Requirements"; do
  [[ -e "$p" ]] && echo "$p"
done

if [[ "$MODE" == "preview" ]]; then
  echo "Preview complete."
  exit 0
fi

find "$TARGET" -type f \( -name "*.mp4" -o -name "*.mkv" -o -name "*.mov" -o -name "*.avi" -o -name "*.ppt" -o -name "*.pptx" -o -name "*.doc" -o -name "*.docx" -o -name "*.pdf" -o -name "*.zip" -o -name "*.7z" -o -name "*.rar" \) -delete

for p in "$TARGET/Final-Deliverables/Presentation" "$TARGET/Final-Deliverables/Report" "$TARGET/Reviews" "$TARGET/Prototype" "$TARGET/Management" "$TARGET/Requirements"; do
  [[ -e "$p" ]] && rm -rf "$p"
done

[[ -d "$TARGET/.git" ]] && rm -rf "$TARGET/.git"

echo "--- Size after ---"
du -sh "$TARGET"
echo "Prune complete."