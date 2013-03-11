$(function() {

	$(document).multislider({
		shows: {
			intro: {
				sub_shows: [
					'.intro-slides'
				],
				next: '.intro-slide-controls a.next',
				previous: '.intro-slide-controls a.previous'
			},
			apps: {
				sub_shows: [
					'.apps-intros',
					'.apps-page',
					'.apps-slides'
				],
				next: '.apps-controls a.next',
				previous: '.apps-controls a.previous',
				beforeHook: function( show, next_slide ) {
					var $apps_nav = $('.apps-nav').find('a');

					$apps_nav.removeClass('current');
					$apps_nav.eq( next_slide ).addClass('current');
				}
			}
		},
		debug: false
	});

	var $apps_nav = $('.apps-nav').find('a');

	$apps_nav.on('click', function( e ) {
		e.preventDefault();
		var this_index = $apps_nav.index( $(this) );

		$(document).multislider({
			action: 'seekSlide', 
			show_name: 'apps', 
			slide_num: this_index
		});
	});

});

