#!/bin/bash

# Batch integration script for EventBus
USECASES=(
  "src/usecases/storage/InitializeMasterPasswordUseCase.ts"
  "src/usecases/system-settings/ResetSystemSettingsUseCase.ts"
  "src/usecases/websites/SaveWebsiteWithAutomationVariablesUseCase.ts"
  "src/usecases/xpaths/DuplicateXPathUseCase.ts"
  "src/usecases/sync/ExecuteScheduledSyncUseCase.ts"
)

for usecase in "${USECASES[@]}"; do
  if ! grep -q "EventBus" "$usecase"; then
    echo "Processing: $usecase"
    # Add EventBus import
    sed -i '1a import { EventBus } from '\''@domain/events/EventBus'\'';' "$usecase"
    # Add EventBus parameter to constructor (simplified pattern)
    sed -i 's/constructor(/constructor(\n    private eventBus?: EventBus,/' "$usecase"
  fi
done
