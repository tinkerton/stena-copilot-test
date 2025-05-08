// script.js

document.addEventListener('DOMContentLoaded', async () => {
  // === 0. Hard-coded settings ===
  const marketCode = 'uk';     // Your market code
  const userLocale = 'en-GB';  // Your locale

  // === 1. Fetch DirectLine URL & token ===
  const tokenEndpoint = new URL(
    'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
    'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
  );
  const apiVersion = tokenEndpoint.searchParams.get('api-version');

  let directLineURL, token;
  try {
    [ directLineURL, token ] = await Promise.all([
      fetch(new URL(`/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`, tokenEndpoint))
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(json => json.channelUrlsById.directline),
      fetch(tokenEndpoint)
        .then(res => res.ok ? res.json() : Promise.reject(res.status))
        .then(json => json.token)
    ]);
  } catch (err) {
    console.error('Failed to fetch DirectLine info:', err);
    document.getElementById('webchat').innerHTML =
      '<p style="color:red; padding:1em;">Chatt kunde inte laddas. Försök igen senare.</p>';
    return;
  }

  // === 2. Create DirectLine instance ===
  const directLine = WebChat.createDirectLine({
    domain: `${directLineURL}/v3/directline`,
    token
  });

  // === 3. Render Web Chat once ===
  WebChat.renderWebChat(
    {
      directLine,
      locale: userLocale,
      styleOptions: { hideUploadButton: true },
    },
    document.getElementById('webchat')
  );

  // === 4. Send initial context + join after connection ===
  directLine.connectionStatus$
    .subscribe(status => {
      // 2 = Online
      if (status === 2) {
        // a) send context
        directLine.postActivity({
          type: 'event',
          name: 'pvaSetContext',
          value: { marketCode, userLocale }
        }).subscribe();

        // b) trigger welcome
        directLine.postActivity({
          type: 'event',
          name: 'webchat/join',
          value: {}
        }).subscribe();
      }
    });
});
