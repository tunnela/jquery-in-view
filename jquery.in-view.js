/**
 * In View (jQuery/Zepto) plugin for detecting HTML elements in view or out of view.
 *
 * @copyright 2015, Lauri Tunnela (http://tunne.la)
 * @license http://tunne.la/MIT.txt The MIT License
 */

;!function(window, document, $, undefined) {

	"use strict";

	function elementInViewport(element, inView, offset, direction) {
		var top = element.offsetTop,
		left = element.offsetLeft,
		width = element.offsetWidth,
		height = element.offsetHeight,
		offsetLeft = 0,
		offsetRight = 0,
		offsetTop = 0,
		offsetBottom = 0,
		inView = parseInt(inView) || 0;

		if (inView > 1) {
			inView /= 100;
		}
		if (typeof offset !== 'undefined') {
			offsetLeft = offset.left;
			offsetRight = offset.right;
			offsetTop = offset.top;
			offsetBottom = offset.bottom;
		}
		while (element.offsetParent) {
			element = element.offsetParent;
			top += element.offsetTop;
			left += element.offsetLeft;
		}
		return (
			(top + offsetTop + (inView * height)) < (window.pageYOffset + window.innerHeight) &&
			(left + offsetLeft) < (window.pageXOffset + window.innerWidth) &&
			(top + height + offsetBottom) > window.pageYOffset &&
			(left + width + offsetRight) > window.pageXOffset
		);
	}
	var	attached = false,
	instanceCount = 0,
	instances = [],
	scrollOffset = { top: 0, left: 0 },
	scrollDirection = 2,
	$elements = $(),
	monitor = function(e) {
		var scrollTop = $(this).scrollTop(),
		scrollLeft = $(this).scrollLeft();

		if (scrollTop > scrollOffset.top) {
			scrollDirection = 2;
		} else if (scrollTop < scrollOffset.top) {
			scrollDirection = 0;
		} else if (scrollLeft > scrollOffset.left) {
			scrollDirection = 1;
		} else if (scrollLeft < scrollOffset.left) {
			scrollDirection = 3;
		}
		scrollOffset.top = scrollTop;
		scrollOffset.left = scrollLeft;

		$elements.each(function() {
			var instance = instances[$(this).data('in-view')];

			if (isInViewObject(instance)) {
				instance.check();
			}
		});
	},
	attach = function(element) {
		$elements = $elements.add(element);

		if (!attached) {
			attached = true;
			$(window).on('load scroll', monitor);
		}
	},
	isInViewObject = function(obj) {
		return obj instanceof InView;
	};

	function InView(element, options) {
		var $element = $(element),
		element = $element.get(0),
		data = function(key, defaultValue) {
			var value = $element.data("iv-" + key);

			if (value == null) {
				value = $element.attr("iv-" + key);
			}
			if (value == null) {
				value = defaultValue;
			}
			return value;
		},
		func = function(value, wrap) {
			wrap = wrap || false;
			return $.isFunction(value) ? value.apply(element) : 
			(wrap ? $(value) : value);
		},
		visible = null,
		checking = false,
		count = 0,
		defaults = {
			count: parseInt(data("count", 1)),
			classVisible: data("visible", "in-view"),
			classHidden: data("hidden", "out-of-view"),
			classInitial: data("initial", "initial-view"),
			target: data("target", element),
			offset: data("offset", '0').split(/\s*,\s*/),
			inView: parseInt(data("in-view", 0)) || 0
		};
		options = $.extend({}, defaults, options);

		var offsets = options.offset.length,
		classInitial = $.isFunction(options.classInitial) ? 
		options.classInitial.apply(element) : options.classInitial;

		$element.addClass(classInitial);
		$element.trigger('initial-view');

		options.offset = { 
			left: options.offset[0],
			right: options.offset[0],
			top: options.offset[0],
			bottom: options.offset[0]
		};

		if (offsets == 4) {
			options.offset.left = options.offset[3];
			options.offset.right = options.offset[1];
			options.offset.bottom = options.offset[2];
		} else if (offsets == 2) {
			options.offset.left = options.offset[1];
			options.offset.right = options.offset[1];
		}
		options.offset.left = parseInt(data("offset-left", options.offset.left)) || 0;
		options.offset.right = parseInt(data("offset-right", options.offset.right)) || 0;
		options.offset.bottom = parseInt(data("offset-bottom", options.offset.bottom)) || 0;
		options.offset.top = parseInt(data("offset-top", options.offset.top)) || 0;

		this.check = function() {
			if (checking) {
				return;
			}
			checking = true;
			
			var isVisible = visible;

			visible = $.isVisible(element, options.inView, options.offset, scrollDirection);

			if (isVisible == visible) {
				checking = false;
				return;
			}
			var classInitial = func(options.classInitial);
			$element.removeClass(classInitial);

			if (visible) {
				$element.trigger('in-view');

				if (!options.count || count++ < options.count) {
					var classHidden = func(options.classHidden),
					classVisible = func(options.classVisible),
					$target = func(options.target, true);

					if ($target.length) {
						$target.addClass(classVisible).removeClass(classHidden);
					}
					$element.trigger('in-view-pass');
				}
			} else {
				$element.trigger('out-of-view');

				if (!options.count || count < options.count) {
					var classHidden = func(options.classHidden),
					classVisible = func(options.classVisible),
					$target = func(options.target, true);

					if ($target.length) {
						$target.addClass(classHidden).removeClass(classVisible);
					}
					$element.trigger('out-of-view-pass');
				}
			}
			checking = false;
		};

		attach(element);
	}

	$.fn.inView = function(options) {
		var apis = [],
		elements = this.each(function() {
			var id = $(this).data('in-view'), instance = null;

			if (!id || typeof instances[id] === 'undefined') {
				id = ++instanceCount;
				$(this).data('in-view', id);
			} else {
				instance = instances[id] || null;
			}
			if (instance === null || !options) {
				instance = new InView(this, options);
				instances[id] = instance;
			} else {
				apis.push(instance);
			}
		}),
		apiCount = apis.length;

		if (apiCount) {
			return apiCount === 1 ? apis[0] : apis;
		} else {
			return elements;
		}
	};

	$.isVisible = function(element, inView, offset, direction) {
		return elementInViewport($(element).get(0), inView, offset, direction);
	};

	$(function() {
		if (!$('[data-iv-detect=false],[iv-detect=false]').first().length) {
			$('[data-iv],[iv]').inView();
		}
	});

}(window, document, window.Zepto || window.jQuery);