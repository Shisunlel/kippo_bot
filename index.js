const express = require('express')
const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const axios = require("axios");
const dayjs = require("dayjs");
const app = express()
const port = 80

dotenv.config();

const token = process.env.BOT_TOKEN;
const youtubeToken = process.env.YOUTUBE_TOKEN;
const api = process.env.API;
const youtubeApi = process.env.YOUTUBE_API;
const kippo = new TelegramBot(token, { polling: true });

kippo.onText(/\/help/, (msg) => {
  kippo.sendMessage(msg.chat.id, `What would you like to know?`, {
    reply_markup: {
      keyboard: [
        ["Get Latest Payments"],
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
  // console.log(msg.chat.id)
  const option = {
    payments: "get-latest-payments",
    video: "get-latest-upload-video",
    watchList: "get-watch-list",
    bestAnime: "get-best-anime",
  };
  const res = msg.text.toString().toLowerCase().replace(/ /g, "-");
  switch (res) {
    case option.payments:
      // latest sales
      const res = getRecord();
      res.then((data) => {
        const mode = "HTML";
        const paydate = new Date(`${data.payment_date}`).toLocaleDateString(
          "km-KH"
        );
        const forMonth = dayjs(`${data.payment_for}`).format("MMMM/YYYY");
        const template = `<b>ថ្ងៃបង់ប្រាក់: ${paydate}</b>\n\n<em>សម្រាប់ខែ: ${forMonth}</em>\n\nលេខបន្ទប់: ${
          data.rooms_id
        }\n\nភ្លើង: ${toKHR(data.energy_cost)}៛\n\nទឹក: ${toKHR(
          data.water_cost
        )}៛\n\nសរុបជាលុយខ្មែរ: ${toKHR(
          data.total_amount_kh
        )}៛\n\nសរុបជាដុល្លារ: $${toUSD(data.total_amount_us)}`;
        if (data.id) {
          kippo.sendMessage(msg.chat.id, template, {
            parse_mode: mode,
          });
        }
      });
      break;
    case option.video:
      // latest video
      const youtubeVideo = getLatestVideo();
      youtubeVideo.then((data) => {
        const uri = `https://youtube.com/watch?v=${data.items[0]?.id?.videoId}`
        kippo.sendMessage(msg.chat.id, uri);
      });
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
        `Thank you for choosing our service, ${msg.from?.first_name}!`
      );
      break;
  }
});

async function getRecord() {
  try {
    const res = await axios.get(`${api}/record`);
    return res.data;
  } catch (error) {
    console.error(error);
  }
}

async function getLatestVideo() {
  const params = {
    part: "snippet",
    channelId: "UCO7ByfyndHuYKrauMEbBRVQ",
    order: "date",
    type: "video",
    key: youtubeToken,
    maxResults: 1,
  };
  try {
    const res = await axios.get(`${youtubeApi}/search`, { params });
    return res.data;
  } catch (error) {
    console.error(error);
  }
}

function toKHR(val) {
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 });
}

function toUSD(val) {
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

app.get('/', (req, res) => {
  res.send('Hey there');
})

app.listen(env.process.PORT || port, () => {
  console.log('app is listening on port ' + port)
})