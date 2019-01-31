var addToast = function(data) {
  var template = _.template($('#toastTemplate').html());
  var id = data.id || uuidv4();
  $('.toast-container').prepend(
    template({
      id: id,
      header: data.header,
      body: data.body
    })
  );
  $('#' + id)
    .toast({
      delay: 2000
    })
    .toast('show');
};

var addModal = function(data) {
  var template = _.template($('#modalTemplate').html());
  var id = data.id || uuidv4();
  $('body').append(
    template({
      id: id,
      header: data.header,
      body: data.body
    })
  );
  $('#' + id).modal('show');
};

var enableElm = function($elm) {
  $elm.removeClass('disabled');
  $elm.removeAttr('disabled');
  $elm.removeAttr('aria-disabled');
};

var disableElm = function($elm) {
  $elm.addClass('disabled');
  $elm.attr('disabled', 'disabled');
  $elm.attr('aria-disabled', 'true');
};
