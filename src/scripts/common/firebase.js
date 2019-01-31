var firebase;

var modFirebase = (function ($) { /* jshint ignore:line */
  'use strict';

  /* GENERIC */
  var init = function () {

    var config = {
      apiKey: "AIzaSyBvc_fsOY79TF8BQ6YWkNm9ahgLLNGeu1c",
      authDomain: "project-visualiser.firebaseapp.com",
      databaseURL: "https://project-visualiser.firebaseio.com",
      projectId: "project-visualiser",
      storageBucket: "project-visualiser.appspot.com",
      messagingSenderId: "461581440741"
    };
    firebase.initializeApp(config);
  };

  /* PUBLIC */
  var getNewKey = function (ref) {
    if (_.isEmpty(ref)) {
      throw new Error('ref undefined');
    }
    return firebase.database().ref(ref).push().key;
  };

  var updateViaObject = function (ref, updates) {
    if (_.isEmpty(ref)) {
      throw new Error('ref undefined');
    }
    console.log('updateViaObject', ref, updates);
    return firebase.database().ref(ref).set(updates).then(function () {
      return;
    });
  };

  var ref = function (ref) {
    return firebase.database().ref(ref).once('value').then(function (snapshot) {
      return snapshot.val();
    });
  };

  var refMain = function (ref) {
    return firebase.database().ref(ref).once('value').then(function (snapshot) {
      return _.transform(
        snapshot.val(),
        function (arr, o, k) {
          o.uid = k;
          arr.push(o);
          return arr;
        },
        []
      );
    });
  };

  return {
    init: init,
    ref: ref, 
    refMain: refMain, 
    getNewKey: getNewKey, 
    updateViaObject: updateViaObject, 
  };
})(jQuery);


    