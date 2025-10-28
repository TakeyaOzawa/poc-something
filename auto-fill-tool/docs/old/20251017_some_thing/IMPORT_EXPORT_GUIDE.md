# CSV Import/Export Guide

## Overview
This guide explains the correct procedure for exporting and importing data when reinstalling the extension.

## Data Model Architecture

The extension stores data in three separate entities with dependencies:

```
Website (parent entity)
 ├── AutomationVariables (references websiteId)
 └── XPaths (references websiteId)
```

## Export Procedure

When exporting data before uninstalling:

1. Export **Websites** → `websites_YYYYMMDD_HHMMSS.csv`
2. Export **Automation Variables** → `automation-variables_YYYYMMDD_HHMMSS.csv`
3. Export **XPaths** → `xpaths_YYYYMMDD_HHMMSS.csv`

**Note**: Keep all three files together for import.

## Import Procedure (IMPORTANT)

After reinstalling the extension, **you must import in this specific order**:

### ⚠️ Critical: Import Order Matters!

```
1. Import Websites FIRST
   ↓
2. Import Automation Variables SECOND
   ↓
3. Import XPaths THIRD
```

### Why Order Matters

- **XPaths** contain `websiteId` field that references Website records
- **Automation Variables** contain `websiteId` field that references Website records
- If you import XPaths or Automation Variables before Websites, the `websiteId` references will point to non-existent records
- This causes "orphaned" data that won't display correctly in the UI

## Current Import Validation

### Integration Test Results ✅

All integration tests pass when imports are done in the correct order:

```
✓ should export and import websites correctly
✓ should export and import XPaths with websiteId references
✓ should export and import automation variables with websiteId references
```

### Current Limitations ❌

1. **No dependency validation**: System doesn't check if referenced Websites exist before importing XPaths/AutomationVariables
2. **No user guidance**: UI doesn't indicate the required import order
3. **Silent failures**: Orphaned records may be created without error messages

## CSV File Formats

### Websites CSV Format
```csv
id,name,start_url,updated_at,editable
website-001,Test Site 1,https://example.com,2025-01-15T10:30:00.000Z,true
```

Fields:
- `id`: Unique identifier (UUID)
- `name`: Website display name
- `start_url`: Optional starting URL
- `updated_at`: Last update timestamp (ISO 8601)
- `editable`: Whether the website can be edited (true/false)

### XPaths CSV Format
```csv
id,website_id,value,action_type,after_wait_seconds,action_pattern,path_absolute,path_short,path_smart,selected_path_pattern,retry_type,execution_order,execution_timeout_seconds,url
xpath-001,website-001,{{username}},type,0,0,/html/body/div/input,//*[@id="username"],//input[@name="username"],smart,0,1,30,https://example.com/login
```

Key field:
- `website_id`: **References a Website by its id** (dependency)

### Automation Variables CSV Format
```csv
"id","status","updatedAt","variables","websiteId"
"av-001","enabled","2025-01-15T10:30:00.000Z","{\"username\":\"test\",\"password\":\"pass\"}","website-001"
```

Key field:
- `websiteId`: **References a Website by its id** (dependency)

## Troubleshooting Import Failures

### Symptom: XPaths don't appear after import

**Cause**: XPaths were imported before Websites

**Solution**:
1. Clear browser storage (Developer Tools → Application → Storage → Clear site data)
2. Re-import in correct order: Websites → Automation Variables → XPaths

### Symptom: "Import Success" message but data not showing

**Cause**: Orphaned records with invalid websiteId references

**Solution**:
1. Export current data to backup
2. Clear storage
3. Re-import in correct order

## Recommended Improvements (Future Work)

1. **Add dependency validation** in import use cases:
   ```typescript
   // Before importing XPaths, verify all websiteIds exist
   const missingWebsites = xpaths
     .map(x => x.websiteId)
     .filter(id => !websiteCollection.hasId(id));

   if (missingWebsites.length > 0) {
     throw new Error(
       `Cannot import XPaths: Referenced websites not found (${missingWebsites.join(', ')}). ` +
       `Please import Websites CSV first.`
     );
   }
   ```

2. **Add UI guidance** showing required import order

3. **Create "Import All" feature** that:
   - Accepts multiple CSV files
   - Auto-detects formats
   - Imports in correct dependency order
   - Shows progress for each step

4. **Add export bundling** to create a single ZIP file containing all CSVs

## Testing

Run integration tests to verify import/export functionality:

```bash
npm test -- ExportImportFlow.test.ts
```

This test suite verifies:
- Data can be exported to CSV
- Storage can be cleared (simulating reinstallation)
- Data can be imported from CSV
- IDs are preserved
- Referential integrity (websiteId) is maintained
- Correct import ordering works properly
