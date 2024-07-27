import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { streamSSE, SSEStreamingApi, stream } from "hono/streaming";
const app = new Hono();

const users: { id: string; name: string; stream: SSEStreamingApi }[] = [];

app.get("/sse", async (c) => {
  const userID = c.req.query("id");
  const name = c.req.query("name");

  if (!userID || !name) {
    return c.text("id and name are required");
  }

  return streamSSE(c, async (stream) => {
    stream.writeSSE({
      event: "all-users",
      data: JSON.stringify(users.map((u) => ({ id: u.id, name: u.name }))),
    });

    users.forEach(({ stream }) => {
      stream.writeSSE({
        data: JSON.stringify({
          id: userID,
          name,
        }),
        event: "new-user",
      });
    });

    users.push({ id: userID, name, stream });

    stream.onAbort(() => {
      users.splice(
        users.findIndex((u) => u.id === userID),
        1
      );
      users.forEach((user) =>
        user.stream.writeSSE({
          data: JSON.stringify({ id: userID, name }),
          event: "user-leave",
        })
      );
      console.log(`user ${userID} disconnected`);
    });

    while (true) {
      await stream.writeSSE({
        data: users
          .map((u) => ({
            id: u.id,
            name: u.name,
          }))
          .join("\n"),
        event: "users",
        id: String(Math.random()),
      });
      await stream.sleep(2000);
    }
  });
});

app.get("/api", async (c) => {
  return c.text("Hello, world!");
});

app.post("/message", async (c) => {
  const body = (await c.req.parseBody()) as {
    message: string;
    id: string;
    name: string;
  };
  users.forEach((user) => {
    user.stream.writeSSE({
      data: JSON.stringify(body),
      event: "message",
    });
  });
  return c.json(body);
});

app.get(
  "*",
  serveStatic({
    root: "./public",
  })
);
export default {
  port: 5000,
  fetch: app.fetch,
};
