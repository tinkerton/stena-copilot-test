// script.js

document.addEventListener('DOMContentLoaded', () => {
  // === 0. Hårdkodade värden ===
  const marketCode = 'se';
  const userLocale = 'sv-SE';

  // === 1. DOM-element ===
  const chatButton  = document.getElementById('chat-button');
  const chatWrapper = document.getElementById('chat-wrapper');
  const webchatDiv  = document.getElementById('webchat');
  if (!chatButton || !chatWrapper || !webchatDiv) {
    console.error('Saknar #chat-button, #chat-wrapper eller #webchat');
    return;
  }

  let initialized = false;
  let directLine;

  // === 2. Öppna chatten på knapptryck ===
  chatButton.addEventListener('click', async () => {
    chatWrapper.style.display = 'block';
    chatButton.style.display  = 'none';

    if (!initialized) {
      await initChat();
      initialized = true;
    }
  });

  // Stäng chatten om man klickar utanför
  document.addEventListener('click', e => {
    if (
      chatWrapper.style.display === 'block' &&
      !chatWrapper.contains(e.target) &&
      !chatButton.contains(e.target)
    ) {
      chatWrapper.style.display = 'none';
      chatButton.style.display  = 'flex';
    }
  });

  // === 3. InitChat-funktion ===
  async function initChat() {
    // 3.1 Hämta DirectLine-url & token
    const tokenEndpoint = new URL(
      'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
      'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
    );
    const apiVersion = tokenEndpoint.searchParams.get('api-version');
    let dlUrl, dlToken;

    try {
      [ dlUrl, dlToken ] = await Promise.all([
        fetch(new URL(`/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`, tokenEndpoint))
          .then(r => { if (!r.ok) throw r.status; return r.json(); })
          .then(j => j.channelUrlsById.directline),
        fetch(tokenEndpoint)
          .then(r => { if (!r.ok) throw r.status; return r.json(); })
          .then(j => j.token)
      ]);
    } catch (err) {
      console.error('Kunde inte hämta DirectLine-info:', err);
      webchatDiv.innerHTML =
        '<p style="color:red; padding:1em;">Chatt kunde inte laddas. Försök igen senare.</p>';
      return;
    }

    // 3.2 Skapa DirectLine
    directLine = WebChat.createDirectLine({
      domain: `${dlUrl}/v3/directline`,
      token: dlToken
    });

    // 3.3 Rendera Web Chat
    WebChat.renderWebChat(
      {
        directLine,
        locale: userLocale,
        styleOptions: { hideUploadButton: true },
      },
      webchatDiv
    );

    // 3.4 Vänta på online, skicka context + startConversation
    directLine.connectionStatus$
      .subscribe(status => {
        // 2 = Online
        if (status === 2) {
          // a) Sätt kontext
          directLine.postActivity({
            type: 'event',
            name: 'pvaSetContext',
            value: { marketCode, userLocale }
          }).subscribe();

          // b) Triggera välkomst­meddelandet
          directLine.postActivity({
            type: 'event',
            name: 'startConversation',
            value: {}
          }).subscribe();
        }
      });
  }
});
