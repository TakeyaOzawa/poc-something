#!/bin/bash

# Function to fix simple missing brace files
fix_simple_files() {
    local files=(
        "src/usecases/automation-variables/GetLatestAutomationResultUseCase.ts"
        "src/usecases/automation-variables/SaveAutomationResultUseCase.ts"
        "src/usecases/recording/DeleteOldRecordingsUseCase.ts"
        "src/usecases/recording/GetRecordingByResultIdUseCase.ts"
        "src/usecases/storage/CheckUnlockStatusUseCase.ts"
        "src/usecases/storage/ExecuteStorageSyncUseCase.ts"
        "src/usecases/storage/ExportStorageSyncConfigsUseCase.ts"
        "src/usecases/storage/GetAllStorageSyncConfigsUseCase.ts"
        "src/usecases/storage/InitializeMasterPasswordUseCase.ts"
        "src/usecases/storage/LockStorageUseCase.ts"
        "src/usecases/storage/UnlockStorageUseCase.ts"
        "src/usecases/system-settings/ImportSystemSettingsUseCase.ts"
        "src/usecases/system-settings/ResetSystemSettingsUseCase.ts"
        "src/usecases/system-settings/UpdateSystemSettingsUseCase.ts"
        "src/usecases/websites/ExportWebsitesUseCase.ts"
        "src/usecases/websites/GetAllWebsitesUseCase.ts"
        "src/usecases/websites/GetWebsiteByIdUseCase.ts"
        "src/usecases/websites/ImportWebsitesUseCase.ts"
        "src/usecases/websites/SaveWebsiteUseCase.ts"
        "src/usecases/websites/UpdateWebsiteStatusUseCase.ts"
        "src/usecases/websites/UpdateWebsiteUseCase.ts"
        "src/usecases/xpaths/DeleteXPathUseCase.ts"
        "src/usecases/xpaths/DuplicateXPathUseCase.ts"
        "src/usecases/xpaths/ExportXPathsUseCase.ts"
        "src/usecases/xpaths/GetAllXPathsUseCase.ts"
        "src/usecases/xpaths/GetXPathsByWebsiteIdUseCase.ts"
        "src/usecases/xpaths/SaveXPathUseCase.ts"
        "src/usecases/xpaths/UpdateXPathUseCase.ts"
    )
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            echo "Checking $file for simple fixes..."
            # Add missing closing braces if the file ends without proper closure
            if ! tail -1 "$file" | grep -q '}$'; then
                echo "}" >> "$file"
                echo "Fixed missing closing brace in $file"
            fi
        fi
    done
}

fix_simple_files
