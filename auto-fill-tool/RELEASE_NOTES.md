# Auto Fill Tool - Release Notes

## Version 2.5.0 - Security & Data Sync Update

**Release Date**: 2025-01-18
**Status**: Ready for Release

---

## 🎉 What's New

### 🔐 Enhanced Security Features

Your data is now fully protected with military-grade encryption!

#### Master Password Protection
- **One Password to Rule Them All**: Create a single master password to encrypt all your sensitive data
- **Real-Time Strength Indicator**: Visual feedback ensures you create a strong password
- **Auto-Lock**: Automatically locks after inactivity to keep your data safe
- **Brute-Force Protection**: Account locks after 5 failed attempts to prevent unauthorized access

#### Under the Hood
- **AES-256-GCM Encryption**: Bank-level encryption for all stored data
- **Zero Plaintext Storage**: No sensitive information is ever stored unencrypted
- **Session-Based Access**: Data only accessible when you unlock it

### 🔄 Data Synchronization Features

Keep your automation data in sync across devices and platforms!

#### Sync Your Data Anywhere
- **Multiple Sync Methods**:
  - 📊 **CSV Files**: Import/export data as spreadsheet files
  - 🗄️ **External Databases**: Sync with Notion, Google Sheets, or custom APIs

- **Flexible Sync Options**:
  - **Bidirectional**: Changes sync both ways
  - **Receive Only**: Pull data from external source
  - **Send Only**: Push data to external source

- **Automatic or Manual**:
  - **Manual Sync**: Sync when you want, with one click
  - **Scheduled Sync**: Set up automatic periodic synchronization

#### What You Can Sync
- ✅ Automation Variables (credentials, API keys, configuration)
- ✅ Website Configurations (URLs, settings)
- ✅ XPath Definitions (element selectors)
- ✅ System Settings

### 🎨 User Interface Improvements

#### Fixed Issues
1. **Settings Button Now Works**: The "設定" button on the data sync tab now properly opens configuration
2. **Consistent Design**: Sync manager screen now matches the look of other management screens
3. **Modern Form**: Updated sync configuration form with dynamic field management

#### New Features
- **Dynamic Form Fields**: Add/remove input and output fields easily with + and ✖ buttons
- **Conflict Resolution**: Choose how to handle data conflicts (latest wins, local priority, remote priority, or ask me)
- **Connection Testing**: Test your API connections before saving
- **Sync History**: View detailed history of all sync operations with filtering and cleanup options

---

## 📖 Quick Start Guide

### First Time Setup

#### Step 1: Create Your Master Password
1. Launch Auto Fill Tool - you'll see the master password setup screen
2. Create a strong password (minimum 8 characters, include uppercase, lowercase, numbers, and special characters)
3. Watch the strength indicator turn green
4. Confirm your password
5. Click "Create Master Password"

⚠️ **IMPORTANT**: There is NO password recovery. If you forget your master password, you'll lose access to all your data!

#### Step 2: Automatic Data Migration
- Your existing data will be automatically encrypted
- A backup is created before migration
- Wait for the "Migration Complete" message
- You're all set!

### Setting Up Data Sync

#### Option 1: CSV Sync
1. Go to **System Settings** → **Data Sync** tab
2. Click the **"設定"** button for the data you want to sync
3. Click **"新規作成"** (New Config)
4. Fill in:
   - Storage Key: Choose what to sync (automationVariables, websiteConfigs, xpaths)
   - Sync Method: Select **"CSV (ファイル)"**
   - Sync Direction: Choose bidirectional, receive only, or send only
   - Encoding: UTF-8 (recommended), Shift-JIS, or EUC-JP
5. Click **"保存"** (Save)
6. Use **"CSVエクスポート"** to export or **"CSVインポート"** to import

#### Option 2: External API Sync (Notion Example)
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration and copy your API key
3. In Auto Fill Tool:
   - Go to **System Settings** → **Data Sync** tab
   - Click the **"設定"** button
   - Click **"新規作成"** (New Config)
4. Fill in:
   - Storage Key: `automationVariables`
   - Sync Method: **"DB (API)"**
   - Sync Timing: Manual or Periodic (e.g., every 30 minutes)
   - Sync Direction: bidirectional
5. Add Input:
   - Key: `apiKey`
   - Value: `secret_xxxxxxxxxxxxxxxxxxxx` (your Notion API key)
6. Add Outputs: (Define what fields you expect from Notion)
   - Key: `id`, Default Value: (leave empty)
   - Key: `name`, Default Value: (leave empty)
   - Key: `value`, Default Value: (leave empty)
7. Set Conflict Resolution: "Latest Timestamp" (recommended)
8. Click **"保存"** (Save)

For detailed API setup guides, see:
- `docs/user-guides/データ同期/API_CONFIGURATION_EXAMPLES.md`

---

## 🔧 What Changed

### For Existing Users

