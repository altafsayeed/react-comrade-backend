const { db } = require("../util/admin");

exports.getAllPings = (req, res) => {
  db.collection("pings")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let pings = [];
      data.forEach((doc) => {
        pings.push({
          pingId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage,
        });
      });
      return res.json(pings);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postOnePing = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }

  const newPing = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  db.collection("pings")
    .add(newPing)
    .then((doc) => {
      const resPing = newPing;
      resPing.pingId = doc.id;
      res.json(resPing);
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
};
//Fetch one ping
exports.getPing = (req, res) => {
  let pingData = {};
  db.doc(`/pings/${req.params.pingId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Ping not found." });
      }
      pingData = doc.data();
      pingData.pingId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("pingId", "==", req.params.pingId)
        .get();
    })
    .then((data) => {
      pingData.comments = [];
      data.forEach((doc) => {
        pingData.comments.push(doc.data());
      });
      return res.json(pingData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
//Comment on a ping
exports.commentOnPing = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    pingId: req.params.pingId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };
  console.log(newComment);

  db.doc(`/pings/${req.params.pingId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Ping not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};
//Like a ping
exports.likePing = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("pingId", "==", req.params.pingId)
    .limit(1);

  const pingDocument = db.doc(`/pings/${req.params.pingId}`);

  let pingData;

  pingDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        pingData = doc.data();
        pingData.pingId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Ping not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            pingId: req.params.pingId,
            userHandle: req.user.handle,
          })
          .then(() => {
            pingData.likeCount++;
            return pingDocument.update({ likeCount: pingData.likeCount });
          })
          .then(() => {
            return res.json(pingData);
          });
      } else {
        return res.status(400).json({ error: "Ping already liked " });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unlikePing = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("pingId", "==", req.params.pingId)
    .limit(1);

  const pingDocument = db.doc(`/pings/${req.params.pingId}`);

  let pingData;

  pingDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        pingData = doc.data();
        pingData.pingId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Ping not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Ping not liked " });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            pingData.likeCount--;
            return pingDocument.update({ likeCount: pingData.likeCount });
          })
          .then(() => {
            res.json(pingData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
//Delete a ping
exports.deletePing = (req, res) => {
  const document = db.doc(`/pings/${req.params.pingId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Ping not found" });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Ping deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
