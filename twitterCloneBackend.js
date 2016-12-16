const mongoose = require('mongoose'),
      bodyParser = require('body-parser'),
      bluebird = require('bluebird'),
      express = require('express'),
      app = express(),
      uuid = require('uuid'),
      bcrypt = require('bcrypt'),
      salt = 12;

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
  token: String,
  following: [String],
  followers: [String],
  favorites: [String]
});

//the tweet schema
const Tweet = mongoose.model('Tweet', {
  tweet: {type: String, minlength: 1, maxlength: 140, required: true},
  date: Date,
  userID: String,
  favorites: Number,
  favoritedBy: [String],
  retweets: Number,
  retweetedBy: [String]
});

// var theUserId = 'mwdowns';

app.get('/worldtimeline', function(req, res) {
  // World Timeline
  Tweet.find()
  .then(function(data) {
    var worldtimeline = [];
    data.forEach(function(tweet) {
      worldtimeline.push({
        tweetID: tweet._id,
        tweet: tweet.tweet,
        date: tweet.date,
        user: tweet.userID
      });
    });
    res.json(worldtimeline);
  })
  .catch(function(err) {
    res.json({message: 'you got an error', error: err});
  });
});

app.post('/search', function(req, res) {
  var params = req.body.data;
  // Tweet.createIndex({"tweet":"text"});
  Tweet.find({tweet: {$text: {$search: params}}})
  .then(function(data) {
    res.json({message: 'success!', data: data});
  })
  .catch(function(err) {
    res.json({message: 'you got an error', data: err.message});
  });
});

app.post('/signup', function(req, res) {
  var user = req.body.username;
  var password = req.body.password;
  bcrypt.hash(password, salt)
    .then(function(hash) {
      User.create ({
        _id: user,
        password: hash
      })
      .then(function(data) {
        res.json({message: 'success!', data: data});
      })
      .catch(function(err) {
        console.log(err);
        res.json({message: 'you got an error:', data: err});
      });
  });
});

app.post('/login', function(req, res) {
  var user = req.body.username;
  var password = req.body.password;
  console.log(user, password);
  User.findById(user)
  .then(function(data) {
    console.log(data.password);
    console.log(password);
    return [data, bcrypt.compare(password, data.password)];
  })
  .spread(function(data, newHash) {
    //figure out what to do tomorrow. maybe put that if statement up in here.
    var token = uuid();
    if (newHash) {
      console.log('this is the token in the if, ', token);
      User.update(
        {_id: data._id},
        {
          $set: {
            token: token
          }
        }
      )
      .then(function(data) {
        return;
      })
      .catch(function(err) {
        res.json({message: 'error', err: err});
      });
      console.log('this is the token outside, ', token);
      res.json({message: 'success', username: data._id, following: data.following, token: token});
    }
    else {
      throw ('passwords do not match');
    }
  })
  .catch(function(err) {
    console.log(err);
    res.status(401);
    res.json({message: 'you got an error:', err: err.message});
    // res.send(err);
  });
});


app.get('/usertimeline/:username', function(req, res) {
//My Timeline
  var username = req.params.username;
  User.findById(username)
    .then(function(user) {
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
      res.json({message: 'you got an error', error: err});
    });
});

app.get('/profile/:username', function(req, res) {
  // User Profile page
  var username = req.params.username;
  console.log('this is the username on the /profile/:username page, ', username);
  User.findById(username)
  .then(function(data) {
    res.json({id: data._id, followers: data.followers, following: data.following, favorites: data.favorites});
  })
  .catch(function(err) {
    res.json({message: 'you got an error', error: err});
  });
});

app.put('/tweet', function(req, res) {
  var tweet = req.body.tweet;
  var username = req.body.username;
  // Creates a tweet
  Tweet.create({
    tweet: tweet,
    date: new Date(),
    userID: username
  })
  .then(function(data) {
    res.json({message: 'success!', data: data});
  })
  .catch(function(err) {
    res.json({message: 'you got an error', data: err});
  });
});

app.post('/follow', function(req, res) {
  var usertofollow = req.body.usertofollow;
  var userfollowing = req.body.userfollowing;
  //Updates a user's following list or followers list (change the key after the $push)
  bluebird.all(
    [User.update(
      {_id: userfollowing},
      {
        $addToSet: {
          following: usertofollow
        }
      }
    ),
    User.update(
      {_id: usertofollow},
      {
        $addToSet: {
          followers: userfollowing
        }
      }
    )]
  )
  .then(function(data) {
    res.json({message: 'success', data: data});
  })
  .catch(function(err) {
    res.json({message: 'you got an error:', data: err.message});
  });
});

app.post('/unfollow', function(req, res) {
  var usertofollow = req.body.usertofollow;
  var userfollowing = req.body.userfollowing;
  //Updates a user's following list or followers list (change the key after the $push)
  bluebird.all([
    User.update(
      {_id: userfollowing},
      {
        $pull: {
          following: usertofollow
        }
      }
    ),
    User.update(
      {_id: usertofollow},
      {
        $pull: {
          followers: userfollowing
        }
      }
    )]
  )
  .then(function(data) {
    res.json({message: 'success', data: data});
  })
  .catch(function(err) {
    res.json({message: 'you got an error:', data: err.message});
  });
});

app.post('/retweet', function(req, res) {
  var tweetID = req.body.tweetID;
  var tweetAuthor = req.body.tweetAuthor;
  var tweetText = req.body.tweet;
  var retweetedBy = req.body.retweetedBy;
  bluebird.all([
    Tweet.update(
      {_id: tweetID},
      {
        $inc: {
          retweets: 1
        }
      }
    ),
    Tweet.update(
      {_id: tweetID},
      {
        $addToSet: {
          retweetedBy: retweetedBy
        }
      }
    )]
  )
  .then(function(data) {
    res.json({message: 'success', data: data});
  })
  .catch(function(err) {
    res.json({message: 'you got an error: ', data: err.message});
  });
});

app.post('/favorite', function(req, res) {
  var tweetID = req.body.tweetID;
  var tweetAuthor = req.body.tweetAuthor;
  var tweetText = req.body.tweet;
  var favoritedBy = req.body.favoritedBy;
  bluebird.all([
    Tweet.update(
      {_id: tweetID},
      {
        $inc: {
          favorites: 1
        }
      }
    ),
    Tweet.update(
      {_id: tweetID},
      {
        $addToSet: {
          favoritedBy: favoritedBy
        }
      }
    ),
    User.update(
      {_id: favoritedBy},
      {
        $addToSet: {
          favorites: tweetID
        }
      }
    )]
  )
  .then(function(data) {
    res.json({message: 'success', data: data});
  })
  .catch(function(err) {
    res.json({message: 'you got an error: ', data: err.message});
  });
});

app.listen(3000, function() {
  console.log('listening on port 3000');
});
