document.addEventListener('DOMContentLoaded', () => {
  const chatButton   = document.getElementById('chat-button');
  const chatWrapper  = document.getElementById('chat-wrapper');
  const webchatDiv   = document.getElementById('webchat');

  const currentMarketCode = 'se';
  const currentLanguage   = 'sv-SE';

  let chatInitialized = false;
  let directLine;

  chatButton.addEventListener('click', async () => {
    chatWrapper.style.display = 'block';
    chatButton.style.display = 'none';

    if (!chatInitialized) {
      await initChat();
      chatInitialized = true;
    }
  });

  document.addEventListener('click', e => {
    if (
      chatWrapper.style.display === 'block' &&
      !chatWrapper.contains(e.target) &&
      !chatButton.contains(e.target)
    ) {
      chatWrapper.style.display = 'none';
      chatButton.style.display = 'flex';
    }
  });

  async function initChat() {
    const tokenEndpoint = new URL(
      'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
      'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
    );
    const apiVersion = tokenEndpoint.searchParams.get('api-version');

    let directLineURL, token;
    try {
      [directLineURL, token] = await Promise.all([
        fetch(new URL(`/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`, tokenEndpoint))
          .then(res => res.json())
          .then(json => json.channelUrlsById.directline),
        fetch(tokenEndpoint)
          .then(res => res.json())
          .then(json => json.token)
      ]);
    } catch (err) {
      console.error('Kunde inte hämta DirectLine-data:', err);
      webchatDiv.innerHTML =
        '<p style="color:red; padding:1em;">Kunde inte ladda chatten. Försök igen senare.</p>';
      return;
    }

    directLine = window.WebChat.createDirectLine({
      domain: `${directLineURL}/v3/directline`,
      token
    });

    window.WebChat.renderWebChat(
      {
        directLine,
        locale: currentLanguage,
        styleOptions: { hideUploadButton: true }
      },
      webchatDiv
    );

    // När DirectLine är online: skicka kontext och trigga start
    directLine.connectionStatus$.subscribe(status => {
      console.log('pvaSetContext and marketCode is' + currentMarketCode)
      if (status === 2) {
        directLine.postActivity({
          type: 'event',
          name: 'pvaSetContext',
          value: {
            'marketCode': currentMarketCode
          }
        }).subscribe();

        directLine.postActivity({
          type: 'event',
          name: 'startConversation',
          value: {}
        }).subscribe();
      }
    });
  }
});
