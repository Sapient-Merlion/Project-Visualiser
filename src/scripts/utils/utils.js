function getUrlParams(id) {
  var o = _.chain(location.search)
    .replace('?', '')
    .split('&')
    .map(_.partial(_.split, _, '=', 2))
    .fromPairs()
    .value();
  return id ? o[id] : o;
}

function businessDays(startDate, endDate, excludes) {
  excludes = excludes ? excludes : ['weekends'];
  var businessDays = 0;
  var indexDate = startDate.clone();
  while (indexDate.isBefore(endDate)) {
    if (_.includes(excludes, 'weekends')) {
      if (_.includes([6, 7], indexDate.day())) {
        indexDate.add(1, 'day');
        continue;
      }
    }
    indexDate.add(1, 'day');
    businessDays++;
  }

  return businessDays;
}

function resetPropertyFromCollection(col, prop, resetValue) {
  return _.map(col, function (p) {
    if (resetValue) {
      if (_.isArray(resetValue)) {
        p[prop] = new Array();
      } else if (_.isObject(resetValue)) {
        p[prop] = new Object();
      } else {
        p[prop] = "";
      }
      return p;
    } else {
      return _.omit(p, prop);
    }
  });
}

var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}