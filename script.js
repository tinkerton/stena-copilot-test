(async function () {
  // 1) Fetch your DirectLine token
  const tokenEndpoint =
    'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
    'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview';

  const { token } = await fetch(tokenEndpoint).then(r => r.json());

  // 2) Create DirectLine and render Web Chat
  const directLine = window.WebChat.createDirectLine({ token });
  window.WebChat.renderWebChat(
    { directLine },
    document.getElementById('webchat')
  );

  // 3) Toggle chat on/off
  const chatButton  = document.getElementById('chat-button');
  const chatWrapper = document.getElementById('chat-wrapper');

  chatButton.addEventListener('click', () => {
    chatWrapper.style.display = 'block';
    chatButton.style.display  = 'none';
  });

  document.addEventListener('click', e => {
    if (
      chatWrapper.style.display === 'block' &&
      !chatWrapper.contains(e.target) &&
      !chatButton.contains(e.target)
    ) {
      chatWrapper.style.display = 'none';
      chatButton.style.display  = 'inline-block';
    }
  });
})();
