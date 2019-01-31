var data = {};

// resource guru
var rg_API = 'https://api.resourceguruapp.com/';
var rg_code = Cookies.get('rg_code') || getUrlParams('code');

var fetchDataLocal = function(cb) {
  console.log('API - fetchDataLocal');
  $.ajax({
    url: 'data/data.json',
    success: function(e) {
      console.log('API - fetchDataLocal success', e);
      if (cb) {
        cb(e);
      }
    }
  });
};

var fetchRGToken = function(cb) {
  console.log('API - fetchRGToken', rg_code);
  if (!rg_code) {
    // addToast({
    //   header: 'Error',
    //   body: 'resource guru code invalid, please revalidate yourself'
    // });
    location.href = "https://api.resourceguruapp.com/oauth/authorize?client_id=f290fa8d46576661ea6577e3f60df0d2514d038f43c8eec159ee06916eb99f08&redirect_uri=https://720db9c1.ap.ngrok.io&response_type=code";
  }

  $.ajax({
    async: true,
    crossDomain: true,
    method: 'POST',
    dataType: 'json',
    url: rg_API + 'oauth/token',
    contentType: 'application/json',
    cache: false,
    headers: {
      'Content-Type': 'application/json',
      'cache-control': 'no-cache'
    },
    processData: false,
    data: JSON.stringify({
      client_id: 'f290fa8d46576661ea6577e3f60df0d2514d038f43c8eec159ee06916eb99f08',
      client_secret: '063be42fa4226a740470c3151586cbe4c26c2c35f937243c1d57dc4923cb7db2',
      code: rg_code,
      grant_type: 'authorization_code',
      redirect_uri: 'https://720db9c1.ap.ngrok.io'
    }),
    success: function(e) {
      Cookies.set('rg_token', e.access_token);
      cb();
    }
  });
};

// var fetchPeopleLocal = function (success_cb, error_cb) {
//   console.log('API - fetchPeopleLocal');
//   $.ajax({
//     url: 'data/people.json',
//     success: function (e) {
//       if (_.isEmpty(e)) {
//         if (error_cb) {
//           error_cb();
//         }
//       } else {
//         peopleLocal = e;
//         console.log('API - fetchPeopleLocal', peopleLocal);
//         if (success_cb) {
//           success_cb();
//         }
//       }
//     },
//     error: function () {
//       if (error_cb) {
//         error_cb();
//       }
//     }
//   });
// };

// var fetchResourcesLocal = function(cb) {
//   console.log('API - fetchResourcesLocal');
//   $.ajax({
//     url: 'data/resources.json',
//     success: function(e) {
//       resourcesLocal = e;
//       console.log('API - fetchResourcesLocal', resourcesLocal);
//       if (cb) {
//         cb();
//       }
//     }
//   });
// };

// var fetchProjectsLocal = function(cb) {
//   console.log('API - fetchProjectsLocal');
//   $.ajax({
//     url: 'data/projects.json',
//     success: function(e) {
//       projectsLocal = e;
//       console.log('API - fetchProjectsLocal', projectsLocal);
//       if (cb) {
//         cb();
//       }
//     },
//     error: function(e) {
//       console.log('fetchProjectsLocal error', e);
//     }
//   });
// };

var validateRGToken = function (cb) {
  if (!Cookies.get('rg_token')) {
    fetchRGToken(function () {
      cb();
    });
  } else {
    cb();
  }
}

var fetchAllResourceDetails = function(cb) {
  console.log('API - fetchAllResourceDetails');

  fetchRGAPI('resources/?limit=0', function (e) {
    var resources = e;
    _.forEach(resources, function (r) {
      fetchRGAPI('resources/' + r.id, function (rData) {
        rData.domain = _.find(rData.selected_custom_field_options, { name: 'Domain', }) ? _.find(rData.selected_custom_field_options, { name: 'Domain', }).value : null;
        _.assignIn(_.find(resources, { id: rData.id }), rData);
    
        if (
          _.every(resources, function(item) {
            return item.hasOwnProperty('email');
          })
        ) {
          // console.log('done', JSON.stringify(resources, null, 2));
          modFirebase.updateViaObject('/resources', resources).then(function () {
            addToast({
              header: 'Update Success',
              body: 'resource data has been fetched from resources guru'
            });
          });
        }
      });
    });
  });
};

var fetchRGAPI = function (endpoint, cb) {
  validateRGToken(function () {
    $.ajax({
      url: rg_API + 'v1/sapientnitrorazorfish/' + endpoint,
      beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('rg_token'));
      },
      success: function(e) {
        console.log('API - fetchRGAPI success', endpoint, e);
        cb(e);
      },
      error: function(e) {
        console.log('API - fetchRGAPI error', endpoint, e);
        throw new Error(JSON.stringify(e));
      }
    });
  });
}

// var fetchAllProjectDetails = function(cb) {
//   console.log('API - fetchAllProjectDetails');
//   fetchProjectsLocal(function() {
//     _.each(projectsLocal, function(project) {
//       fetchProjectDetails(project.id, function(data) {
//         _.assignIn(_.find(projectsLocal, { id: data.id }), data);

//         if (
//           _.every(projectsLocal, function(item) {
//             return item.hasOwnProperty('email');
//           })
//         ) {
//           console.log('done', JSON.stringify(projectsLocal, null, 2));
//         }
//       });
//     });
//   });
// };

// var fetchProjectDetails = function(project_id, cb) {
//   console.log('API - fetchProjectDetails');
//   $.ajax({
//     url: 'https://api.resourceguruapp.com/v1/sapientnitrorazorfish/projects/' + project_id,
//     beforeSend: function(xhr) {
//       xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('rg_token'));
//     },
//     success: function(e) {
//       console.log('API - fetchProjectDetails success', e);
//       cb(e);
//     },
//     error: function(e) {
//       console.log('API - fetchProjectDetails error', e);
//     }
//   });
// };

var fetchFbAllocations = function () {
  return modFirebase.refMain('/allocations').then(function (response) {
    data.allocations = response;
    return;
  });
}

var fetchFbResources = function () {
  return modFirebase.refMain('/resources').then(function (response) {
    data.resources = response;
    return;
  });
}

var fetchFbAllData = function () {
  return modFirebase.ref('/').then(function (response) {
    response.allocations = _.values(response.allocations);
    _.assignIn(data, response);
    return;
  });
}