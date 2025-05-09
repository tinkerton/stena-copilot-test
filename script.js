// Encapsulate code using an IIFE (Immediately Invoked Function Expression) to avoid global variables
(async function() {

  // === 1. Constants and UI Elements ===
  // Get references to necessary HTML elements
  const chatButton = document.getElementById('chat-button');
  const chatWrapper = document.getElementById('chat-wrapper');


  // DirectLine token endpoint URL for your Copilot/PVA instance
  const tokenEndpointURL = new URL(
    'https://157c0ba005bf48ddb4295b82e6a597.6b.environment.api.powerplatform.com/' +
    'powervirtualagents/botsbyschema/cre45_stinaCopilotPoc/directline/token?api-version=2022-03-01-preview'
  );
  const apiVersion = tokenEndpointURL.searchParams.get('api-version');


  // === 2. API/Initialization ===
  // Asynchronously fetch the DirectLine token and regional URL
  // This is done once when the script loads
  const [directLineURL, token] = await Promise.all([
    fetch(
      new URL(
        `/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`,
        tokenEndpointURL
      )
    ).then(res => res.json()).then(json => json.channelUrlsById.directline),
    fetch(tokenEndpointURL).then(res => res.json()).then(json => json.token)
  ]);

  // Create the DirectLine instance for communication with the bot
  const directLine = WebChat.createDirectLine({
    domain: new URL('v3/directline', directLineURL),
    token
  });


  // === 3. Styling Configuration ===
  // Define basic styling options for the Web Chat control.
  // For the latest and complete list, see official Web Chat documentation.
  const styleOptions = {
    // === Common Settings ===
    hideUploadButton: true,         // Hide the file upload button in the message box
    accent: '#FF0000',              // Accent color (e.g., send button)
    suggestedActionLayout: 'stacked', // Layout for suggested actions: 'stacked' (vertical) or 'carousel' (horizontal)

    // === Examples of other styling options (commented out, uncomment/fill as needed) ===
    // These are common hooks for customizing the appearance.
    // rootHeight: '500px',          // Total height of the chat control
    // rootWidth: '350px',           // Total width of the chat control
    // rootFontSize: '14px',         // Base font size for the chat
    // rootFontFamily: 'Segoe UI',    // Base font family

    // bubbleBackground: '',         // Background color for all message bubbles (bot and user)
    // bubbleTextColor: '',          // Text color inside all message bubbles
    // bubbleBorderRadius: '10px',   // Standard border radius for all bubbles

    // bubbleFromUserBackground: '', // Background color for user's message bubbles
    // bubbleFromUserTextColor: '',  // Text color inside user's bubbles
    // bubbleFromUserBorderRadius: '', // Border radius for user's bubbles (if different from default)

    // bubbleFromBotBackground: '',  // Background color for bot's message bubbles
    // bubbleFromBotTextColor: '',   // Text color inside bot's bubbles
    // bubbleFromBotBorderRadius: '',// Border radius for bot's bubbles (if different from default)

    // suggestedActionsBackground: '', // Background color for the container holding suggested action buttons
    // suggestedActionsBorderColor: '',// Border color for suggested actions container
    // suggestedActionsBorderStyle: '',// Border style for suggested actions container (e.g., 'solid', 'dashed')
    // suggestedActionsBorderWidth: '',// Border width for suggested actions container

    // suggestedActionBackground: '',  // Background color for individual suggested action buttons
    // suggestedActionBorderColor: '', // Border color for suggested action buttons
    // suggestedActionBorderStyle: '', // Border style for suggested action buttons
    // suggestedActionBorderWidth: '', // Border width for suggested action buttons
    // suggestedActionBorderRadius: '20px', // Border radius for suggested action buttons
    // suggestedActionHeight: '40px',    // Height for suggested action buttons
    // suggestedActionImageHeight: '20px',// Height for images in suggested actions (if any)
    // suggestedActionImageWidth: '20px', // Width for images in suggested actions
    // suggestedActionLabelColor: '',    // Text color for suggested action buttons
    // suggestedActionHoverBackground: '', // Background color when mouse hovers over a button
    // suggestedActionPressedBackground: '',// Background color when a button is pressed

    // sendBoxBackground: '',        // Background color for the message box (where user types)
    // sendBoxBorderColor: '',       // Border color for the message box
    // sendBoxBorderWidth: '',       // Border width for the message box
    // sendBoxTextColor: '',         // Text color in the message box
    // sendBoxPlaceholderColor: '',  // Color for placeholder text in the message box

    // activityHeight: '',           // Height for message activities
    // activityWidth: '',            // Width for message activities
    // stackHeight: '',              // Total height of the message stack (conversation)
  };

  // Generate styleSet and apply deep overrides for more specific styling
  const styleSet = WebChat.createStyleSet(styleOptions);

  // Custom styling for bot's bubbles
  styleSet.bubbleFromBot = {
    background: 'rgb(238, 238, 238)',
    margin: '7px 0 0 0',
    width: 'auto',
    maxWidth: '100%', // Ensure bubble does not exceed container width
    padding: '10px 14px',
    borderRadius: '10px 10px 10px 0px', // Top-left, Top-right, Bottom-right, Bottom-left
    whiteSpace: 'normal' // Allow text wrapping
  };

  // Custom styling for suggested actions container (vertical stack)
  styleSet.suggestedActionsContainer = {
    display: 'flex',
    flexDirection: 'column', // Stack suggested actions vertically
    alignItems: 'center', // Center buttons horizontally
    maxWidth: '380px', // Maximum width for the container
    width: '100%' // Use full width up to max width
  };

  // Custom styling for individual suggested action buttons
  styleSet.suggestedAction = {
    width: '100%', // Buttons take full width within their container
    backgroundColor: 'transparent', // Transparent background
    border: 'thin dashed rgb(212, 212, 212)', // Thin dashed border
    color: 'black', // Text color
    minWidth: '100px', // Minimum width for the button
    margin: '10px 0 0 0', // Margin above the button
    padding: '10px 14px', // Internal padding
    borderRadius: '20px', // Heavily rounded corners
    textAlign: 'center', // Center text horizontally
    fontSize: '1em', // Standard font size
    cursor: 'pointer', // Mouse cursor changes to pointer on hover
    display: 'flex', // Use flexbox to center content
    alignItems: 'center', // Center content vertically
    justifyContent: 'center' // Center content horizontally
  };


  // === 4. Helper Functions ===
  // Renders the Web Chat with the specified locale and sends initial marketCode
  function renderChat(locale) {
    document.documentElement.lang = locale || "en"; // Set page language attribute

    // Render the Web Chat control into the div with id="webchat"
    WebChat.renderWebChat(
      {
        directLine,       // DirectLine instance for communication
        locale,           // Language code
        styleOptions,     // Basic styling options
        styleSet          // The generated styleSet with deep overrides
        // You can also add userID, username here if needed
      },
      document.getElementById('webchat')
    );

    // Send the 'startConversation' event to the bot including initial settings
    directLine.postActivity({
      type: 'event',              // Activity type is 'event'
      name: 'pvaSetContext',  // Event name (standard for PVA/Copilot on start)
      locale: locale,                     // Current locale
      localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Current timezone
      value: {                    // Optional data object to send with the event
          marketCode: 'EXTERNAL MARKET 0" // The current market value at start
      }
    }).subscribe({
      next: (id) => console.log("pvaSetContext activity skickad med ID: ", id),
      error: (err) => console.error('Misslyckades med att skicka pvaSetContext activity:', err)
    });
  }


  // === 5. Event Handlers (UI Interaction) ===
  // Show the chat window when the chat button is clicked
  chatButton.addEventListener('click', () => {
    chatWrapper.style.display = 'block';
    chatButton.style.display = 'none';
  });

  // Hide the chat window when clicking outside of it, the button, and the settings
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

  /*
setTimeout(directLine.postActivity({
      type: 'event',
      name: 'userSettings', // Event name your bot listens for updates
      value: {
           'marketCode': 'EXTERNAL marketCode', // Send the new value
            marketCode: 'EXTERNAL marketCode 2'
      }
    }),300);
  */


  // === 6. Entry Point ===
  // Wait until the DOM is fully loaded before running the script
  document.addEventListener('DOMContentLoaded', () => {
     // Initial rendering of the chat
     renderChat(languageSelect.value || 'en');
  });

})();
