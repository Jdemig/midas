$(function() {
	$('.success_message').hide();
	$('.message_errors').hide();
	
	//on submitting for them
    $("#contact_form").submit(function(e){
      	
      	e.preventDefault();
        
        //reset warnings and make button show loading text
        $('.message_errors').fadeOut();
        $('#submit_contact').button('loading');
        
        
        //disable elements in the form
        $('#contact_form .form-control').each(
        	function(){

            $(this).attr("disabled", "disabled");
        });
        
        
        //gather inputs data
        var name = $('input#name').val();
		var email = $('input#email').val();
		var subject = $('input#subject').val();
		var message = $('textarea#message').val();

		//location of sendering script
		var $location = "sender.php";
		
		
		//ajax post
		$.ajax({
		    type: 'POST',
         	dataType: 'json',
         	data: 'name=' + name + '&email=' + email + "&subject=" + subject + '&message=' + message,
    		url: $location,
			success: function(json){
				//reset disabled items
                $('#contact_form .form-control').each(function(){
                    $(this).removeAttr("disabled", "disabled");
                });
                $('#submit_contact').button('reset');
                
                //if error in the contact form show them
                if(json.error === true){
                	$('.message_errors').html(json.error_messages);
                    $('.message_errors').fadeIn();
                
                //else hide the form
                } else { 
                   $('#contact_form').slideUp(1000);
                   $('.success_message').fadeIn();
                }     
          }
		});
        
    });

});