import { Api } from './api.ts';
import { getChannel } from './config.ts';

// TODO: !timeout,!ban

interface ChatMessage {
  username: string,
  message: string
}

interface CommandContext {
  username: string,
  args: string[],
  message: string
}

interface Command {
  name: string,
  handler: (ctx: CommandContext) => void
}

interface TimedMessage {
  message: string,
  time: number
}

class Bot {
  public api!;
  public channel: string = getChannel();

  public commands: Command[] = [
    {name: "!rhythia",handler: (message: string) => this.sendSimpleMessage("Mein Rhythia Profil: https://www.rhythia.com/player/393679 ")},
    {name: "!github",handler: (message: string) => this.sendSimpleMessage("Mein Github Profil: https://github.com/Moritz344 ")},
    {name: "LOL",handler: (message: string) => this.sendSimpleMessage("LOL")},
    {name: "!lurk",handler: ({username}) => this.sendSimpleMessage(username + " ist jetzt im lurk!")},
    {name: "!osu",handler: (message: string) => this.sendSimpleMessage("Mein osu Profil: https://osu.ppy.sh/users/26798140")},
    {name: "!timeout",handler: ({args}) => this.timeout(args)},
    {name: "!ban",handler: ({args}) => this.ban(args)},
  ]

  public timedMessages: TimedMessage[] = [
    { message: "halo Lasst gerne ein Follow da! HaltEinfachDeineFresseDuHurensohn",time: 300000},
  ]

  constructor() {
    this.api = new Api();
    this.api.initBotData().then(() => {
      this.onMessage();
      this.initTimedMessages();
    });
  }

  async greeting() {
    await this.sendSimpleMessage("Hallo!");
  }

  timeout(args: string[]) {
    if (args.length < 1) {
      return;
    }
    const name = args[0];
    const time = args[1];
    console.log("args:",args);
  }

  ban(args: string[]) {
    if (args.length < 1) {
      return;
    }
    const name = args[0];
    console.log("args:",args);

  }

  startTimer(timed: TimedMessage,onFinished: () => void) {
    setTimeout(() => {
      onFinished();
      this.startTimer(timed,() => onFinished());
      console.log("Timed message gesendet: " + timed.message);
    },timed.time)
  }

  initTimedMessages() {
    for (const timed of this.timedMessages) {
      this.startTimer(timed,() => this.sendSimpleMessage(timed.message));
    }
  }

  async sendRhythiaLink() {
    await this.api.sendMessage("Mein Rhythia Profil: https://www.rhythia.com/player/393679", this.channel)
  }

  async sendGithubLink() {
    await this.api.sendMessage("Mein Github Profil: https://github.com/Moritz344 ", this.channel)
  }

  async sendSimpleMessage(message: string) {
    await this.api.sendMessage(message, this.channel)
  }

  async helpCommand() {
    let messageToSend = "";
    for (const cmd of this.commands) {
      messageToSend += "\n" + cmd.name + " - " + cmd.description + "\n";
    }
    await this.api.sendMessage(messageToSend, this.channel)
  }

  onMessage() {
    this.api.connect(this.channel,(data: ChatMessage) => {
      if (data.username == this.api.botData.username) { return; }
      const [command,...args] = data.message.split(" ");
      const foundCommand = this.commands.find((cmd: Command) => cmd.name == command);
      if (!foundCommand) {
        return;
      }
      console.log(data.username + ": " + data.message);
      foundCommand.handler({ username: data.username,args: args,message: data.message});
    });
  }

}

new Bot();
