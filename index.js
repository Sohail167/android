const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");
const app = express();
const cors = require("cors");
const qs = require("qs");

const port = process.env.PORT || 3000;
// const { initializeApp } = require("firebase/app");
// const { getDatabase, ref, child, get } = require("firebase/database");

// const firebaseConfig = {
//   apiKey: "AIzaSyCbcSTSSY4AIVGLvkxiWosuEg6mkXuL3hM",
//   authDomain: "apikey-64c14.firebaseapp.com",
//   projectId: "apikey-64c14",
//   storageBucket: "apikey-64c14.appspot.com",
//   messagingSenderId: "432667197828",
//   appId: "1:432667197828:web:3b5af430ae883c8a611dd1",
// };

// const appdb = initializeApp(firebaseConfig);
// const database = getDatabase(appdb);
// const apiroutes = ref(database);
// let api = get(child(apiroutes, "/")).then(async (snapshot) => {
//   return await snapshot.val();
// });
app.use(cors());

function get_str_between(data) {
  const start = data.indexOf("shortcode_media") - 2,
    end = data.indexOf("});</script>") + 1;
  return data.substring(start, end);
}

async function pScraper(url) {
  if (url)
    // if(!req.headers["origin"]) {
    // return res.status(401).json({ msg: "unauthorized request" });

    // } else {

    try {
      const rex =
        /(https?:\/\/(?:www\.)?instagram\.com\/(p|tv|reel)\/([^/?#&]+))/gm;
      url = url.match(rex)[0];
      if (url) {
        let data = await axios(`${url}/embed/captioned/`, {
          headers: {
            useragent: "Mozilla/5.0 (Windows NT 6.2; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0",
            timeout: 1e3,
            maxRedirects: 10,
          },
        });
        data = data.data;
        const $ = cheerio.load(data),
          photoVideo = {
            img: [],
            video: []
          };
        if (
          $(".EmbeddedMediaImage").attr("src") &&
          data.indexOf("shortcode_media") < 1
        ) {
          photoVideo.img.push($(".EmbeddedMediaImage").attr("src"));
          return {
            video: photoVideo.video,
            // image: photoVideo.img,
            isVideo: false,

            owner: {
              profilePic: $(".HoverCardProfile").find("img").attr("src"),
              username: $(".HoverCardUserName > .Username").text(),
            },
          };
        } else {
          if (
            ((data = JSON.parse(get_str_between(data))),
              data.shortcode_media.edge_sidecar_to_children)
          )
            for (const i of data.shortcode_media.edge_sidecar_to_children.edges)
              i.node.is_video && photoVideo.video.push(i.node.video_url),
              photoVideo.img.push(i.node.display_url);
          data.shortcode_media.is_video &&
            photoVideo.video.push(data.shortcode_media.video_url);
          photoVideo.img.push(data.shortcode_media.display_url);
          return {
            owner: {
              profilePic: data.shortcode_media.owner.profile_pic_url,
              username: data.shortcode_media.owner.username,
            },
            isVideo: data.shortcode_media.is_video,
            video: photoVideo.video,
            // image: photoVideo.img,
          };
        }
      } else {
        return "invalid url";
      }
    } catch (err) {
      return {
        msg: "Unknown error"
      };
    }
  else return {
    msg: "Invalid Url"
  };
}
app.get("/", async (req, res) => {
  let {
    url: url
  } = req.query;
  pScraper(url).then((data) => {
    res.json(data);
  });
});
app.get("/dl", async (request, reply) => {
  const url = request.query.url;
  const title = request.query.title;
  const type = request.query.type;

  try {
    if (url != undefined) {
      if (type == "png") {
        reply.setHeader(
          "Content-Disposition",
          `attachment; filename=${title}.png`
        );
        return axios({
            url: url,
            method: "GET",
            responseType: "stream", // important
          })
          .then(function (response) {
            return response.data.pipe(reply);
            // ....
          })
          .catch((err) => {
            return reply.status(500).json(err);
          });
      } else if (type == "mp4") {
        reply.setHeader(
          "Content-Disposition",
          `attachment; filename=${title}.mp4`
        );
        return axios({
            url: url,
            method: "GET",
            responseType: "stream", // important
          })
          .then(function (response) {
            return response.data.pipe(reply);
            // ....
          })
          .catch((err) => {
            return reply.status(500).json(err);
          });
      } else if (type == "mp3") {
        reply.setHeader(
          "Content-Disposition",
          `attachment; filename=${title}.mp3`
        );
        return axios({
            url: url,
            method: "GET",
            responseType: "stream", // important
          })
          .then(function (response) {
            return response.data.pipe(reply);
            // ....
          })
          .catch((err) => {
            return reply.status(500).json(err);
          });
      } else if (type == "pdf") {
        reply.setHeader(
          "Content-Disposition",
          `attachment; filename=${title}.pdf`
        );
        return axios({
            url: url,
            method: "GET",
            responseType: "stream", // important
          })
          .then(function (response) {
            return response.data.pipe(reply);
            // ....
          })
          .catch((err) => {
            return reply.status(500).json(err);
          });
      }
    } else {
      return reply.status(500).json("enter valid url");
    }
  } catch (error) {
    return reply.status(500).json(error);
  }
});

app.get("/stories", async (request, reply) => {
  const id = request.headers.username;
  try {
    if (
      id != undefined &&
      id != "" &&
      id.includes(
        "https://www.instagram.com/" || id.includes("https://instagram.com/")
      )
    ) {
      return stories(id.split("/")[3]).then((data) => {
        return reply.json(data);
      });
    } else if (id != undefined && id != "") {
      return stories(id).then((data) => {
        return reply.json(data);
      });
    } else {
      return reply.status(500).json("username");
    }
  } catch (error) {
    return reply.status(500).json(error);
  }
});

app.get("/profile", async (request, reply) => {
  const id = request.headers.username;
  try {
    if (
      (id != undefined &&
        id != "" &&
        id.includes("https://www.instagram.com/")) ||
      id.includes("https://instagram.com/")
    ) {
      if (id.includes("?")) {
        return dpDownloader(id.split("?")[0].split("/")[3]).then((data) => {
          return reply.json(data);
        });
      } else {
        return dpDownloader(id.split("/")[3]).then((data) => {
          return reply.json(data);
        });
      }
    } else if (id != undefined && id != "") {
      return dpDownloader(id).then((data) => {
        return reply.json(data);
      });
    } else {
      return reply.status(500).json("username");
    }
  } catch (error) {
    return reply.status(500).json(error);
  }
});
app.get("/allinone", async (request, reply) => {
  const id = request.headers.url;
  const rex =
    /(https?:\/\/(?:www\.)?instagram\.com\/(p|tv|reel)\/([^/?#&]+))/gm;
  url = id.match(rex);
  let mainUrl = undefined;
  if (!url) {
    if (id.includes("?")) {
      let testurl = id.split("?")[0];
      let finalurl = testurl.split("/");
      delete finalurl[3];
      mainUrl =
        finalurl[0] +
        "//" +
        finalurl[2] +
        "/" +
        finalurl[4] +
        "/" +
        finalurl[5];
      console.log(
        finalurl[0] + "//" + finalurl[2] + "/" + finalurl[4] + "/" + finalurl[5]
      );
    } else {
      let finalurl = id.split("/");
      delete finalurl[3];
      mainUrl =
        finalurl[0] +
        "//" +
        finalurl[2] +
        "/" +
        finalurl[4] +
        "/" +
        finalurl[5];
      console.log(mainUrl);
    }
  } else {
    mainUrl = id;
  }
  try {
    if (
      id != undefined &&
      id != "" &&
      id.includes(
        "https://www.instagram.com/" || id.includes("https://instagram.com/")
      )
    ) {
      return pScraper(mainUrl).then((data) => {
        // console.log(data);
        if (data.isVideo === true) {
          return reply.json(data);
        } else {
          return IgtvReelsAndPhoto(mainUrl).then((data) => {
            // console.log(data)
            return reply.json(data);
          });
        }
      });
    } else {
      return reply.status(500).json("link");
    }
  } catch (error) {
    return reply.status(500).json(error);
  }
});

async function stories(id) {
  try {
    var data = new FormData();
    data.append("username", id);
    data.append("submit", "");
    let list = [];
    var config = {
      method: "post",
      url: "https://instasave.website/instagram-stories-downloader",
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };
    const html = await axios(config);
    const $ = cheerio.load(html.data);
    const ima = $(".dlsection")
      .find("img")
      .get()
      .map((e) => e.attribs.src);
    const vid = $(".dlsection")
      .find("source")
      .get()
      .map((e) => {
        return e.attribs.src;
      });

    return {
      image: ima,
      video: vid
    };
  } catch (error) {
    return error.message;
  }
}
async function IgtvReelsAndPhoto(link) {
  // let dataapi = await api;

  try {
    var data = new FormData();
    data.append("link", link);
    data.append("submit", "");
    var config = {
      method: "post",
      url: "https://server.instasave.website/#downloadhere",
      headers: {
        Cookie: "__cfduid=db66680008860fa16089cec9d0ed36fb31616757592",
        ...data.getHeaders(),
      },
      data: data,
    };
    const html = await axios(config);
    const $ = cheerio.load(html.data);
    const video = $(".dlsection")
      .find("source")
      .get()
      .map((e) => e.attribs.src);
    const image = $(".dlsection")
      .find("img")
      .get()
      .map((e) => e.attribs.src);
    console.log(image, video);
    if (
      image != undefined &&
      video != undefined &&
      image.length != 0 &&
      video.length != 0
    ) {
      return {
        video: video,
        image: image
      };
    } else {
      return video != undefined && video.length != 0 ? {
        video: video
      } : {
        image: image
      };
    }
  } catch (error) {
    return error.message;
  }
}

async function dpDownloader(id) {
  try {
    console.log(id);
    // var config = {
    //   method: "post",
    //   url: "https://instasave.website/insta-dp-downloader#downloadhere",
    //   headers: {
    //     ...data.getHeaders(),
    //   },
    //   data: data,
    // };
    let data = `link=https%3A%2F%2Fwww.instagram.com%2F${id}&downloader=avatar`;

    let config = {
      method: 'post',
      url: 'https://igdownloader.com/ajax',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-IN,en;q=0.9,ja;q=0.8,en-US;q=0.7',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': 'PHPSESSID=o5rldeu2bp4ist36hgsobnkvve; _ga=GA1.1.1571242942.1651086314; _ga_ZK84BJGHBW=GS1.1.1652058608.8.0.1652058608.0',
        'DNT': '1',
        'Origin': 'https://igdownloader.com',
        'Referer': 'https://igdownloader.com/profile-picture-downloader',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      data: data
    };
    // let data =
    //   `via=form&ref=download-profile-picture-instagram&url=${id}+`;

    // let config = {
    //   method: "post",
    //   url: "https://pokoinsta.com/api/instagram",
    //   headers: {
    //     authority: "pokoinsta.com",
    //     accept: "*/*",
    //     "accept-language": "en-IN,en;q=0.9,ja;q=0.8,en-US;q=0.7",
    //     "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    //     cookie:
    //       "_ga_FL87RDB5MN=GS1.1.1651937992.1.0.1651937992.0; _ga=GA1.1.2141949781.1651937993; __cf_bm=cG4e86yJ2E2mVIP8WpyYS.Rwyt1G8o4O42V2DhEfV2k-1651937992-0-ATvDI8k/wlvaRkApSgRgLmP2iBdUMfmjh0Fe8AlZoILk526YdWa+YwQOlKoBA4R/gkLXVC7D3tE/UNIz80VFKvjHX7JhNYy+R1tY013mK58Vr47X2zWSNmV4aE3Oe/FE6Q==",
    //     dnt: "1",
    //     origin: "https://pokoinsta.com",
    //     referer: "https://pokoinsta.com/download-profile-picture-instagram",
    //     "sec-ch-ua":
    //       '" Not A;Brand";v="99", "Chromium";v="100", "Google Chrome";v="100"',
    //     "sec-ch-ua-mobile": "?0",
    //     "sec-ch-ua-platform": '"Windows"',
    //     "sec-fetch-dest": "empty",
    //     "sec-fetch-mode": "cors",
    //     "sec-fetch-site": "same-origin",
    //     "user-agent":
    //       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
    //     "x-requested-with": "XMLHttpRequest",
    //   },
    //   data: data,
    // };
    //  let data =
    //    `url=https%3A%2F%2Fwww.instagram.com%2F${id}%2F&action=profilePic&token=e9b6912273fea8859cfb0f0610f47ef04926280e5db3ee112c039deeabcdc75f&json=`;

    //  let config = {
    //    method: "post",
    //    url: "https://downloadinstareels.com/system/action.php",
    //    headers: {
    //      authority: "downloadinstareels.com",
    //      accept: "*/*",
    //      "accept-language": "en-IN,en;q=0.9,ja;q=0.8,en-US;q=0.7",
    //      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    //      cookie:
    //        "PHPSESSID=82f332d057e8fa82f5488bf20f45d44c; ezosuibasgeneris-1=dd3f4942-4b9d-489b-409b-fe55f50e3e30; _ga=GA1.1.1115042833.1651091618; ezux_ifep_263506=true; __qca=P0-1838154100-1651091641452; ezoadgid_263506=-1; ezoref_263506=; ezoab_263506=mod52-c; lp_263506=https://downloadinstareels.com/download-instagram-profile-photo.php; ezovuuidtime_263506=1651137964; ezovuuid_263506=9bf76443-7e11-451d-57ed-671a86bec9f9; ezopvc_263506=1; _ga_6ZXYV3ZDS8=GS1.1.1651137964.2.0.1651137964.0; ezux_lpl_263506=1651137970377|e398ea53-1319-45e6-6f47-20cf29ce138a|true; ezux_et_263506=118; ezux_tos_263506=867",
    //      dnt: "1",
    //      origin: "https://downloadinstareels.com",
    //      referer:
    //        "https://downloadinstareels.com/download-instagram-profile-photo.php",
    //      "sec-ch-ua":
    //        '" Not A;Brand";v="99", "Chromium";v="100", "Google Chrome";v="100"',
    //      "sec-ch-ua-mobile": "?0",
    //      "sec-ch-ua-platform": '"Windows"',
    //      "sec-fetch-dest": "empty",
    //      "sec-fetch-mode": "cors",
    //      "sec-fetch-site": "same-origin",
    //      "user-agent":
    //        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
    //      "x-requested-with": "XMLHttpRequest",
    //    },
    //    data: data,
    //  };
    // var config = {
    //   method: "POST",
    //   url: `https://insta-pd.herokuapp.com/${id}`,
    //   // headers: {
    //   //     cookie: 'PHPSESSID=j9hft0cq67ph3b992gmgu0tmrm',
    //   //     Accept: 'application/json, text/javascript, */*; q=0.01',
    //   //     'Accept-Encoding': 'gzip, deflate, br',
    //   //     'Accept-Language': 'en-US,en-IN;q=0.9,en;q=0.8',
    //   //     Connection: 'keep-alive',
    //   //     'Content-Length': '61',
    //   //     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    //   //     Cookie: 'PHPSESSID=udjq94iksrj4m80rm54vltd7qb; popCookie=1; _ga_ZK84BJGHBW=GS1.1.1641752373.1.0.1641752373.0; _ga=GA1.1.298073465.1641752373',
    //   //     DNT: '1',
    //   //     Host: 'igdownloader.com',
    //   //     Origin: 'https://igdownloader.com',
    //   //     Referer: 'https://igdownloader.com/profile-picture-downloader',
    //   //     'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
    //   //     'sec-ch-ua-mobile': '?0',
    //   //     'sec-ch-ua-platform': '"Windows"',
    //   //     'Sec-Fetch-Dest': 'empty',
    //   //     'Sec-Fetch-Mode': 'cors',
    //   //     'Sec-Fetch-Site': 'same-origin',
    //   //     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
    //   //     'X-Requested-With': 'XMLHttpRequest'
    //   // },
    //   // data: { link: 'https://www.instagram.com/nasa', downloader: 'avatar' }
    // };
    const url = await axios(config);
    const $ = cheerio.load(url.data.html);
    const image = $(".post-wrapper").find("a").get(0).attribs.href


    return {
      image: image
    };
  } catch (error) {
    return error.message;
  }
}
app.listen(port, () =>
  console.log(`Example app listening on port http://localhost:${port}`)
);