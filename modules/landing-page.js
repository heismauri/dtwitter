const landingPage = (shortcutId, shortcutName, supportedVersions) => {
  const downcaseShortcutName = shortcutName.toLowerCase();
  const assetPath = 'https://www.heismauri.com/assets/shortcuts';
  const shortcutAssetPath = `${assetPath}/${downcaseShortcutName}`;
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="pragma" content="no-cache">
        <title>${shortcutName} - heismauri</title>
        <meta name="description" content="Download videos, photos and GIFs from Twitter, it also works with the Siri Shortcut ${shortcutName} which can be downloaded on RoutineHub">
        <link rel="shortcut icon" href="${shortcutAssetPath}/icon.png">
        <link rel="stylesheet" rel="preload" as="style" href="${assetPath}/style.css">
        <script defer src="${shortcutAssetPath}/downloader.js"></script>
        <script>
          const currentVersion = '${supportedVersions[supportedVersions.length - 1]}'
        </script>
      </head>
      <body>
        <main class="container text-center ${downcaseShortcutName}">
          <header>
            <h1 class="py-4 m-0">${shortcutName}</h1>
            <img class="d-block mx-auto shortcut-icon" width="200" height="200" alt="${shortcutName}'s shortcut icon" srcset="${shortcutAssetPath}/icon-x2.png 2x, ${shortcutAssetPath}/icon-x3.png 3x" src="${shortcutAssetPath}/icon.png">
            <p class="py-4 m-0">This API also works with the Siri Shortcut <strong>"${shortcutName}"</strong> which can be downloaded on <a href="https://routinehub.co/shortcut/${shortcutId}/">RoutineHub</a><i class="fa-solid fa-heart visually-hidden"></i></p>
          </header>
          <p class="m-0"><i>The web downloader is still in Beta, make sure to report any errors!</i></p>
          <form id="downloader-form" class="form-group w-100 d-flex my-4" action="#">
            <input class="downloader-url w-100 me-2" type="text" name="url" placeholder="Your ${shortcutName} link goes here!">
            <button id="downloader-submit" class="btn btn-download" type="submit">Download</button>
          </form>
          <div id="downloader-media"></div>
          <a class="btn btn-kofi fw-normal mx-auto my-4" href="https://ko-fi.com/heismauri">Love <strong>${shortcutName}</strong>? <i class="fa-regular fa-heart"></i> Buy me a Ko-fi!</a>
        </main>
        <footer class="copyright text-center my-4 m-0">
          <a class="text-decoration-none" href="https://www.heismauri.com/">www.heismauri.com</a>
        </footer>
      </body>
    </html>
  `;
};

export default landingPage;
