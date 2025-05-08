// script.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) DOM elements
  const chatButton  = document.getElementById('chat-button');
  const chatWrapper = document.getElementById('chat-wrapper');
  const webchatDiv  = document.getElementById('webchat');

  if (!chatButton || !chatWrapper || !webchatDiv) {
    console.error('Missing required chat DOM elements');
    return;
  }

  // 2) Hard-coded context values
  const currentLanguage   = 'sv-SE';
  const currentMarketCode = 'se';
  const currentTestCode   = 'se'; // your testCode value

  let chatInitialized = false;
  let directLine;

  // 3) On icon click, show chat and initialize once
  chatButton.addEventListener('click', async () => {
    chatWrapper.style.display = 'block';
    chatButton.style.display = 'none';

    if (!chatInitialized) {
      await initChat();
      chatInitialized = true;
    }
  });

  // 4) Hide chat when clicking outside
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

  // 5) Initialize Web Chat & send globals via store
  async function initChat() {
    // 5a) Build token URL
    const tokenEndpointURL = new URL(
      'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
      'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
    );
    const apiVersion = tokenEndpointURL.searchParams.get('api-version');

    // 5b) Fetch DirectLine URL & token
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
    } catch (err) {
      console.error('Failed to fetch DirectLine data:', err);
      webchatDiv.innerHTML = '<p style="color:red; padding:1em;">Chatt kunde inte laddas.</p>';
      return;
    }

    // 5c) Create DirectLine
    directLine = window.WebChat.createDirectLine({
      domain: `${directLineURL}/v3/directline`,
      token
    });

    // 5d) Create store that sends pvaSetContext on connect
    const store = window.WebChat.createStore(
      {},
      ({ dispatch }) => next => action => {
        if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
          dispatch({
            type: 'WEB_CHAT/SEND_EVENT',
            payload: {
              name: 'pvaSetContext',
              value: {
                'marketCode': currentMarketCode,
                'testCode':   currentTestCode
              }
            }
          });
        }
        return next(action);
      }
    );

    // 5e) Render Web Chat once
    window.WebChat.renderWebChat(
      {
        directLine,
        store,
        locale: currentLanguage,
        styleOptions: { hideUploadButton: true }
      },
      webchatDiv
    );
  }
});
