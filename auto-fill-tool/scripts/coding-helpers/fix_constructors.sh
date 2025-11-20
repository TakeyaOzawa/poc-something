#!/bin/bash

# Fix constructor parameter order issues
find src/usecases -name "*UseCase.ts" | grep -v __tests__ | while read file; do
  # Fix cases where EventBus is first parameter (incorrect)
  sed -i 's/private eventBus?: EventBus,\(.*\)private \([^:]*\):/private \2:\n    private eventBus?: EventBus,/' "$file"
done

echo "Constructor parameter order fixed"
