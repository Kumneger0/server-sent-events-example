function getUserName() {
  const name = prompt("What is your name?");
  if (!name) return getUserName();

  return name;
}

const me = {
  name: getUserName(),
  id: crypto.randomUUID(),
};

hanldeSSEConnction();

type User = {
  id: string;
  name: string;
};

type Message = {
  message: string;
  id: string;
  name: string;
};

let users: User[] = [];

function showUsers(users: User[]) {
  users.forEach((user) => showUser(user));
}

function hanldeSSEConnction() {
  const eventSource = new EventSource(`/sse?id=${me.id}&name=${me.name}`);
  eventSource.addEventListener("message", (event) => {
    const data = JSON.parse(event.data) as Message;
    showMessage(data);
  });
  eventSource.addEventListener("new-user", (event) => {
    const user = JSON.parse(event.data) as User;
    console.log(user);
    showUser(user);
    showUserJoinAndLeaveMessage(user, true);
  });
  eventSource.addEventListener("all-users", (event) => {
    const data = JSON.parse(event.data) as User[];
    showUsers(data);
  });

  eventSource.addEventListener("user-leave", (event) => {
    const data = JSON.parse(event.data) as User;
    users = users.filter(({ id }) => data.id !== id);
    usersContainer?.childNodes.forEach((node) => node.remove());
    showUsers(users);
    showUserJoinAndLeaveMessage(data, false);
  });
}

const usersContainer = document.getElementById("users-container");
const messagesContainer = document.getElementById("message-container");
const mySelfContainer = document.getElementById("me");
const form = document.getElementById("form");
const userAvatarContainer = document.getElementById(
  "me-avtar"
) as HTMLSpanElement;

const messageInput = document.getElementById(
  "message-input"
) as HTMLTextAreaElement;
const messageButton = document.getElementById("send-button");

messageButton?.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (e) => {
  const key = e.key === "Enter";
  if (key) sendMessage();
});

async function sendMessage() {
  const message = messageInput.value;
  messageInput.value = "";
  if (!message) {
    alert("Please enter a message");
    return;
  }
  const response = await fetch("/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      message,
      id: me.id,
      name: me.name,
    } satisfies Message).toString(),
  });
  const data = await response.json();
  console.log(data);
}

showMySelf();

function showUserJoinAndLeaveMessage(user: User, isJoin: boolean) {
  const div = document.createElement("div");
  div.classList.add(
    "text-muted-foreground",
    "w-full",
    "text-[0.8em]",
    "text-center",
    isJoin ? "bg-slate-400" : "bg-red-400",
    "rounded-xl"
  );
  div.innerText = `${user.name == me.name ? "You" : user.name} ${
    isJoin ? "joined" : "leaved"
  } chat`;
  messagesContainer?.appendChild(div);
}

function showMySelf() {
  const name = document.createElement("div");
  if (mySelfContainer) {
    name.innerText = me.name!;
    name.classList.add("font-medium");
    const onlineStatus = document.createElement("div");
    onlineStatus.classList.add("text-muted-foreground", "text-sm");
    onlineStatus.innerText = "Online";
    const img = document.createElement("img");
    img.setAttribute("class", "aspect-square h-full w-full");
    img.src =
      img.src = `https://api.dicebear.com/9.x/initials/svg?seed=${me.name}`;

    userAvatarContainer.appendChild(img);

    mySelfContainer.appendChild(name);
    mySelfContainer.appendChild(onlineStatus);
  }
}

function showUser(user: User) {
  if (user.id === me.id) return;
  const userContainer = document.createElement("div");
  userContainer.classList.add("flex", "items-center", "gap-3");

  const imgSpan = document.createElement("span");
  imgSpan.classList.add(
    "relative",
    "flex",
    "shrink-0",
    "overflow-hidden",
    "rounded-full",
    "w-8",
    "h-8"
  );
  const img = document.createElement("img");
  img.classList.add("aspect-square", "h-full", "w-full");
  img.src = `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`;
  imgSpan.appendChild(img);

  const userNameDiv = document.createElement("div");
  userNameDiv.classList.add("font-medium");
  userNameDiv.textContent = user.name;

  const userStatusDiv = document.createElement("div");
  userStatusDiv.classList.add("text-muted-foreground", "text-sm");
  userStatusDiv.textContent = "Online";

  userContainer.appendChild(imgSpan);
  userContainer.appendChild(userNameDiv);
  userContainer.appendChild(userStatusDiv);

  usersContainer?.appendChild(userContainer);
}

function showMessage(message: Message) {
  const messageContainer = document.createElement("div");
  messageContainer.classList.add("flex", "items-start", "gap-4");

  const imgSpan = document.createElement("span");
  imgSpan.classList.add(
    "relative",
    "flex",
    "shrink-0",
    "overflow-hidden",
    "rounded-full",
    "w-8",
    "h-8"
  );
  const img = document.createElement("img");
  img.classList.add("aspect-square", "h-full", "w-full");
  img.src = `https://api.dicebear.com/9.x/initials/svg?seed=${message?.name}`;
  imgSpan.appendChild(img);

  const messageContentDiv = document.createElement("div");
  messageContentDiv.classList.add(
    "bg-muted",
    "rounded-lg",
    "p-3",
    "min-w-[80%]",
    message.id === me.id ? "bg-slate-400" : "justify-start"
  );
  const senderNameDiv = document.createElement("div");
  senderNameDiv.classList.add("font-medium");
  senderNameDiv.textContent = message.id == me.id ? "You" : message.name;

  const messageTextDiv = document.createElement("div");
  messageTextDiv.textContent = message.message;

  const timestampDiv = document.createElement("div");
  timestampDiv.classList.add("text-xs", "text-muted-foreground", "mt-1");
  timestampDiv.textContent = new Date().toLocaleTimeString();

  messageContentDiv.appendChild(senderNameDiv);
  messageContentDiv.appendChild(messageTextDiv);
  messageContentDiv.appendChild(timestampDiv);
  messageContainer.appendChild(imgSpan);
  messageContainer.appendChild(messageContentDiv);

  messagesContainer?.appendChild(messageContainer);
  messageContainer.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "start",
  });
}
