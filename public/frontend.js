var app = angular.module('tweeter', ['ui.router', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state({
      name: 'worldtimeline',
      url: '/worldtimeline',
      templateUrl: 'worldtimeline.html',
      controller: 'WorldTimeLineController'
    })
    .state({
      name: 'profilepage',
      url: '/profile/{username}',
      templateUrl: 'profile.html',
      controller: 'ProfileController'
    })
    .state({
      name: 'signup',
      url: '/signup',
      templateUrl: 'signup.html',
      controller: 'SignupController'
    })
    .state({
      name: 'login',
      url: '/login',
      templateUrl: 'login.html',
      controller: "LoginController"
    });

  $urlRouterProvider.otherwise('/worldtimeline');
});


app.factory('tweeterService', function($http, $cookies, $rootScope, $state) {
  var service = {};

  $rootScope.tweetClicked = false;

  if (!$cookies.getObject('cookie_data')) {
    // $rootScope.username = 'Guest';
    // $rootScope.followers = [];
    $rootScope.loggedIn = false;
  }
  else {
    var cookie = $cookies.getObject('cookie_data');
    $rootScope.username = cookie.username;
    $rootScope.following = cookie.following;
    $rootScope.auth_token = cookie.token;
    $rootScope.loggedIn = true;
  }
  // Single logout handler that reinitiallizes the rootScope variables.
  $rootScope.logout = function() {
    $cookies.remove('cookie_data');
    // $rootScope.username = 'Guest';
    $rootScope.auth_token = null;
    $rootScope.loggedIn = false;
    $state.go('worldtimeline');
  };

  service.getWorldTweets = function() {
    return $http.get('/worldtimeline');
  };

  service.getUserTimeLine = function(username) {
    var url = '/usertimeline/' + username;
    return $http.get(url);
  };

  service.Tweet = function(tweet, user) {
    data = {tweet: tweet, username: user};
    return $http.put('/tweet', data);
  };

  service.userProfile = function(username) {
    var url = '/profile/' + username;
    return $http.get(url);
  };

  service.signup = function(formData) {
    return $http.post('/signup', formData);
  };

  service.login = function(formData) {
    return $http({
      method: 'POST',
      url: '/login',
      data: formData
    })
    .then(function(response) {
      var data = response.data;
      console.log('this is the data for the cookie, ', data);
      $cookies.putObject('cookie_data', data);
      $rootScope.username = data.username;
      $rootScope.following = data.following;
      $rootScope.auth_token = data.token;
    })
    .catch(function(err) {
      console.log('this sucks');
      $rootScope.wronglogin = true;
    });

  };

  service.followUser = function(formData) {
    return $http.post('/follow', formData);
  };

  service.unfollowUser = function(formData) {
    return $http.post('/unfollow', formData);
  };

  service.searchTweet = function(searchParams) {
    return $http.post('/search', searchParams);
  };

  service.retweet = function(formData) {
    return $http.post('/retweet', formData);
  };

  service.favorite = function(formData) {
    return $http.post('/favorite', formData);
  };

  return service;

});

function getTweet(tweet) {
  console.log(tweet);
  if (tweet.tweetClicked) {
    tweet.tweetClicked = false;
  } else {
    var user = tweet.user;
    var tweetID = tweet.tweetID;
    tweet.tweetClicked = true;
  }
}

app.controller('WorldTimeLineController', function($scope, tweeterService, $stateParams, $state, $cookies, $rootScope) {
  tweeterService.getWorldTweets()
  .success(function(tweets) {
    $scope.tweets = tweets;
    // console.log('success!', tweets);
  })
  .error(function(err) {
    console.log('you got an error: ', err);
  });

  $scope.getTweet = getTweet;

  // $scope.retweet = retweet;

  $scope.goToUser = function(user) {
    $state.go('profilepage', {username: user});
  };

  $scope.retweet = function(tweet) {
    console.log(tweet.tweetID);
    console.log($rootScope.username);
    var formData = {
      tweetID: tweet.tweetID,
      tweetAuthor: tweet.user,
      tweet: tweet.tweet,
      retweetedBy: $rootScope.username
    };
    tweeterService.retweet(formData)
    .then(function(data) {
      console.log('success!', data);
    })
    .catch(function(err) {
      console.log('there was an error', err);
    });
  };

  $scope.favorite = function(tweet) {
    console.log(tweet.tweetID);
    console.log($rootScope.username);
    var formData = {
      tweetID: tweet.tweetID,
      tweetAuthor: tweet.user,
      tweet: tweet.tweet,
      favoritedBy: $rootScope.username
    };
    tweeterService.favorite(formData)
    .then(function(data) {
      console.log('success!', data);
    })
    .catch(function(err) {
      console.log('there was an error', err);
    });
  };

});

