//This has no implications on our code, just going to write how our data is gonna look like just as a reference

let db = {
  users: [
    {
      userId: "asd4a6f54as65f4",
      email: "user@email.com",
      handle: "user",
      createdAt: "2021-01-17T04:50:45.238Z",
      bio: "Hello my name is user",
      website: "https://user.com",
      location: "Los Angeles, CA",
    },
  ],
  pings: [
    {
      userHandle: "user",
      body: "This is the ping body",
      createdAt: "2021-01-15T06:19:05.186Z",
      likeCount: 5,
      commentCount: 2,
    },
  ],
  comments: [
    {
      userHandle: "user",
      pingId: "asdfgs65g4fsdf",
      body: "invite me to your party",
      createdAt: "2021-01-15T06:19:05.186Z",
    },
  ],
  notifications: [
    {
      recipient: "user",
      sender: "john",
      read: "true | false",
      pingId: "afjaskljfasdf",
      type: "like | comment",
      createdAt: "2021-01-15T06:19:05.186Z",
    },
  ],
};
const userDetails = {
  //Redux data
  credentials: {
    userId: "asd4a6f54as65f4",
    email: "user@email.com",
    handle: "user",
    createdAt: "2021-01-17T04:50:45.238Z",
    imageUrl: "image/aslfdkasl/askfdjaslk",
    bio: "Hello my name is user",
    website: "https://user.com",
    location: "Los Angeles, CA",
  },
  likes: [
    {
      userHandle: "user",
      pingId: "hh41adf1g6445a",
    },
    {
      userHandle: "user",
      pingId: "234sdgfsdg456235",
    },
  ],
};
