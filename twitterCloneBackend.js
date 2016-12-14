const mongoose = require('mongoose'),
      bodyParser = require('body-parser'),
      bluebird = require('bluebird'),
      express = require('express'),
      app = express();

mongoose.Promise = bluebird;
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost/twitterclone_db');

//the user schema
const User = mongoose.model('User', {
  //the username should be unique, so we can use it as the id for the object
  _id: String,
  password: {type: String, required: true},
  // avatar: binary,
  following: [String],
  followers: [String]
});

//the tweet schema
const Tweet = mongoose.model('Tweet', {
  tweet: {type: String, required: true},
  date: Date,
  userID: String,
  favorites: [String],
  retweets: [String]
});

// var theUserId = 'mwdowns';

app.get('/worldtimeline', function(req, res) {
  // World Timeline
  Tweet.find().limit(20)
  .then(function(data) {
    console.log(data);
    var worldtimeline = [];
    data.forEach(function(tweet) {
      worldtimeline.push({
        tweet: tweet.tweet,
        date: tweet.date,
        user: tweet.userID
      });
    });
    res.json(worldtimeline);
  })
  .catch(function(err) {
    console.log('you got an error, ', err);
    res.json({message: 'you got an error', error: err});
  });
});

app.get('/usertimeline/:username', function(req, res) {
//My Timeline
  var username = req.params.username;
  User.findById(username)
    .then(function(user) {
      console.log('got here and theUserId is ', username);
      return Tweet.find({
        userID: {
          $in: user.following.concat([user._id])
        }
      });
    })
    .then(function(tweets) {
      var usertimeline = [];
      tweets.forEach(function(tweet) {
        usertimeline.push({
          tweet: tweet.tweet,
          date: tweet.date,
          user: tweet.userID
        });
      });
      res.json(usertimeline);
    })
    .catch(function(err) {
      console.log('you got an error, ', err);
      res.json({message: 'you got an error', error: err});
    });
});

app.put('/tweet', function(req, res) {
  var tweet = req.body.tweet;
  var username = req.body.username;
  console.log(username + ': ' + tweet);
  // Creates a tweet
  Tweet.create({
    tweet: tweet,
    date: new Date(),
    userID: username
  })
  .then(function(data) {
    console.log('success! ', data);
    res.json({message: 'success!', data: data});
  })
  .catch(function(err) {
    console.log('you got an error, ', err);
    res.json({message: 'you got an error', data: err});
  });
});

app.get('/profile/:username', function(req, res) {
  // User Profile page
  var username = req.params.username;
  User.findById(username)
  .then(function(data) {
    console.log('i got the username and it is ', username);
    console.log('this is the data', data);
    res.json(data);
  })
  .catch(function(err) {
    console.log('you got an error, ', err);
    res.json({message: 'you got an error', error: err});
  });
});

app.listen(3000, function() {
  console.log('listening on port 3000');
});

//Creates a new user
// User.create ({
//   _id: 'mwdowns',
//   password: '1234'
// })
// .then(function(data) {
//   console.log('success ', data);
// })
// .catch(function(err) {
//   console.log('you got an error: ', err);
// });

//Updates a user's following list or followers list (change the key after the $push)
// User.update(
//   {_id: 'lynn'},
//   {
//     $push: { following:
//       {$each: ['DOM', 'mwdowns']}
//     }
//   },
//   {
//     upsert: true
//   }
// )
// .then(function(data) {
//   console.log('success! ', data);
// })
// .catch(function(err) {
//   console.log('there was an error, ', err);
// });

//Creates a tweet
// Tweet.create({
//   tweet: 'hey everyone! i love horses! and Doodins!',
//   date: new Date(),
//   userID: 'jeri'
// })
// .then(function(data) {
//   console.log('success! ', data);
// })
// .catch(function(err) {
//   console.log('you got an error, ', err);
// });
//
// // World Timeline
//
// Tweet.find().limit(20);
//
// // User Profile page
//
// bluebird.all([
//   Tweet.find({ userID: theUserID }).limit(20),
//   User.findById(theUserId)
// ])
// .spread(function(tweets, user) {
//
// });
//
// My timeline

// User.findById(theUserId)
//   .then(function(user) {
//     return Tweet.find({
//       userID: {
//         $in: user.following.concat([user._id])
//       }
//     });
//   })
//   .then(function(tweets) {
//     // you have the tweets
//   });
