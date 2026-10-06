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

  async getBroadcasterData(channel: string | null) {
    try {
      const url = "/users?login=" + channel;
      const data = await fetch(this.baseUrl + url, {
        headers: {
          Authorization: `Bearer ${this.botData.token}`,
          "Client-Id": this.clientId,
        },
      });
      return data.json();
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async sendMessage(message: string,channel: string) {
    try {
      const broadcasterData: any = await this.getBroadcasterData(channel);
      const broadcasterId = broadcasterData.data[0].id;

      const bodyData = {
        channel: channel,
        message: message,
        sender_id: this.botData.id,
        broadcaster_id: broadcasterId,
      }

      const data = await fetch(this.baseUrl + "/chat/messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.botData.token}`,
            "Client-Id": this.clientId,
            "Content-Type": "application/json"
          },body: JSON.stringify(bodyData),
     });

      return data.json();
    } catch (error) {
      console.log(error);
    }

  }

  disconnect() {}
}
