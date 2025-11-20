// Script to reset log level to INFO (1)
// Run this in the browser console (F12) on any extension page

(async () => {
  try {
    const result = await chrome.storage.local.get('systemSettings');

    if (result.systemSettings) {
      const settings = JSON.parse(result.systemSettings);
      console.log('Current log level:', settings.logLevel);

      settings.logLevel = 1; // Set to INFO

      await chrome.storage.local.set({
        systemSettings: JSON.stringify(settings, null, 2)
      });

      console.log('✅ Log level reset to INFO (1)');
      console.log('Please reload the extension pages to apply changes');
    } else {
      console.log('No system settings found');
    }
  } catch (error) {
    console.error('Error resetting log level:', error);
  }
})();
