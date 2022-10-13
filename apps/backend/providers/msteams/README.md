# MS Teams

## Testing Render

### Setup

1. [Download ngrok](https://ngrok.com/download).
1. [Download Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases/tag/v4.11.0) and install it.
1. Git clone the [sample repo](https://github.com/Microsoft/BotBuilder-Samples) and check out to `v3-sdk-samples`.
1. In your IDE, navigate to `Node/core-proactiveMessages/simpleSendMessage/`.
1. Run `npm install`.
1. Run `npm start`.
1. Start the Bot Framework Emulator.
1. Go to the Settings Gear in the lower left
1. Set the path to ngrok, and enable both options below.
1. Choose **Open Bot**
1. For the Bot URL, use `http://localhost:3978/api/messages`
1. Click Connect.

Type a message, and if it works, you will see the bot send something back to you after a delay.

### Passing in Messages

1. In the `index.js` file of the above folder, look for the function `sendProactiveMessage`.
1. Edit the message that you pass into the bot.
1. Ensure that `bot.send(msg)` is still in the function
1. Restart the bot example.

#### Example

```javascript
var msg = new builder.Message().address(address);
msg.text(
  "From the bot la la la\n\n\n\nHere is **bold text**\n\n\n\n_Italics here_"
);
msg.textFormat("markdown");

bot.send(msg);
```
