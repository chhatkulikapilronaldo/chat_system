const fs = require("fs");
const path = require("path");
const login = require("../models/login_info");
const user = require("../models/user");
const messages = require("../models/messages");
const rooms = require("../models/rooms");
var base64 = require("base-64");
require('dotenv').config();
const db = require("../config/connection")("chat", process.env.SQL_PASSWORD);
const date = new Date().getTime();
const { v4: uuidv4 } = require("uuid");
function routes(app, onlineUsers) {
  // access index
  app.get("/", (req, res) => {
    console.log("GET REQUEST: index");
    res.sendFile("index.html", { root: "./public" });
  });

  // access HTML pages
  app.get("/:page", (req, res) => {
    console.log("GET REQUEST: HTML page", req.params.page);
    res.sendFile(`${req.params.page}.html`, { root: "./public" });
  });

  //check new username against existing usernames in database
  app.get("/api/usercheck/:username", async (req, res) => {
    const result = await login.checkExistingUsername(req.params.username);
    console.log(result);
    if (!result)
      res.status(202).send({ code: 202, message: "Username is available..." });
    else
      res
        .status(404)
        .send({ code: 404, message: "Username is already taken..." });
  });

  //avatarlist
  app.get("/api/avatars", async (req, res) => {
    const avatars = fs.readdirSync("./public/assets/avatars");
    res.status(202).send(avatars);
  });

  // registration request
  app.post("/api/register", async (req, res) => {
    const username = req.body.username;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const password = base64.encode(req.body.password);
    const avatar = req.body.avatar;
    console.log(
      `POST REQUEST: Adding [NEW USER]: username ${username}, firstname: ${firstname}, lastname: ${lastname}, password: ${password}, avatar: ${avatar}`
    );
    await login.addNew(username, password);
    const loginID = await login.matchWithUser(username); // find id # of table login_id
    console.log("loginid", loginID);
    await user.addNew(
      loginID.id,
      firstname,
      lastname,
      username,
      avatar,
      password
    );
    res.send({ message: "Registration successful" });
  });

  // login request
  // login request
  app.post("/api/login", async (req, res) => {
    const inputUser = req.body.username;
    const inputPassword = base64.encode(req.body.password);
    const JWT = require("jsonwebtoken");
    require("dotenv").config();

    console.log(
      `GET REQUEST: trying to login as username: ${inputUser}, password: ${inputPassword}`
    );
    const loginID = await login.getId(inputUser, inputPassword);
    console.log("response:", loginID);
    if (loginID) {
      const token = await JWT.sign({}, process.env.JWT_SECRET, {
        expiresIn: "14d",
      });
      res.send({ code: 202, accesskey: `${inputUser}`, token: token });
    } else res.send({ code: 404 });
  });

  // request room list
  app.get("/api/rooms", async (req, res) => {
    console.log("GET REQUEST: fetching rooms information");
    const data = await rooms.listAll();
    console.table(data);
    res.status(200).send(data);
  });

  // request previous messages
  app.get("/api/messages/:roomId", async (req, res) => {
    console.log(
      `GET REQUEST: fetching previous messages for room ${req.params.roomId}`
    );
    const data = await messages.getRoomMsgs(req.params.roomId);
    console.table(data);
    res.send(data);
  });

  // request online users array
  app.get("/api/online/:roomId", async (req, res) => {
    console.log(
      `GET REQUEST: fetching list of online users for room ${req.params.roomId}`
    );
    // filter out users with same roomId as input
    let roomUsers = [];
    for (let i = 0; i < onlineUsers.length; i++) {
      if (onlineUsers[i].roomId == req.params.roomId)
        roomUsers.push(onlineUsers[i]);
    }
    console.table(roomUsers);
    res.send(roomUsers);
  });

  // request user info using accesskey
  app.get("/api/users/:accesskey", async (req, res) => {
    console.log(
      `GET REQUEST: fetching userinfo using accesskey ${req.params.accesskey}`
    );
    // find login_id using accesskey
    const userInfo = await user.getUserInfo(req.params.accesskey);
    console.table(userInfo);
    res.send(userInfo);
  });
    // add message to DB
    app.post('/api/messages', async (req, res) => {
      console.log(`POST REQUEST: adding message to DB ${req.body}`);
      messages.addMsgToRoom(req.body.userId, req.body.roomId, req.body.msg);
      res.send({ message:'success' });
  })

  // add improved message to DB
  app.post("/api/detail/messages", async (req, res) => {
    console.log(`POST REQUEST: adding message to DB ${req.body}`);
    messages.addDetailMsgToRoom(
      uuidv4(),
      req.body.user_id,
      req.body.room_id,
      req.body.message_body,
      date
    );
    // res.send({ message: "success" });
    res.status(200).send("sucess store message in DB");
  });

  //soft delete messages
  app.delete("/api/messages/:uuid", async (req, res) => {
    const uuid = req.params.uuid;
    let sqlQuery = `Update messages set is_delete=1 WHERE uuid='${uuid}'`; //flag ko concept 1 or 0
    const result = await db.query(sqlQuery);
    console.log(result);

    if (result.affectedRows > 0) {
      res.status(200).send("sucessfull soft delete message");
    } else {
      res.status(404).send("uuid is not in Database");
    }
  });

    // add rooms
    app.post('/api/rooms', async (req, res) => {
      console.log(`POST REQUEST: adding room to DB ${req.body}`);
      let roomInput = req.body;
      console.log ( 'roominput', roomInput)
      await rooms.addNewRoom(roomInput.room_name)
          .then(result => console.log(`Room: ${roomInput} is added to database!`))
          .catch(error => console.log(error));
      res.send({ message: 'success' });
  });
  //room update
  app.put("/api/updateRoom", async (req, res) => {
    const jwt = require("jsonwebtoken");
    const new_roomName = req.body.new_roomName;
    const rep_roomname = req.body.rep_roomname;
    const id = req.body.id;

    require("dotenv").config();
    if (new_roomName) {
      const decode = jwt.verify(
        req.headers.authorization,
        process.env.JWT_SECRET
      );
      if (!decode) {
        return res.status(401).json({ message: "Not authorized" });
      } else {
        if (new_roomName == rep_roomname) {
          const rooms_up =
            "update `rooms` set `room_name` =" +
            "'" +
            new_roomName +
            "'" +
            " where `id`=" +
            id;
          const result = await db.query(rooms_up);
          console.log(result);
          const msgs = "The Room Name was update";
          res.status(200).send(msgs);
        } else {
          const message = "new and re_room name not match";
          res.status(404).send(message);
        }
      }
    }
  });
      // delete rooms
      app.delete('/api/rooms/:roomId', async (req, res) => {
        const id = req.params.roomId;
        console.log(`DELETE REQUEST: removing room ${id} and all messages from DB `);
        rooms.removeRoom(id)
            .then(result => console.log(`Room: ${id} is deleted from database!`))
            .catch(error => console.log(error));
        messages.removeMsgByRoom(id)
            .then(result => console.log(`All messages in room: ${id} are deleted from database!`))
            .catch(error => console.log(error));
        res.send({ message: 'success' });
    })

  //soft delete rooms
  app.delete("/api/softDelete/rooms/:roomId", async (req, res) => {
    const id = req.params.roomId;
    let sqlQuery = `Update rooms set is_delete=1 WHERE id='${id}'`; //flag ko concept 1 or 0
    const result = await db.query(sqlQuery);
    console.log(result);

    if (result.affectedRows > 0) {
      res.status(200).send("sucessfull soft delete room");
    } else {
      res.status(404).send("rooms are not in db or delete");
    }
  });

  //update message DB ma vako message update garne
  app.put("/api/update/messages/:uuid", async (req, res) => {
    const uuid = req.params.uuid;
    const msg = req.body.message_body;
    let sqlQuery = `Update messages set message_body='${msg}',updatedAt='${date}' WHERE uuid='${uuid}'`; //flag ko concept 1 or 0
    const result = await db.query(sqlQuery);
    console.log(result);
    if (result.affectedRows > 0) {
      res.status(200).send("sucessful update message");
    } else {
      res.status(404).send("failed to update message");
    }
  });

  //update password of user or change password of user
  app.put("/api/updatePassword", async (req, res) => {
    const jwt = require("jsonwebtoken");
    require("dotenv").config();
    const new_password = base64.encode(req.body.new_password);
    const rep_password = base64.encode(req.body.rep_password);
    const id = req.body.id;
    if (new_password) {
      const decode = jwt.verify(
        req.headers.authorization,
        process.env.JWT_SECRET
      );
      if (!decode) {
        res.status(404).send("plz provide token");
      } else {
        if (new_password == rep_password) {
          const password_up =
            "update `login_info` set `user_password` =" +
            "'" +
            new_password +
            "'" +
            " where `id`=" +
            id;
          const result = await db.query(password_up);
          console.log(result);
          const msgs = "The password was update";
          res.status(200).send(msgs);
        } else {
          const ab = "new and re_password not match";
          res.status(404).send(ab);
        }
      }
    }
  });
  //update all userinfo
  app.put("/api/updateUsers", async (req, res) => {
    const jwt = require("jsonwebtoken");
    require("dotenv").config();
    const firstname = req.body.first_name;
    const lastname = req.body.last_name;
    const displayname = req.body.display_name;
    const id = req.body.id;
    if (firstname || lastname || displayname) {
      const decode = jwt.verify(
        req.headers.authorization,
        process.env.JWT_SECRET
      );
      if (!decode) {
        return res.status(401).json({ message: "Not authorized" });
      } else {
        const query = `UPDATE users SET first_name='${firstname}',last_name='${lastname}',display_name='${displayname}' where id='${id}'`;
        const result = await db.query(query);
        res.status(200).send("sucess user info update");
      }
    }
  });
}

module.exports = routes;
