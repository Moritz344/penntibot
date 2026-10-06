import { getClientId, getToken as readToken, getUsername } from "./config.ts";

interface BotData {
  id: number,
  token: string,
  username: string
}

export class Api {
  public baseUrl = "https://api.twitch.tv/helix";
  public clientId = getClientId();

  private botData: BotData = {
    id: 0,
    token: "",
    username: ""
  }
  private socket?: WebSocket;


  constructor() {}

  async initBotData() {
    this.botData = {
      token: readToken(),
      id: 1143105765,
      username: getUsername()
    }
  }

  async connect(channel: string,onMessage: (message: {message: string,username: string}) => void) {
    console.log(this.botData.username + " ist mit (" + channel + "'s) chat verbunden")
    this.socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    this.socket.addEventListener("open", () => {
      this.socket!.send(`PASS oauth:${this.botData.token}`);
      this.socket!.send(`NICK ${this.botData.username}`);
      this.socket!.send(`JOIN #${channel}`);
      this.socket!.send(
        "CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership",
      );
      this.socket!.send("CAP REQ :twitch.tv/membership");
    });

    this.socket.addEventListener("message",(event: any) => {
      const raw = event.data as string;
      const match = raw.match(/^(@[^ ]+ )?:(\w+)!.* PRIVMSG #\w+ :(.+)/);
      if (!match) { return; }
      const [, tagSection, user, message] = match;
      onMessage({
        message: message,
        username: user
      });
    })

  }

  async sendMessage(message: string,channel: string) {
    this.socket.send(`PRIVMSG #${channel} :${message}`);
  }

  disconnect() {}
}
