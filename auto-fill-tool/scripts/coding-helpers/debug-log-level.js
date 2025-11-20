// Debug script to check current log level setting
// Run this in the browser console (F12) on any extension page

(async () => {
  try {
    const result = await chrome.storage.local.get('systemSettings');
    console.log('=== System Settings ===');
    console.log('Raw data:', result);

    if (result.systemSettings) {
      const settings = JSON.parse(result.systemSettings);
      console.log('Parsed settings:', settings);
      console.log('Log Level:', settings.logLevel);
      console.log('Log Level Names: 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR, 4=NONE');

      if (settings.logLevel === 4) {
        console.warn('⚠️ Log level is set to NONE (4) - no logs will be displayed!');
      }
    } else {
      console.log('No system settings found - using defaults');
      console.log('Default log level should be INFO (1)');
    }
  } catch (error) {
    console.error('Error reading system settings:', error);
  }
})();
