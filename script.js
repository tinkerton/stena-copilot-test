// script.js

// === Entry point ===
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Get & validate DOM elements
  const languageSelect = document.getElementById('language-select');
  const marketSelect   = document.getElementById('market-select');
  const chatButton     = document.getElementById('chat-button');
  const chatWrapper    = document.getElementById('chat-wrapper');
  const globalSettings = document.getElementById('global-settings');
  const webchatDiv     = document.getElementById('webchat');

  if (!languageSelect || !marketSelect || !chatButton || !chatWrapper || !globalSettings || !webchatDiv) {
    console.error('Missing one or more required DOM elements.');
    return;
  }

  // 2. Fetch DirectLine URL & token
  const tokenEndpointURL = new URL(
    'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
    'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
  );
  const apiVersion = tokenEndpointURL.searchParams.get('api-version');

  let directLineURL, token;
  try {
    [ directLineURL, token ] = await Promise.all([
      fetch(new URL(`/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`, tokenEndpointURL))
        .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(json => json.channelUrlsById.directline),
      fetch(tokenEndpointURL)
        .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(json => json.token)
    ]);
    if (!directLineURL || !token) {
      throw new Error('DirectLine URL or token missing');
    }
  } catch (err) {
    console.error('Initialization error:', err);
    webchatDiv.innerHTML = '<p style="color: red; padding: 1em;">Chattfunktionen kunde inte laddas. Försök igen senare.</p>';
    return;
  }

  // 3. Create DirectLine & style settings (once)
  const directLine = WebChat.createDirectLine({
    domain: `${directLineURL}/v3/directline`,
    token
  });

  const styleOptions = {
    hideUploadButton: true,
    accent: '#FF0000',
    suggestedActionLayout: 'stacked'
  };

  const styleSet = WebChat.createStyleSet(styleOptions);
  styleSet.bubbleFromBot = {
    ...styleSet.bubbleFromBot,
    background: 'rgb(238, 238, 238)',
    margin: '7px 0 0 0',
    maxWidth: '100%',
    padding: '10px 14px',
    borderRadius: '10px 10px 10px 0px',
    whiteSpace: 'normal'
  };
  styleSet.suggestedActionsContainer = {
    ...styleSet.suggestedActionsContainer,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '380px'
  };
  styleSet.suggestedAction = {
    ...styleSet.suggestedAction,
    width: '100%',
    backgroundColor: 'transparent',
    border: 'thin dashed rgb(212, 212, 212)',
    color: 'black',
    padding: '10px 14px',
    borderRadius: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // 4. Create store to send context + join event once on connect
  const store = WebChat.createStore(
    {},
    ({ dispatch }) => next => action => {
      if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
        const mc = marketSelect.value.toLowerCase();
        const ul = languageSelect.value || 'en-GB';

        // a) Send context
        dispatch({
          type: 'WEB_CHAT/SEND_EVENT',
          payload: {
            name: 'pvaSetContext',
            value: { marketCode: mc, userLocale: ul }
          }
        });

        // b) Trigger welcome (OnConversationStart)
        dispatch({
          type: 'WEB_CHAT/SEND_EVENT',
          payload: {
            name: 'webchat/join',
            value: {}
          }
        });
      }
      return next(action);
    }
  );

  // 5. Render Web Chat a single time
  WebChat.renderWebChat(
    {
      directLine,
      store,
      locale: languageSelect.value || 'en-GB',
      styleOptions,
      styleSet
    },
    webchatDiv
  );

  // 6. UI Event handlers (only send events, do NOT re-render)
  chatButton.addEventListener('click', () => {
    chatWrapper.style.display = 'block';
    chatButton.style.display = 'none';
  });

  document.addEventListener('click', e => {
    if (
      chatWrapper.style.display === 'block' &&
      !chatWrapper.contains(e.target) &&
      !chatButton.contains(e.target) &&
      !globalSettings.contains(e.target)
    ) {
      chatWrapper.style.display = 'none';
      chatButton.style.display = 'flex';
    }
  });

  languageSelect.addEventListener('change', () => {
    const newLocale = languageSelect.value || 'en-GB';
    document.documentElement.lang = newLocale;

    directLine.postActivity({
      type: 'event',
      name: 'pvaSetContext',
      value: {
        marketCode: marketSelect.value.toLowerCase(),
        userLocale: newLocale
      }
    }).subscribe({
      next: id => console.log('pvaSetContext sent for locale change, id:', id),
      error: err => console.error('Error sending pvaSetContext (locale):', err)
    });
  });

  marketSelect.addEventListener('change', () => {
    const newMarket = marketSelect.value.toLowerCase();
    const currentLocale = languageSelect.value || 'en-GB';

    directLine.postActivity({
      type: 'event',
      name: 'pvaSetContext',
      value: {
        marketCode: newMarket,
        userLocale: currentLocale
      }
    }).subscribe({
      next: id => console.log('pvaSetContext sent for market change, id:', id),
      error: err => console.error('Error sending pvaSetContext (market):', err)
    });
  });
});
