$(function() {
  'use strict';

  var modules = _.pickBy(window, function(value, key) {
    return _.startsWith(key, 'mod');
  });

  _.each(modules, function(mod) {
    if (mod && mod.init && mod.priorityLoad) {
      mod.init();
    }
  });

  _.each(modules, function(mod) {
    if (mod && mod.init && (!mod.priorityLoad || mod.priorityLoad === false)) {
      mod.init();
    }
  });

  var onWindowResize = function() {
    _.each(modules, function(mod) {
      if (mod && mod.resize) {
        mod.resize();
      }
    });
  };
  $(window).on('resize', _.debounce(onWindowResize, 100));
  onWindowResize();

  var onWindowLoad = function() {
    _.each(modules, function(mod) {
      if (mod && mod.load) {
        mod.load();
      }
    });
  };
  $(window).on('load', onWindowLoad);

  var onWindowScroll = function() {
    _.each(modules, function(mod) {
      if (mod && mod.scroll) {
        mod.scroll($(window).scrollTop());
      }
    });
  };
  $(window).on('scroll', onWindowScroll);

  var onStateChange = function() {
    _.each(modules, function(mod) {
      if (mod && mod.statechange) {
        mod.statechange();
      }
    });
  };
  $(window).on('statechange', onStateChange);
});
