import { serve } from "bun";

function getScopes(): string {
  return [
    "chat:edit",
    "moderator:manage:announcements",
    "moderation:read",
    "moderator:read:chatters",
    "channel:manage:moderators",
    "channel:manage:polls",
    "user:write:chat",
    "chat:read",
    "user:read:follows",
  ].join(" ");
}

const CALLBACK_HTML = `<!DOCTYPE html>
<html>
<body>
  <script>
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    if (token) {
      fetch("/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      }).then(() => {
        document.body.innerHTML = "<h1>Login successful! You can close this tab.</h1>";
      });
    } else {
      document.body.innerHTML = "<h1>No token received.</h1>";
    }
  </script>
</body>
</html>`;


export function startServerForAuth(): Promise<{ token: string }> {
  return new Promise((resolve) => {
    const scopes = getScopes();
    const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=eqcr5oabbujnlwczlzkzumrdqomek3&redirect_uri=http://localhost:3000/callback&scope=${encodeURIComponent(scopes)}`;

    console.log("Please login: " + authUrl);

    serve({
      port: 3000,
      async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/callback") {
          return new Response(CALLBACK_HTML, {
            headers: { "Content-Type": "text/html" },
          });
        }

        if (req.method === "POST" && url.pathname === "/token") {
          const body: any = await req.json();
          const token = body.token;
          console.log(token);

          resolve({ token });

          return new Response("OK");
        }

        return new Response("Hello from Bun OAuth2 Server!");
      },
    });
  });
}
startServerForAuth();
