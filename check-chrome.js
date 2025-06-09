const { exec } = require('child_process');

exec('which chromium-browser', (error, stdout, stderr) => {
  if (error) {
    console.log(`Error finding chromium-browser: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`chromium-browser path: ${stdout.trim()}`);
});

exec('which chromium', (error, stdout, stderr) => {
  if (error) {
    console.log(`Error finding chromium: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`chromium path: ${stdout.trim()}`);
});

exec('which google-chrome', (error, stdout, stderr) => {
  if (error) {
    console.log(`Error finding google-chrome: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`google-chrome path: ${stdout.trim()}`);
});
