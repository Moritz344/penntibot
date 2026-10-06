import { Api } from './api.ts';
import { getChannel } from './config.ts';

interface ChatMessage {
  username: string,
  message: string
}

interface Command {
  name: string,
  description: string,
  handler: (args?: string[]) => void
}

class Bot {
  public api!;
  public channel: string = getChannel();

  public commands: Command[] = [
    {name: "!help",description: "Zeigt alle Befehle",handler: () => this.help()}
  ]

  constructor() {
    this.api = new Api();
    this.api.initBotData().then(() => {
      this.onMessage();
    });
  }

  greeting() {}

  async help() {
    let messageToSend = "";
    for (const cmd of this.commands) {
      messageToSend += cmd.name + " - " + cmd.description;
    }
    await this.api.sendMessage(messageToSend, this.channel)
  }

  onMessage() {
    this.api.connect(this.channel,(data: ChatMessage) => {
      console.log(data.username + ": " + data.message);
      if (data.username == this.api.botData.username) { return; }
      const [command,...args] = data.message.split(" ");
      const foundCommand = this.commands.find((cmd: Command) => cmd.name == command);
      if (!foundCommand) {
        return;
      }
      foundCommand.handler(args);
    });
  }

}

new Bot();
