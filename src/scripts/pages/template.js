/* jshint ignore:start */
var template = (function ($) { /* jshint ignore:line */
  'use strict';

  var $con;

  /* GENERIC */
  var init = function () {

    $con = $('#template');
    if (!$con.length) {
      return;
    }
  };

  var destroy = function () {
    removeListeners();
  };

  var update = function () {
    removeListeners();
    addListeners();
  };

  /* PRIVATE */
  var removeListeners = function () {
  };

  var addListeners = function () {
  };

  /* PUBLIC */
  var resize = function() {
  };

  return {
    init: init,
    destroy: destroy,
    update: update,
    resize: resize,
  };
})(jQuery);
/* jshint ignore:end */
