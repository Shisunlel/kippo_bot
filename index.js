const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const axios = require("axios");
const dayjs = require("dayjs");
const app = express();
const port = 3000;

dotenv.config();

const token = process.env.BOT_TOKEN;
const youtubeToken = process.env.YOUTUBE_TOKEN;
const api = process.env.API;
const youtubeApi = process.env.YOUTUBE_API;
const kippo = new TelegramBot(token, { polling: true });

let room_id, room_data, new_energy, new_water;

kippo.onText(/\/start/, (msg) => {
  const myChatId = 306355505;
  let keyboard;
  console.log(msg.chat)
  if (msg.chat.id == myChatId) {
    keyboard = [
      ["Process Payment", "Get Latest Payments", "Get Due Room"],
      ["Get Latest Upload Video", "Get Watch List", "Get Best Anime"],
      ["Contact", "Cancel"],
    ];
  } else {
    keyboard = [["Process Payment"], ["Contact"], ["Cancel"]];
  }
  kippo.sendMessage(msg.chat.id, `What would you like to do?`, {
    reply_markup: {
      keyboard,
      one_time_keyboard: true,
    },
  });
});

kippo.on("message", (msg) => {
  // console.log(msg.chat.id)
  const option = {
    processPayment: /process-payment/,
    payments: /get-latest-payments/,
    video: /get-latest-upload-video/,
    watchList: /get-watch-list/,
    bestAnime: /get-best-anime/,
    room: /r-\d+/,
    energy: /e-\d+/,
    water: /w-\d+/,
    contact: /contact/,
    cancel: /cancel/,
    due: /get-due-room/,
  };
  const res = msg.text.toString().toLowerCase().replace(/ /g, "-");
  trySwitch(option, res, msg);
});

async function trySwitch(option, res, msg) {
  switch (true) {
    case option.payments.test(res):
      // latest sales
      const response = getRecord();
      response.then((data) => {
        const mode = "HTML";
        const paydate = new Date(`${data.payment_date}`).toLocaleDateString(
          "km-KH"
        );
        const forMonth = dayjs(`${data.payment_for}`).format("MMMM/YYYY");
        const template = `<b>ថ្ងៃបង់ប្រាក់: ${paydate}</b>\n\n<em>សម្រាប់ខែ: ${forMonth}</em>\n\nលេខបន្ទប់: ${
          data.rooms_id
        }\n\nភ្លើង: ${toKHR(data.energy_cost)}៛\n\nទឹក: ${toKHR(
          data.water_cost
        )}៛\n\nអនាម័យ: $1.00\n\nសរុបជាលុយខ្មែរ: ${toKHR(
          data.total_amount_kh
        )}៛\n\nសរុបជាដុល្លារ: $${toUSD(data.total_amount_us)}`;
        if (data.id) {
          kippo.sendMessage(msg.chat.id, template, {
            parse_mode: mode,
          });
        }
      });
      break;
    case option.video.test(res):
      // latest video
      const youtubeVideo = getLatestVideo();
      youtubeVideo.then((data) => {
        const uri = `https://youtube.com/watch?v=${data.items[0]?.id?.videoId}`;
        kippo.sendMessage(msg.chat.id, uri);
      });
      break;
    case option.watchList.test(res):
      kippo.sendMessage(
        msg.chat.id,
        "[WatchList](https://anilist.co/user/Shisun/animelist/Watching)",
        { parse_mode: "MarkdownV2" }
      );
      // watch list
      break;
    case option.bestAnime.test(res):
      // best anime
      kippo.sendMessage(
        msg.chat.id,
        "https://anilist.co/anime/105333/dr-stone"
      );
      break;
    case option.cancel.test(res):
      // cancel
      kippo.sendMessage(
        msg.chat.id,
        `Thank you for choosing our service, ${msg.from?.first_name}!`
      );
      break;

    case option.contact.test(res):
      kippo.sendMessage(
        msg.chat.id,
        `ទំនាក់ទំនងតាមលេខទូរស័ព្ទខាងក្រោមនេះ\n\n[+85578266598]\n\n[+85598266598]\n\n[+85592422556]`,
        {
          parse_mode: "Markdown",
        }
      );
      break;

    case option.processPayment.test(res):
      kippo.sendMessage(
        msg.chat.id,
        "តើអ្នកស្នាក់នៅបន្ទប់លេខប៉ុន្មាន?(សូមគោរពតាមឧទាហរណ៍ខាងក្រោម)\n\nex: <b><i>r-10</i></b>",
        { parse_mode: "HTML" }
      );
      break;
    case option.room.test(res):
      room_id = res.slice(2);
      try {
        room_data = await getLatestRecordByRoom(room_id);
        if (room_data) {
          kippo.sendMessage(
            msg.chat.id,
            `សូមបញ្ចូលគីឡូភ្លើងខែថ្មី\n\nគីឡូភ្លើងខែចាស់: <b>${room_data.new_energy}\n\n</b>ex: <b><i>e-253</i></b>`,
            { parse_mode: "HTML" }
          );
        }
      } catch (error) {
        kippo.sendMessage(
          msg.chat.id,
          `${error.response.statusText || "Room Not Found"} `
        );
      }
      break;
    case option.energy.test(res):
      if (room_data) {
        new_energy = res.slice(2);
        if (room_data && new_energy >= room_data.new_energy) {
          kippo.sendMessage(
            msg.chat.id,
            `សូមបញ្ចូលចំនួនទឹកខែថ្មី\n\nលេខទឹកខែចាស់: <b>${room_data.new_water}</b>\n\nex: <b><i>w-21</i></b>`,
            { parse_mode: "HTML" }
          );
        } else {
          kippo.sendMessage(
            msg.chat.id,
            `សូមបញ្ចូលម្តងទៀត\n\nគីឡូភ្លើងខែចាស់: <b>${room_data.new_energy}</b>\n\nex: <b><i>w-21</i></b>`,
            { parse_mode: "HTML" }
          );
        }
      }

      break;
    case option.water.test(res):
      if (room_data) {
        new_water = res.slice(2);
        if (room_data && new_water >= room_data.new_water) {
          const postData = {
            room_id: Number(room_id),
            old_energy: room_data.new_energy,
            new_energy: Number(new_energy),
            old_water: room_data.new_water,
            new_water: Number(new_water),
            chat_id: msg.chat.id,
          };
          const data = await createRecord(postData);
          if (data) {
            sendInvoiceTemplate(kippo, msg);
          }
        } else {
          kippo.sendMessage(
            msg.chat.id,
            `សូមបញ្ចូលម្តងទៀត\n\nលេខទឹកខែចាស់: <b>${room_data.new_water}</b>\n\nex: <b><i>w-21</i></b>`,
            { parse_mode: "HTML" }
          );
        }
      }
      break;
    case option.due.test(res):
      // get due
      const dueRooms = await getDueRoom();
      if (dueRooms.length) {
        const mode = "HTML";
        const title = "បន្ទប់ដល់ថ្ងៃបង់ប្រាក់";
        let template = `<b>${title}</b>\n\n<i>លេខបន្ទប់</i>\t\t\t<i>ថ្ងៃបង់ប្រាក់</i>\n\n<pre>`;
        dueRooms.forEach((e) => {
          template += `${e.id}     ${e.due_date}\n`;
        });
        template += `</pre>`;
        kippo.sendMessage(msg.chat.id, template, {
          parse_mode: mode,
        });
      } else {
        kippo.sendMessage(msg.chat.id, "មិនមានបន្ទប់ដល់ថ្ងៃបង់ប្រាក់");
      }
      break;
  }
}

