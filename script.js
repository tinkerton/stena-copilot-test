// Encapsulate code using an IIFE (Immediately Invoked Function Expression) to avoid global variables
(async function() {

  // === 1. Constants and UI Elements ===
  // Get references to necessary HTML elements
  const languageSelect = document.getElementById('language-select');
  const marketSelect = document.getElementById('market-select');
  const chatButton = document.getElementById('chat-button');
  const chatWrapper = document.getElementById('chat-wrapper');
  const globalSettings = document.getElementById('global-settings');

  // DirectLine token endpoint URL for your Copilot/PVA instance
  const tokenEndpointURL = new URL(
    'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
    'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
  );
  const apiVersion = tokenEndpointURL.searchParams.get('api-version');

  // === 2. API/Initialization ===
  const [directLineURL, token] = await Promise.all([
    fetch(
      new URL(
        `/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`,
        tokenEndpointURL
      )
    ).then(res => res.json()).then(json => json.channelUrlsById.directline),
    fetch(tokenEndpointURL).then(res => res.json()).then(json => json.token)
  ]);

  const directLine = WebChat.createDirectLine({
    domain: new URL('v3/directline', directLineURL),
    token
  });

  // === 3. Styling Configuration ===
  const styleOptions = {
    hideUploadButton: true,
    accent: '#FF0000',
    suggestedActionLayout: 'stacked',
  };

  const styleSet = WebChat.createStyleSet(styleOptions);

  styleSet.bubbleFromBot = {
    background: 'rgb(238, 238, 238)',
    margin: '7px 0 0 0',
    width: 'auto',
    maxWidth: '100%',
    padding: '10px 14px',
    borderRadius: '10px 10px 10px 0px',
    whiteSpace: 'normal'
  };

  styleSet.suggestedActionsContainer = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '380px',
    width: '100%'
  };

  styleSet.suggestedAction = {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'thin dashed rgb(212, 212, 212)',
    color: 'black',
    minWidth: '100px',
    margin: '10px 0 0 0',
    padding: '10px 14px',
    borderRadius: '20px',
    textAlign: 'center',
    fontSize: '1em',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // === 4. Helper Functions ===
  function renderChat(locale) {
    document.documentElement.lang = locale;

    const currentMarketCode = marketSelect.value.toLowerCase();

    const store = WebChat.createStore({}, ({ dispatch }) => next => action => {
      if (action.type === 'DIRECT_LINE/CONNECT_FULFILLED') {
        dispatch({
          type: 'WEB_CHAT/SEND_EVENT',
          payload: {
            name: 'pvaSetContext',
            value: {
              "marketCode": currentMarketCode
            }
          }
        });
        console.log('pvaSetContext event dispatched via store middleware for market:', currentMarketCode);
      }
      return next(action);
    });

    WebChat.renderWebChat(
      {
        directLine,
        store,
        locale,
        styleOptions,
        styleSet
      },
      document.getElementById('webchat')
    );
  }

  // === 5. Event Handlers (UI Interaction) ===
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
    renderChat(languageSelect.value);
  });

  marketSelect.addEventListener('change', () => {
    directLine.postActivity({
      type: 'event',
      name: 'userSettings',
      value: {
        Global: {
          marketCode: marketSelect.value.toLowerCase()
        }
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    renderChat(languageSelect.value || 'en');
  });

})(); // Correctly close the IIFE
