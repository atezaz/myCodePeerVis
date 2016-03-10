'use strict';

function VideoPulse(params) {
  var pulseInterval = params.interval || 5000;
  var host = params.host;
  var videoId = params.videoId;
  var video = params.mediaElement;
  var data = {user_id: params.userId};

  var signaller = null;

  this.start = function () {
    stop();
    signaller = setInterval(function () {

      data.pointer = video.currentTime; // update pointer

      var request = new XMLHttpRequest();
      var url = host + '/beats/' + videoId;
      request.open('POST', url, true);
      request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
      request.send(JSON.stringify(data));
    }, pulseInterval);
  };

  this.stop = function () {
    if (signaller) {
      clearInterval(signaller)
    }
  };
}