import { Api } from './api.ts';
import { getChannel } from './config.ts';

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
    {name: "hallo",handler: ({username}) => this.sendSimpleMessage("Hallo @" + username )},
    {name: "Hallo",handler: ({username}) => this.sendSimpleMessage("Hallo @" + username )},
    {name: "!lurk",handler: ({username}) => this.sendSimpleMessage(username + " ist jetzt im lurk!")},
    {name: "!emoteonly",handler: ({id,isMod}) => this.toggleEmoteOnly(id,isMod,true)},
    {name: "!emoteonlyoff",handler: ({id,isMod}) => this.toggleEmoteOnly(id,isMod,false)},
    {name: "!osu",handler: (message: string) => this.sendSimpleMessage("Mein osu Profil: https://osu.ppy.sh/users/26798140")},
    {name: "!timeout",handler: ({args}) => this.timeout(args)},
    {name: "!ban",handler: ({isMod,args}) => this.ban(isMod,args)},
    {name: "!unban",handler: ({isMod,args}) => this.unban(isMod,args)},
  ]

  public timedMessages: TimedMessage[] = [
    { message: "halo Lasst gerne ein Follow da! HaltEinfachDeineFresseDuHurensohn",time: 300000},
  ]

  constructor() {
    this.api = new Api();
    this.api.initBotData().then(() => {
      this.onMessage();
      //this.initTimedMessages();
    });
  }

  async toggleEmoteOnly(id: string,isMod: boolean,emoteMode: boolean) {
    if (!isMod) {
      return;
    }
    await this.api.toggleEmoteOnlyMode(this.api.botData.id,id,emoteMode);
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

  async ban(isMod: string,args: string[]) {
    if (args.length == 0) {
      return;
    }
    const idFromUserToBan = args[0];
    this.api.banUser(this.api.botData.id,this.api.broadcasterId,idFromUserToBan,"test");

  }
  async unban(isMod: string,args: string[]) {
    if (args.length == 0) {
      return;
    }
    const idFromUserToUnban = args[0];
    this.api.unbanUser(this.api.botData.id,this.api.broadcasterId,idFromUserToUnban);

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

  async sendSimpleMessage(message: string) {
    await this.api.sendMessage(message, this.channel)
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
      foundCommand.handler({ username: data.username,args: args,message: data.message.trim(),isMod: data.isMod,id: data.id});
    });
  }

}

new Bot();
