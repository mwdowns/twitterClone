var app = angular.module('tweeter', ['ui.router', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state({
      name: 'worldtimeline',
      url: '/worldtimeline',
      templateUrl: 'worldtimeline.html',
      controller: 'WorldTimeLineController'
    })
    // .state({
    //   name: 'usertimeline',
    //   url: '/usertimeline/{username}',
    //   templateUrl: 'usertimeline.html',
    //   controller: 'UserTimeLineController'
    // })
    .state({
      name: 'profilepage',
      url: '/profile/{username}',
      templateUrl: 'profile.html',
      controller: 'ProfileController'
    });

  $urlRouterProvider.otherwise('/worldtimeline');
});


app.factory('tweeterService', function($http, $cookies, $rootScope, $state) {
  var service = {};

  service.getWorldTweets = function() {
    return $http.get('/worldtimeline');
  };

  service.getUserTimeLine = function(username) {
    var url = '/usertimeline/' + username;
    return $http.get(url);
  };

  service.Tweet = function(tweet) {
    data = {tweet: tweet, username: 'mwdowns'};
    return $http.put('/tweet', data);
  };

  service.userProfile = function(username) {
    var url = '/profile/' + username;
    return $http.get(url);
  };

  return service;

});

app.controller('WorldTimeLineController', function($scope, tweeterService, $stateParams, $state) {
  tweeterService.getWorldTweets()
  .success(function(tweets) {
    $scope.tweets = tweets;
    // console.log('success!', tweets);
  })
  .error(function(err) {
    console.log('you got an error: ', err);
  });
});

app.controller('ProfileController', function($scope, tweeterService, $stateParams, $state) {
  $scope.username = $stateParams.username;
  tweeterService.getUserTimeLine($scope.username)
  .success(function(tweets) {
    $scope.tweets = tweets;
  })
  .error(function(err) {
    console.log('you got an error: ', err);
  });

  tweeterService.userProfile($scope.username)
  .success(function(data) {
    console.log('this is the data i got, ', data);
    $scope.username = data._id;
    $scope.followers = data.followers;
    $scope.following = data.following;
  })
  .error(function(err) {
    console.log('you got an error: ', err);
  });

});

app.controller('TweetController', function($scope, tweeterService, $stateParams, $state) {
  $scope.submitTweet = function(tweet) {
    tweeterService.Tweet($scope.tweet)
    .success(function(data) {
      console.log('success!', data);
    })
    .error(function(err) {
      console.log('you got an error: ', err);
    });
  };
});

// app.controller('ProfileController', function($scope, tweeterService, $stateParams, $state) {
//   $scope
// });
