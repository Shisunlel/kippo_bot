const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
dotenv.config();

const token = process.env.BOT_TOKEN;
const kippo = new TelegramBot(token, { polling: true });

kippo.onText(/\/test/, (msg) => {
  kippo.sendMessage(msg.chat.id, `What would you like to know?`, {
    reply_markup: {
      keyboard: [
        ["Get Latest Sales"],
        ["Get Latest Upload Video"],
        ["Get Watch List"],
        ["Get Best Anime"],
        ["Cancel"],
      ],
      one_time_keyboard: true,
    },
  });
});

kippo.on("message", (msg) => {
  const option = {
    sales: "get-latest-sales",
    video: "get-latest-upload-video",
    watchList: "get-watch-list",
    bestAnime: "get-best-anime",
  };
  const res = msg.text.toString().toLowerCase().replace(/ /g, "-");
  switch (res) {
    case option.sales:
      // latest sales
      break;
    case option.video:
      // latest video
      kippo.sendMessage(
        msg.chat.id,
        "https://youtu.be/OwgM5N_fJ9k",
      );
      break;
    case option.watchList:
      kippo.sendMessage(
        msg.chat.id,
        "[WatchList](https://anilist.co/user/Shisun/animelist/Watching)",
        { parse_mode: "MarkdownV2" }
      );
      // watch list
      break;
    case option.bestAnime:
      // best anime
      kippo.sendMessage(
        msg.chat.id,
        "https://anilist.co/anime/105333/dr-stone"
      );
      break;
    case "cancel":
      // cancel
      kippo.sendMessage(
        msg.chat.id,
        `Thank you for choosing our service, ${msg.chat?.first_name}!`
      );
      break;
  }
});
