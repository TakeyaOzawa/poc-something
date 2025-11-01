#!/bin/bash

# Get all remaining UseCases without EventBus
REMAINING_USECASES=$(find src/usecases -name "*UseCase.ts" | grep -v __tests__ | xargs grep -L "EventBus")

for usecase in $REMAINING_USECASES; do
  echo "Integrating EventBus into: $usecase"
  
  # Add EventBus import after the last import line
  sed -i '/^import.*from/a import { EventBus } from '\''@domain/events/EventBus'\'';' "$usecase"
  
  # Add EventBus parameter to constructor (find constructor and add parameter)
  sed -i '/constructor(/,/)/ {
    /constructor(/ {
      N
      s/constructor(/constructor(\n    private eventBus?: EventBus,/
    }
  }' "$usecase"
done

echo "Batch integration completed for $(echo "$REMAINING_USECASES" | wc -l) UseCases"
