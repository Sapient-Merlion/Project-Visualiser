var visualiser = (function($) {
  /* jshint ignore:line */
  'use strict';

  var conId = 'visualiser',
    $con,
    canvas;
  var rawData;
  var config = {
    height: 500,
    top_margin: 50,
    left_margin: 15,
    bottom_margin: 50,
    right_margin: 15,
    radius: 5
  };

  var axisXTotal, axisXWidth, axisXStart, axisXEnd;

  /* GENERIC */
  var init = function() {
    $con = $('#' + conId);
    if (!$con.length) {
      return;
    }

    if ($con.attr('data-left-margin')) {
      config.left_margin = $con.attr('data-left-margin');
    }
    if ($con.attr('data-bottom-margin')) {
      config.bottom_margin = $con.attr('data-bottom-margin');
    }

    if (getUrlParams('code') === '') {
      alert('Please login first.');
      return;
    }

    fetchFbAllData().then(function() {
      prepData();
      updateDataWithFBAllocations();

      canvas = SVG(conId).size('100%', config.height);
      resetCanvas();

      initUI();

      $('.page-loader').removeClass('show');
      console.log('data', data);
    });
  };

  var destroy = function() {
    removeListeners();
  };

  var update = function() {
    removeListeners();
    addListeners();
  };

  /* PRIVATE */
  var removeListeners = function() {};

  var addListeners = function() {};

  var drawAxisX = function(startDate, endDate) {
    axisXStart = startDate.clone().startOf('week');
    axisXEnd = endDate.clone().endOf('week');
    axisXTotal = axisXEnd.diff(axisXStart, 'days');
    // console.log('drawAxisX', axisXStart);
    // console.log('boardwidth', $con.width() - config.left_margin - config.right_margin);
    axisXWidth = Math.max(Math.floor(($con.width() - config.left_margin - config.right_margin) / axisXTotal), 5);

    var axisX = canvas.line(config.left_margin, config.height - config.bottom_margin, config.left_margin + axisXWidth * axisXTotal, config.height - config.bottom_margin).stroke({ width: 1, color: '#ccc' });
    // console.log('axisXWidth', axisXWidth, axisXTotal);

    var indexWeek = startDate.clone().startOf('week');
    while (indexWeek.isBefore(axisXEnd)) {
      var _days = indexWeek.diff(axisXStart, 'days');
      canvas.line(config.left_margin + axisXWidth * _days, config.height - config.bottom_margin, config.left_margin + axisXWidth * _days, config.height - config.bottom_margin + 5).stroke({ width: 1, color: '#ccc' });
      canvas
        .text(indexWeek.format('DD MMM'))
        .font({ fill: '#ccc', size: 8 })
        .move(config.left_margin + axisXWidth * _days - 10, config.height - config.bottom_margin + 10);
      indexWeek.add(1, 'week');
    }
  };

  var getCanvasPositionX = function(startDate) {
    // console.log('getCanvasPositionX', startDate, axisXStart, axisXWidth);
    return startDate.diff(axisXStart, 'days') * axisXWidth;
  };

  var getCanvasPositionY = function(target_bbox, dx) {
    var dy = config.top_margin;
    var rect;
    // console.log('getCanvasPositionY', target_bbox, dx);
    for (var i = 0; i < data.projects.length; i++) {
      if (data.projects[i].rect) {
        rect = data.projects[i].rect;
        var _bbox = rect.bbox();
        var contain = dx >= rect.x() && dx <= rect.x() + _bbox.w;
        // console.log(i, contain, rect.x(), _bbox.w, dx >= rect.x(), dx <= rect.x() + _bbox.w);
        if (contain) {
          dy += _bbox.y2 + 5;
          continue;
        }
      }
    }
    return dy;
  };

  var populateData = function() {
    _.each(data.projects, function(p, projectIndex) {
      var startX = getCanvasPositionX(moment(p.start_date, 'DD-MMM-YYYY'));
      var endX = getCanvasPositionX(moment(p.end_date, 'DD-MMM-YYYY'));
      var width = endX - startX;

      var resourcesCanvas = canvas.nested();
      _.each(_.sortBy(p.resources, 'domain'), function(resource, resourceIndex) {
        resourcesCanvas
          .rect(width, 10)
          .move(0, resourceIndex * 10)
          .attr('resource', resource.name)
          .attr(
            'domain',
            _.chain(resource.domain)
              .camelCase()
              .value()
          )
          .addClass('resource');
      });

      resourcesCanvas
        .move(config.left_margin + startX, getCanvasPositionY(resourcesCanvas.bbox(), config.left_margin + startX))
        .attr('project', p.project_track)
        .attr('pid', p.pid)
        .attr('startDate', p.start_date)
        .attr('endDate', p.end_date)
        .addClass('project')
        .click(function() {
          var project = _.find(data.projects, { pid: this.attr('pid') });
          // console.log('project', this.attr('project'), this.attr('pid'), project);

          $('.info__title').html(p.project_track);
          $('.info__desc').html(p.desc);
          $('.info__table tbody').empty();
          _.each(p.resources, function(resource) {
            var tds = '<td>' + resource.name + '</td>';
            tds += '<td>' + resource.allocation.allocation + '</td>';
            $('.info__table tbody').append('<tr data-id=' + resource.id + '>' + tds + '</tr>');
          });
        });

      p.rect = resourcesCanvas;
    });
  };

  var updateDataWithFBAllocations = function() {
    data.resources = resetPropertyFromCollection(data.resources, 'allocations', []);
    data.projects = resetPropertyFromCollection(data.projects, 'resources', []);

    _.forEach(data.allocations, addAllocationToData);
  };

  var initUI = function() {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
      var id = $(e.target)
        .attr('id')
        .replace(/nav-|-tab/gi, '');

      switch (id) {
        case 'dashboard':
          resetCanvas();
          break;
        case 'allocation':
          fetchFbAllocations().then(function() {
            updateDataWithFBAllocations();
            updateAllocationTable();
            $('.select-project, .select-resource').empty();

            $('.select-project').append('<option></option>');
            _.forEach(data.projects, function(o) {
              $('.select-project').append('<option value="' + o.pid + '">' + o.project_track + '</option>');
            });
            $('.select-project').select2({
              width: '100%',
              placeholder: 'Select a Project'
            });

            _.forEach(data.resources, function(o) {
              $('.select-resource').append('<option value="' + o.id + '">' + o.name + '</option>');
            });
            $('.select-resource').select2({
              width: '100%',
              placeholder: 'Assign the resource',
              allowClear: true
            });

            $('.select-allocation').select2({
              width: '100%',
              placeholder: 'Choose an allocation'
            });
          });
          break;
        case 'projects':
          fetchFbAllocations().then(function() {
            updateDataWithFBAllocations();
            updateProjectsTable();
          });
          break;
        case 'resources':
          updateResourceTable();
          break;
      }
    });

    $('.btn-resource-add').on('click', function(e) {
      e.preventDefault();
      if (!_.isEmpty($('.select-project').val()) && !_.isEmpty($('.select-resource').val()) && !_.isEmpty($('.select-allocation').val())) {
        disableElm($(e.target));
        console.log($('.select-project').val(), $('.select-resource').val(), $('.select-allocation').val());

        _.forEach($('.select-resource').val(), function(resource_id) {
          var uid = modFirebase.getNewKey('/allocations');
          var allocation = {
            pid: $('.select-project').val(),
            id: resource_id,
            allocation: $('.select-allocation').val(),
            uid: uid
          };

          if (addAllocationToData(allocation)) {
            modFirebase.updateViaObject('/allocations/' + uid, allocation).then(function() {
              fetchFbAllocations().then(function() {
                updateDataWithFBAllocations();
                updateAllocationTable();
              });
            });
          }
        });

        $('.select-project, .select-resource')
          .val(null)
          .trigger('change');
        enableElm($(e.target));
      }
      return false;
    });

    $(document).on('click', '.btn-update-resources', function(e) {
      if (!Cookies.get('rg_token')) {
        fetchRGToken(function() {
          fetchAllResourceDetails(function() {});
        });
      } else {
        fetchAllResourceDetails(function() {});
      }
    });

    $(document).on('click', '.btns-dashboard-views .btn', function(e) {
      e.preventDefault();
      $(this)
        .addClass('active')
        .siblings()
        .removeClass('active');
      canvas.attr('data-view', $(this).data('id'));

      return false;
    });

    $('[data-table="allocation-table"]').on('change', function() {
      var keyword = $(this).val();
      function customFilter(d, filterParams) {
        if (d.project_track.match(new RegExp(keyword, 'ig'))) {
          return true;
        }
        if (d.name.match(new RegExp(keyword, 'ig'))) {
          return true;
        }
        if (d.allocation.match(new RegExp(keyword, 'ig'))) {
          return true;
        }
        return false;
      }

      table.setFilter(customFilter);
    });
  };

  var updateAllocationTable = function() {
    console.log('updateAllocationTable', data);

    var arr = data.resources;
    var _data = _.flatten(
      _.map(arr, function(r) {
        return _.map(r.allocations, function(a) {
          return _.assign(
            {},
            _.chain(data.projects)
              .find({ pid: a.pid })
              .pick('project_track')
              .value(),
            { name: r.name, allocation: a.allocation, allocation_uid: a.uid }
          );
        });
      })
    );
    console.log('_data', _data);

    var editBtn = function(cell, formatterParams) {
      return "<button class='btn btn-primary btn-sm btn-resource-edit'>Edit</button>";
    };
    var deleteBtn = function(cell, formatterParams) {
      return "<button class='btn btn-danger btn-sm btn-resource-delete'>Delete</button>";
    };

    window.table = new Tabulator('.allocation-table', {
      layout: 'fitColumns',
      initialSort: [{ column: 'project_track', dir: 'desc' }],
      cellEdited: function(cell) {
        var rowData = cell.getRow().getData();
        modFirebase.updateViaObject(
          '/allocations/' + rowData.allocation_uid,
          _.assign({}, _.find(data.allocations, { uid: rowData.allocation_uid }), {
            allocation: rowData.allocation,
            pid: _.find(data.projects, { project_track: rowData.project_track }).pid,
            id: _.find(data.resources, { name: rowData.name }).id
          })
        );
      },
      columns: [
        {
          title: 'Projects',
          field: 'project_track',
          editor: 'autocomplete',
          editorParams: {
            allowEmpty: false,
            freetext: false,
            showListOnEmpty: true,
            values: _.map(data.projects, 'project_track')
          }
        },
        {
          title: 'Resource',
          field: 'name',
          editor: 'autocomplete',
          editorParams: {
            allowEmpty: false,
            freetext: false,
            showListOnEmpty: true,
            values: _.map(data.resources, 'name')
          },
          width: 250
        },
        {
          title: 'Allocation (%)',
          field: 'allocation',
          editor: 'autocomplete',
          editorParams: {
            allowEmpty: false,
            freetext: false,
            showListOnEmpty: true,
            values: ['100%', '10%', '10%', '20%', '25%', '30%', '40%', '50%', '60%', '70%', '75%', '80%', '90%']
          },
          width: 200
        },
        {
          title: '',
          headerSort:false,
          formatter: editBtn,
          cellClick: function(e, cell) {
            alert('Printing row data for: ' + cell.getRow().getData().name);
          },
          width: 70
        },
        {
          title: '',
          headerSort:false,
          formatter: deleteBtn,
          cellClick: function (e, cell) {
            var rowData = cell.getRow().getData();
            console.log('rowData', rowData);

            addToast({
              header: 'success',
              body: '<strong>' + rowData.name + '</strong>' + ' has been removed from ' + '<strong>' + rowData.project_track + '</strong>'
            });
            modFirebase.updateViaObject('/allocations/' + rowData.allocation_uid, null).then(function() {
              fetchFbAllocations().then(function() {
                updateDataWithFBAllocations();
                updateAllocationTable();
              });
            });
          },
          width: 85
        }
      ]
    });

    table.setData(_data);
  };

  var updateProjectsTable = function() {
    $('.projects-table tbody').empty();

    // console.log('data.projects', data.projects);
    _.forEach(data.projects, function(project) {
      // var actionsButtons = "<button class='btn btn-primary btn-sm'>Edit</button><button class='btn btn-danger btn-sm ml-1'>Delete</button>"
      var tds = '<td>' + project.client + '</td>';
      tds += '<td>' + project.pid + '</td>';
      tds += '<td>' + project.track + '</td>';
      tds += '<td>' + project.desc + '</td>';
      tds += '<td>' + project.start_date + '</td>';
      tds += '<td>' + project.end_date + '</td>';
      tds += '<td>' + project.project_business_days + '</td>';
      tds += '<td>' + _.map(project.resources, 'name').join(', ') + '</td>';
      tds += '<td>' + project.revenue + '</td>';
      $('.projects-table tbody').append('<tr>' + tds + '</tr>');
    });
  };

  var updateResourceTable = function() {
    console.log('updateAllocationTable', data);
    $('.resources-table tbody').empty();

    _.forEach(data.resources, function(resource) {
      if (resource.name.indexOf('OPEN NEEDS') == -1) {
        var tds = '<td>' + resource.name + '</td>';
        tds += '<td> ' + _.capitalize(resource.domain) + '</td>';
        tds += '<td>' + resource.timezone.name + '</td>';
        tds += '<td>' + resource.phone + '</td>';
        $('.resources-table tbody').append('<tr>' + tds + '</tr>');
      }
    });
  };

  var addAllocationToData = function(allocation) {
    var project = _.find(data.projects, { pid: allocation.pid });
    var resource = _.find(data.resources, { id: Number(allocation.id) });

    if (!_.find(project.resources, { id: resource.id })) {
      resource = _.omit(resource, 'allocations');
      resource.allocation = allocation;
      project.resources.push(resource);

      // updating data.resources
      resource = _.find(data.resources, { id: Number(allocation.id) });
      if (_.isEmpty(resource.allocations) || !_.isArray(resource.allocations)) {
        resource.allocations = [];
      }
      resource.allocations.push(allocation);

      return true;
    } else {
      addToast({
        title: 'Warn',
        body: resource.name + ' is already added to ' + project.project_track
      });

      return false;
    }
  };

  var prepData = function() {
    var mm_start_date, mm_end_date;
    data.projects = _.map(data.projects, function(p) {
      mm_start_date = moment(p.start_date, 'DD-MMM-YYYY');
      mm_end_date = moment(p.end_date, 'DD-MMM-YYYY');
      p.project_days = mm_end_date.diff(mm_start_date, 'days');
      p.project_business_days = businessDays(mm_start_date, mm_end_date);
      return p;
    });

    data.earliest_start_date = moment.min(
      _.map(data.projects, function(p) {
        return moment(p.start_date, 'DD-MMM-YYYY');
      })
    );

    data.latest_end_date = moment.max(
      _.map(data.projects, function(p) {
        return moment(p.end_date, 'DD-MMM-YYYY');
      })
    );

    data.days_between = data.latest_end_date.diff(data.earliest_start_date, 'days');
  };

  var resetCanvas = function() {
    canvas.clear();
    $('.btns-dashboard-views [data-id="resource"]').trigger('click');
    drawAxisX(data.earliest_start_date, data.latest_end_date);
    populateData();
  };

  /* PUBLIC */
  var getData = function() {
    return data;
  };

  return {
    init: init,
    destroy: destroy,
    update: update,
    getData: getData
  };
})(jQuery);