async function getRecord() {
  try {
    const res = await axios.get(`${api}/record`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

async function getLatestRecordByRoom(room_id) {
  try {
    const res = await axios.get(`${api}/record/room/${room_id}`);
    return res.data;
  } catch (error) {
    throw error;
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

async function createRecord(data) {
  try {
    const res = await axios.post(`${api}/record/room/`, data);
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

function sendInvoiceTemplate(kippo, msg) {
  kippo.sendMediaGroup(msg.chat.id, [
    {
      type: "photo",
      media:
        "https://res.cloudinary.com/shisun/image/upload/v1663409460/index_y15swm.jpg",
      caption: "ABA: <i>078 266 598</i>\n\nABA: <i>001 132 178</i>",
      parse_mode: "HTML",
    },
    {
      type: "photo",
      media:
        "https://res.cloudinary.com/shisun/image/upload/v1644072258/photo_2022-02-05_21-43-57_qw5ds9.jpg",
      caption: "Canadia: <i>006 000 025 7845</i>",
      parse_mode: "HTML",
    },
  ]);
  kippo.sendMessage(
    msg.chat.id,
    "[ចុចទីនេះដើម្បីបង់ប្រាក់តាម ABA](https://pay.ababank.com/nWd9TRyd2nBhgR1W8)",
    { parse_mode: "MarkdownV2" }
  );
  kippo.sendMessage(msg.chat.id, `សូមអរគុណ!`, { parse_mode: "HTML" });
}

async function getDueRoom() {
  try {
    const res = await axios.get(`${api}/due`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
}

function toKHR(val) {
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0 });
}

function toUSD(val) {
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

app.get("/", (req, res) => {
  res.send("Hey there");
});

app.listen(process.env.PORT || port, () => {
  console.log("app is listening on port " + port);
});