#### ⚠️ Breaking Changes
- **Master Password Required**: You MUST create a master password when upgrading
- **Sync Config Update**: Old sync configurations need to be recreated with the new inputs/outputs structure
- **Data Migration**: First launch will migrate your data (automatic backup created)

#### Migration Steps
1. **Backup Your Data** (recommended):
   - Before upgrading, export all your automation variables, websites, and XPaths as CSV
   - Store backups in a safe location

2. **Upgrade**:
   - Install the new version
   - Create your master password when prompted
   - Wait for automatic migration to complete

3. **Verify**:
   - Check that all your data is accessible
   - Test your automation workflows
   - Recreate any sync configurations if you had them

#### Rollback (if needed)
If something goes wrong during migration:
1. Go to **System Settings**
2. Look for migration backup options
3. Click "Restore from Backup"

---

## 📚 Documentation

### User Guides
- **[User Manual](docs/user-guides/データ同期/USER_MANUAL.md)**: Complete guide to data sync features
- **[API Setup Examples](docs/user-guides/データ同期/API_CONFIGURATION_EXAMPLES.md)**: Step-by-step for Notion, Google Sheets, custom APIs
- **[CSV Format Guide](docs/user-guides/データ同期/CSV_FORMAT_EXAMPLES.md)**: CSV format specifications and examples

### Technical Documentation
- [IMPLEMENTATION_PLAN.md](docs/外部データソース連携/IMPLEMENTATION_PLAN.md): Project implementation details
- [SECURITY_DESIGN.md](docs/外部データソース連携/SECURITY_DESIGN.md): Security architecture
- [STORAGE_SYNC_DESIGN.md](docs/外部データソース連携/STORAGE_SYNC_DESIGN.md): Sync feature design

---

## 🐛 Known Issues

1. **E2E Tests**: Not fully tested with real external APIs (Notion, Google Sheets)
   - Recommendation: Test your sync configurations carefully before relying on them

2. **Large Datasets**: Performance with >10,000 records not validated
   - Recommendation: Use smaller batches or consider manual sync for very large datasets

3. **CSV Periodic Sync**: Not supported yet (manual sync only for CSV)
   - Workaround: Use manual sync or switch to API-based sync for automation

4. **CORS Restrictions**: Some APIs may not work due to browser security
   - Workaround: Use APIs that properly support CORS headers

---

## 💡 Tips & Best Practices

### Security Tips
1. **Choose a Strong Master Password**:
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - NOT something easy to guess

2. **Remember Your Password**:
   - Write it down and store it safely (NOT on your computer)
   - Consider using a password manager
   - There is NO password recovery

3. **Regular Backups**:
   - Export your data as CSV regularly
   - Store backups in multiple secure locations
   - Test restoring from backup occasionally

### Sync Best Practices
1. **Start with Manual Sync**:
   - Test your configuration with manual sync first
   - Switch to periodic sync only after verifying it works

2. **Test Connection Before Saving**:
   - Always use the "Test Connection" button
   - Fix any errors before enabling sync

3. **Handle Conflicts Wisely**:
   - "Latest Timestamp": Best for collaborative editing
   - "Local Priority": Best when local data is more important
   - "Remote Priority": Best when external source is source of truth

4. **Monitor Sync History**:
   - Check the History tab regularly
   - Clean up old history to save storage space
   - Investigate any failed syncs

---

## 🆘 Troubleshooting

### "I forgot my master password!"
**Solution**: Unfortunately, there is no password recovery. You'll need to:
1. Uninstall the extension
2. Reinstall it (this will erase all encrypted data)
3. Import your data from CSV backups (if you have them)
4. Create a new master password

### "Data migration failed!"
**Solution**:
1. Check Chrome console for error messages
2. Try the rollback option in System Settings
3. If rollback fails, reinstall and import from CSV backup

### "Sync is not working!"
**Troubleshooting steps**:
1. Click "Test Connection" - does it succeed?
2. Check your API key/credentials are correct
3. Verify the API endpoint URL is correct
4. Check sync history for error messages
5. Ensure your internet connection is stable

### "The '設定' button doesn't work!"
**Solution**: This is fixed in version 2.5.0! Make sure you've upgraded.

### "Form fields are missing!"
**Solution**: The form structure changed in 2.5.0. Old configurations need to be recreated with the new inputs/outputs structure.

---

## 🙏 Feedback & Support

### Report Issues
If you encounter bugs or have feature requests:
- File an issue on GitHub: [github.com/your-repo/auto-fill-tool/issues]
- Include:
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots if applicable
  - Browser version and OS

### Get Help
- Check the [User Manual](docs/user-guides/データ同期/USER_MANUAL.md) first
- Review [Troubleshooting](#-troubleshooting) section
- Check existing GitHub issues for similar problems

---

## 🎊 Thank You!

Thank you for using Auto Fill Tool! We've worked hard to make this release more secure and feature-rich. Your feedback and support help us improve.

**Enjoy the new features!** 🚀

---

**Version**: 2.5.0
**Release Date**: 2025-01-18
**Build**: Production-ready
**License**: [Your License]
