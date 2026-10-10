import { getClientId, getToken as readToken, getUsername } from "./config.ts";

interface BotData {
  id: number,
  token: string,
  username: string
}

export class Api {
  public baseUrl = "https://api.twitch.tv/helix";
  public clientId = getClientId();
  public readonly broadcasterId = 451147363;

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

  async getUserId(login: string): Promise<string | undefined> {
    const res = await fetch(`${this.baseUrl}/users?login=${login}`, {
      headers: {
        Authorization: `Bearer ${this.botData.token}`,
        "Client-Id": this.clientId,
      },
    });
    if (!res.ok) return;
    const json: any = await res.json();
    return json.data[0]?.id;
}

  async banUser(moderator_id: string,broadcaster_id: string,user_id: string,reason: string) {
    const url = this.baseUrl + "/moderation/bans?broadcaster_id=" + broadcaster_id + "&moderator_id=" + moderator_id;
    try {
      const data = await fetch(url,{
        method: "POST",
        headers: {
           Authorization: `Bearer ${readToken()}`,
          "Client-Id": getClientId(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: { user_id: user_id,reason: reason }}),
      }) 
    } catch(error) {
      console.log(error);
    }

  }

    async unbanUser(moderator_id: string,broadcaster_id: string,user_id: string) {
    const url = this.baseUrl + "/moderation/bans?broadcaster_id=" + broadcaster_id + "&moderator_id=" + moderator_id + "&user_id=" + user_id;
    try {
      const data = await fetch(url,{
        method: "DELETE",
        headers: {
           Authorization: `Bearer ${readToken()}`,
          "Client-Id": getClientId(),
          "Content-Type": "application/json"
        }
      });
    } catch(error) {
      console.log(error);
    }

  }

  async toggleEmoteOnlyMode(moderator_id: string,broadcaster_id: string,emote_mode: boolean) {
    const url = this.baseUrl + "/chat/settings?broadcaster_id=" + broadcaster_id + "&moderator_id=" + moderator_id;
    try {
      const data = await fetch(url,{
        method: "PATCH",
        headers: {
           Authorization: `Bearer ${readToken()}`,
          "Client-Id": getClientId(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ emote_mode: emote_mode }),
      })
      const response = data.json();
    } catch(error) {
      console.log(error);
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
      const [, tagSection,user, message ] = match;
      let isMod = false;
      if (tagSection.split(";").includes("mod=1") || user == "pennti") {
        isMod = true;
      }
      const id = tagSection.split("user-id=")[1].split(";")[0];
      onMessage({
        message: message,
        username: user,
        isMod: isMod,
        id: id
      });
    })

  }

  async sendMessage(message: string,channel: string) {
    this.socket.send(`PRIVMSG #${channel} :${message}`);
  }

  disconnect() {}
}
