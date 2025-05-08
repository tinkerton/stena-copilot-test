// script.js

document.addEventListener('DOMContentLoaded', () => {
  // 1) Grab your DOM elements
  const chatButton  = document.getElementById('chat-button');
  const chatWrapper = document.getElementById('chat-wrapper');
  const webchatDiv  = document.getElementById('webchat');

  if (!chatButton || !chatWrapper || !webchatDiv) {
    console.error('Missing chat DOM elements');
    return;
  }

  // 2) Your hard-coded context values
  const currentMarketCode = 'ie';
  const currentTestCode   = 'ie';
  const currentLanguage   = 'en-IE';

  let chatInitialized = false;
  let directLine;

  // 3) Show chat & init on click
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

  // 5) Bootstraps Web Chat, sends both pvaSetContext + webchat/join
  async function initChat() {
    // 5a) Build token endpoint URL
    const tokenEndpointURL = new URL(
      'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
      'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
    );
    const apiVersion = tokenEndpointURL.searchParams.get('api-version');

    // 5b) Fetch DirectLine URL & token in parallel
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

    // 5c) Create the DirectLine client
    directLine = window.WebChat.createDirectLine({
      domain: `${directLineURL}/v3/directline`,
      token
    });

    // 5d) Create a store that dispatches ONLY pvaSetContext on CONNECT_FULFILLED
  const store = window.WebChat.createStore(
    {},
    ({ dispatch }) => next => action => {
      if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
        // 1) Initialize globals (This is CORRECT and RECOMMENDED)
        console.log("1 Initialize globals - DIRECT_LINE/CONNECT_FULFILLED");
        dispatch({
          type: 'WEB_CHAT/SEND_EVENT',
          payload: {
            name: 'pvaSetContext',
            value: {
              'marketCode': 'se', //marketCode
              'testCode':   currentTestCode
            }
          }
        });
        console.log('pvaSetContext dispatched via store.'); // Added console log for confirmation

        // 2) Trigger the built-in Conversation Start (REMOVE THIS BLOCK)
        /*
        dispatch({
          type: 'WEB_CHAT/SEND_EVENT',
          payload: {
            name: 'webchat/join', // This event is not standard for triggering Conversation Start
            value: {}
          }
        });
        */
      }

      return next(action);
      }
    );

    // 5e) Render Web Chat exactly once
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
