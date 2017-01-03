$(document).ready(function() {
  $('#message-form').submit(function(e) {
    e.preventDefault();
    var data = {
      name: $('#name').val(),
      email: $('#email').val(),
      message: $('#message').val(),
      subject: $('#sub').val(),
      telephone: $('#tel').val()
    };
    $.ajax({
      method: 'POST',
      action: '/message/contact',
      data: data,
      success: function() {
        $('#message-form').trigger('reset');
        $('#success-div').slideDown('slow');
      }
    });
  });

  function scroll(offset) {
      $('html,body').animate({
        scrollTop: $('#products').offset().top + offset
      }, 800);
  }
  $('#scroll-to-products').click(function() {
    scroll(-60);
  });

  // Mobile nav stuff
  $(function() {
    var display = displayNav(300);
    $('#m-nav-bars, #m-nav, .m-nav-button').on('click', display);
  });

  function displayNav(execTime) {
    return function() {
      if( ($('#m-nav').css('display') == 'block') ) {
        $('#m-nav').slideUp(execTime);
      } else {
        $('#m-nav').slideDown(execTime);
      }
    };
  }


});