app.controller('ProfileController', function($scope, tweeterService, $stateParams, $state, $cookies, $rootScope) {
  $scope.followerscliked = false;
  $scope.followingclicked = false;

  $scope.username = $stateParams.username;

  $scope.showMyTimeLine = function() {
    if($scope.showmytimeline) {
      $scope.showmytimeline = false;
    }
    else {
      $scope.showmytimeline = true;
      tweeterService.getUserTimeLine($scope.username)
      .success(function(tweets) {
        $scope.tweets = tweets;
      })
      .error(function(err) {
        console.log('you got an error: ', err);
      });
    }
  };


  tweeterService.userProfile($scope.username)
  .success(function(data) {
    console.log('this is the scope.username', $scope.username);
    console.log('this is the data i got, ', data);
    $scope.username = data.id;
    $scope.followers = data.followers;
    $scope.following = data.following;
    $scope.favorites = data.favorites;
  })
  .error(function(err) {
    console.log('you got an error: ', err);
  });

  $scope.clickingFollowers = function() {
    if (!$scope.followerscliked) {
      $scope.followerscliked = true;
    } else {
      $scope.followerscliked = false;
    }
  };

  $scope.clickingFollowing = function() {
    if (!$scope.followingclicked) {
      $scope.followingclicked = true;
    } else {
      $scope.followingclicked = false;
    }
  };

  $scope.getTweet = getTweet;

  $scope.goToUser = function(user) {
    $state.go('profilepage', {username: user});
  };
  if(!$rootScope.loggedIn) {
    console.log('not logged in!');
  }
  else {
    console.log('rootscope following, ', $rootScope.following.length);
    if ($rootScope.following.length === 0) {
      $scope.follow = function() {
        console.log('you hit follow');
        var formData = {
          usertofollow: $stateParams.username,
          userfollowing: $rootScope.username
        };
        console.log(formData);
        tweeterService.followUser(formData);
      };
    }
    else {
      if ($rootScope.username != $stateParams.username) {
        console.log($rootScope.username);
        var index = $rootScope.following.indexOf($stateParams.username);
        console.log('hi');
        if (index === -1) {
          $scope.follow = function() {
            var formData = {
              usertofollow: $stateParams.username,
              userfollowing: $rootScope.username
            };
            tweeterService.followUser(formData);
          };
        }
        else {
          $scope.isfollowing = true;
          console.log('this is scope.following inside else, ', $scope.following);
          $scope.unfollow = function() {
            var formData = {
              usertofollow: $stateParams.username,
              userfollowing: $rootScope.username
            };
            tweeterService.unfollowUser(formData);
          };
        }
      }
      else {
        $scope.isme = true;
      }
    }
  }
  console.log('this is isme, ', $scope.isme);
});

app.controller('TweetController', function($scope, tweeterService, $stateParams, $state, $cookies, $rootScope) {
  $scope.submitTweet = function(tweet) {
    if ($rootScope.username) {
      var user = $rootScope.username;
      tweeterService.Tweet($scope.tweet, user)
      .success(function(data) {
        console.log('success!', data);
        // $state.go('profilepage', {username: user});
      })
      .error(function(err) {
        console.log('you got an error: ', err);
      });
      $state.reload();
      $scope.tweet = '';
      // $state.go('profilepage', {username: user});
    }
    else {
      console.log('this messed up somehow');
    }
  // $state.go('profilepage', {username: $stateParams.username});
  };

  $scope.goToUser = function(user) {
    $state.go('profilepage', {username: user});
  };

  $scope.goToWorldTimeLine = function() {
    console.log('you clicked go to world timeline');
    $state.go('worldtimeline');
  };

  $scope.goToLogin = function() {
    $state.go('login');
  };

  $scope.goToSignUp = function() {
    $state.go('signup');
  };

});

app.controller('SignupController', function($scope, tweeterService, $stateParams, $state, $cookies, $rootScope) {
  $scope.signupSubmit = function() {
    if ($scope.password != $scope.confirmPassword) {
      $scope.passwordsdontmatch = true;
    }
    else {
      $scope.passwordsdontmatch = false;
      var formData = {
        username: $scope.username,
        password: $scope.password,
      };
      tweeterService.signup(formData)
        .success(function() {
          $state.go('worldtimeline');
          console.log('success');
        })
        .error(function() {
          console.log('could not sign up');
        });
      $scope.username = '';
    }
  };
});

app.controller('LoginController', function($scope, tweeterService, $stateParams, $state, $cookies, $rootScope) {
  $scope.login = function() {
    var formData = {
      username: $scope.user,
      password: $scope.password
    };
    tweeterService.login(formData)
      .then(function() {
        if($cookies.getObject('cookie_data')) {
          $state.go('profilepage', {username: formData.username});
          $rootScope.loggedIn = true;
        }
        else {
          $state.go('login');
        }
      })
      .catch(function(err) {
        console.log('login failed');
        $scope.wronglogin = true;
      });
    $scope.user = '';
    $scope.password = '';
  };
});
