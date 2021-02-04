const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/fbAuth");

const cors = require("cors");
app.use(cors());

const { db } = require("./util/admin");

const {
  getAllPings,
  postOnePing,
  getPing,
  commentOnPing,
  likePing,
  unlikePing,
  deletePing,
} = require("./handlers/pings");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");

//Ping routes
app.get("/pings", getAllPings);
app.post("/ping", FBAuth, postOnePing);
app.get("/ping/:pingId", getPing);
app.delete("/ping/:pingId", FBAuth, deletePing);
app.get("/ping/:pingId/like", FBAuth, likePing);
app.get("/ping/:pingId/unlike", FBAuth, unlikePing);
app.post("/ping/:pingId/comment", FBAuth, commentOnPing);

//Signup route
app.post("/signup", signup);
//login route
app.post("/login", login);
//profile pic upload route
app.post("/user/image", FBAuth, uploadImage);
//update user details or bio
app.post("/user", FBAuth, addUserDetails);
//Get user credentials
app.get("/user", FBAuth, getAuthenticatedUser);
//Get a specific user's details
app.get("/user/:handle", getUserDetails);
//Mark notifications read
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/pings/${snapshot.data().pingId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            pingId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnlike = functions.firestore
  .document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/pings/${snapshot.data().pingId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            pingId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onProfilePicChange = functions.firestore
  .document("/users/{userId}")
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("Profile picture has changed");
      const batch = db.batch();
      return db
        .collection("pings")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const ping = db.doc(`/pings/${doc.id}`);
            batch.update(ping, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

//Delete a ping
exports.onPingDelete = functions.firestore
  .document("/pings/{pingId}")
  .onDelete((snapshot, context) => {
    const pingId = context.params.pingId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("pingId", "==", pingId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection("likes").where("pingId", "==", pingId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("pingId", "==", pingId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
