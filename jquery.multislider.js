/*
 * Custom multi-element slideshow; frankenstein bits of Flexslider in a custom container
 *
 * Author: Matt Stauffer (@stauffermatt)
 * Version: 0.1 (doesn't even work at this point. Mashup of Flexslider and individual work)
 */ 
;(function ($) {


	$.multislider = function( el, config ) {
		var vars = $.extend( {}, $.multislider.defaults, config ),
			methods = {},
			// Why is slider based on el instead of just an empty {}?
			slider = $(el);

		// store an externally-accessible reference to the slider
		$(el).data('multislider', slider);

		// Private methods
		methods = {
			init: function() {
				var $current_show;

				slider.touch = ("ontouchstart" in window) || window.DocumentTouch && document instanceof DocumentTouch;
				slider.transitions = (function() {
					// Test if we can use CSS transitions, and if so, get the appropriate key
					var obj = document.createElement('div'),
						props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
					for (var i in props) {
						if ( obj.style[ props[i] ] !== undefined ) {
							slider.pfx = props[i].replace('Perspective','').toLowerCase();
							slider.prop = "-" + slider.pfx + "-transform";
							return true;
						}
					}
					return false;
				}());

				methods.debugLog('init; ' + methods.getObjLength( vars.shows ) + ' items');

				// Initialize each master show
				methods.simpleObjForeach( vars.shows, methods.initMasterShow );

				$(document).on('slide-move', function ( e, show, direction ) {
					methods.slideMove( show, direction );
				});

				if ( slider.touch ) methods.touch();

				$(window).bind("resize focus", methods.resize);
			},
			initMasterShow: function( show, show_name ) {
				var $reference_subshow = $( show.sub_shows[0] ),
					$reference_slides = $reference_subshow.children('li'),
					$next = $( show.next ),
					$previous = $( show.previous );

				methods.debugLog('Processing master show:');
				methods.debugLog( show );

				// Create useful data object for this show; show defaults
				// @todo: Use extend here as well? It's just defaults...
				show.data = {
					animationLoop: show.animationLoop || true,
					afterHook: show.afterHook || function(){},
					beforeHook: show.beforeHook || function(){},
					cloneOffset: 1, // In case we bring carousel back later
					count: $reference_slides.length,
					current_slide: 0,
					sub_shows: [],
					transitions: true // Just in case... ?
				};
				show.name = show_name;
				show.data.last = show.data.count; // Hack. Why does this exist?


				// Process each sub show
				for( var i = 0, len = show.sub_shows.length; i < len; i++ ) {
					methods.debugLog('processing sub show ' + show.sub_shows[i] );
					methods.initSubShow( show, i );
				}

				// Attach controls
				$next.on('click', function( e ) {
					e.preventDefault();
					$(document).trigger('slide-move', [ show, 'next' ]);
				});
				$previous.on('click', function( e ) {
					e.preventDefault();
					$(document).trigger('slide-move', [ show, 'previous' ]);
				});

				/* Once we have touch.. 
				   @todo: couldn't we just do this all the time? We're already doing it for the click...
				if ( slider.touch ) {
					$next.add( $previous ).on("click touchstart", function( e ) {
						e.preventDefault();
					});
				}
				*/
			}, 
			initSubShow: function( show, a ) {
				var sub_show_selector = show.sub_shows[a],
					$current_slides = $( sub_show_selector ).children('li');

				show.data.sub_shows[a] = {};

				// cache slides
				show.data.sub_shows[a].$cached_slides = $current_slides;
				// @todo:Do we need to talk about outerwidth, padding, etc?
				show.data.sub_shows[a].width = $current_slides.first().width(); 
				// @todo: Do we neeed to wrap it with a container with appropriate CSS?
				show.data.sub_shows[a].container = $( sub_show_selector ).parent();
				// Not sure what this is for:
				show.data.sub_shows[a].args = {};

				// prep slides
				$current_slides.hide();
				$current_slides.first().show();
			},
			slideMove: function( show, direction ) {
				var next_slide = show.data.current_slide;

				// Find next slide id
				if( direction === 'next' ) {
					next_slide++;
					if( next_slide > (show.data.count - 1) ) {
						next_slide = 0;
					}

				} else {
					next_slide--;
					if( next_slide < 0 ) {
						next_slide = (show.data.count - 1);
					}
				}

				methods.debugLog('Moving "' + show.name + '" ' + direction + '. Next slide: ' + next_slide );

				// Transition
				slider.slideTransition( show.name, next_slide );

				show.data.current_slide = next_slide;

			},
			touch: function( ) {
				// @todo: If we're supporting touch, just use flexslider's touch functions here
			},
			resize: function( ) {
				// @todo: Any re-laying out we need to do on resize/re-focus
			},
			debugLog: function( obj ) {
				if( vars.debug ) {
					console.log( obj );
				}
			},
			getObjLength: function( obj ) {
				return Object.keys( obj ).length;
			},
			simpleObjForeach: function( obj, func ) {
				for (var i in obj) {
					if (obj.hasOwnProperty(i) && typeof(i) !== 'function') {
						func( obj[i], i );
					}
				}
			}
		};

		// Public methods
		/*
		slider.slideTransition = function( show_name, next_slide ) {
			var $slides,
				show = vars.shows[ show_name ];

			// before animation hook callback
			show.data.beforeHook( show, next_slide );

			// Simple hide/show for now
			// For each cached sub_show, hide all then show one
			// Replace with WORKING ON THE SLIDER ANIMATION thing
			for( var i = 0, len = show.data.sub_shows.length; i < len; i++ ) {
				$slides = show.data.sub_shows[i].$cached_slides;

				methods.debugLog('Hiding all slides from sub_show ' + show.sub_shows[i]);
				$slides.hide();

				methods.debugLog('Showing slide #' + next_slide );
				$slides.eq( next_slide ).show();
			}

			console.log('Animate.... @todo');
		};
		*/

	// public methods
	// slider.flexAnimate = function(target, pause, override, withSync, fromNav) {
	slider.slideTransition = function( show_name, next_slide ) {
		var show = vars.shows[ show_name ],
			reverse = false; // In case we bring it back later, keeping the references in here.

		// Hacky way to find direction.
		// @todo: Can we do this better?
		show.data.direction = ( show.data.current_slide < next_slide ) ? "next" : "prev";
		if( next_slide === 0 && show.data.current_slide !== 1 ) {
			// Catch looping. Problem is: If there are only 2 slides, it'll always animate right. Boo.
			// @todo: Do better
			show.data.direction = "next";
		}

		if( show.data.animating ) { return false; }

		show.data.animating = true;
		show.data.animating_to = next_slide;

		// before animation hook callback
		show.data.beforeHook( show, next_slide );

		// For each cached sub_show, animate
		for( var i = 0, len = show.data.sub_shows.length; i < len; i++ ) {
			/*
			$slides = show.data.sub_shows[i].$cached_slides;

			methods.debugLog('Hiding all slides from sub_show ' + show.sub_shows[i]);
			$slides.hide();

			methods.debugLog('Showing slide #' + next_slide );
			$slides.eq( next_slide ).show();
			*/

			var sub_show = show.data.sub_shows[i],
				width = sub_show.width, // @todo
				animationSpeed = 600;

			if (show.data.current_slide === 0 && next_slide === show.data.count - 1 && show.data.direction !== "next") {
				// If looping from first backwards to last
				slideString = (reverse) ? (show.data.count + show.data.cloneOffset) * width : 0;

			} else if (show.data.current_slide === show.data.last && next_slide === 0 && show.data.direction !== "prev") {
				// If looping from lsat forwards to first
				slideString = (reverse) ? 0 : (show.data.count + 1) * width;

			} else {
				// Normal advance
				slideString = (reverse) ? ((show.data.count - 1) - next_slide + show.data.cloneOffset) * width : (next_slide + show.data.cloneOffset) * width;
			}

			slider.setProps( show, sub_show, slideString, "", animationSpeed );

			// @todo: SHould this happen just once at the end of all of the loops? Currently it'll happen multiple times
			if ( show.data.transitions ) {
				if ( !vars.animationLoop || !slider.atEnd ) {
					slider.animating = false;
					show.data.current_slide = show.data.animating_to;
				}
				sub_show.container.unbind("webkitTransitionEnd transitionend");
				sub_show.container.bind("webkitTransitionEnd transitionend", function() {
					slider.wrapup( show, sub_show, width );
				});
			} else {
				sub_show.container.animate(slider.args, vars.animationSpeed, vars.easing, function(){
					slider.wrapup( show, sub_show, width );
				});
			}
		}
	};

	slider.wrapup = function( show, sub_show, width ) {
		// SLIDE:
		if ( show.data.current_slide === 0 && show.data.animating_to === show.data.last && vars.animationLoop ) {
			slider.setProps( show, sub_show, width, "jumpEnd" );
		} else if ( show.data.current_slide === show.data.last && show.data.animating_to === 0 && vars.animationLoop ) {
			slider.setProps( show, sub_show, width, "jumpStart" );
		}
		show.data.animating = false;
		show.data.current_slide = show.data.animating_to;

		// API: after() animation Callback
		show.data.afterHook( show );
	};

	// SLIDE:
	slider.setProps = function( show, sub_show, pos, special, dur ) {

		console.log( sub_show );

		var target = (function() {
			var posCheck = (pos) ? pos : (sub_show.data.width + vars.itemMargin) * slider.animating_to,
					posCalc = (function() {
							switch (special) {
								case "setTotal": return (reverse) ? ((show.data.count - 1) - sub_show.current_slide + show.data.cloneOffset) * pos : (sub_show.current_slide + show.cloneOffset) * pos;
								case "setTouch": return (reverse) ? pos : pos;
								case "jumpEnd": return (reverse) ? pos : show.data.count * pos;
								case "jumpStart": return (reverse) ? show.data.count * pos : pos;
								default: return pos;
						}
					}());
					return (posCalc * -1) + "px";
				}());

		if ( show.data.transitions ) {
			target = "translate3d(" + target + ",0,0)";
			dur = (dur !== undefined) ? (dur/1000) + "s" : "0s";
			sub_show.container.css("-" + slider.pfx + "-transition-duration", dur);
		}

		sub_show.args[slider.prop] = target;
		if ( show.data.transitions || dur === undefined ) sub_show.container.css( sub_show.args );
	};



		methods.init();
	};



	// Extended default settings
	$.multislider.defaults = {
		debug: false
	};

	// Create jQuery plugin
	$.fn.multislider = function( config ) {
		if ( config === undefined ) config = {};

		if ( typeof config === "object" && config.shows !== undefined ) {
			// Run multislider
			if( $(this).data('multislider') === undefined ) {
				new $.multislider( this, config );
			} else {
				// Already initialized.
			}

		} else {
			// public access
			var $slider = $(this).data('multislider');

			switch( config.action ) {
				case 'seekSlide': 
					$slider.slideTransition( config.show_name, config.slide_num ); 
					break;
			}
		}
	};

})(jQuery);