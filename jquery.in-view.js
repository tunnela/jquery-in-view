/**
 * In View (jQuery/Zepto) plugin for detecting HTML elements in view or out of view.
 *
 * @version 1.0.0
 * @copyright 2015, Lauri Tunnela (http://tunne.la)
 * @license http://tunne.la/MIT.txt The MIT License
 */

;!function(window, document, $, undefined) {

	"use strict";

	function elementInViewport(element) {
		var top = element.offsetTop,
		left = element.offsetLeft,
		width = element.offsetWidth,
		height = element.offsetHeight;

		while (element.offsetParent) {
			element = element.offsetParent;
			top += element.offsetTop;
			left += element.offsetLeft;
		}
		return (
			top < (window.pageYOffset + window.innerHeight) &&
			left < (window.pageXOffset + window.innerWidth) &&
			(top + height) > window.pageYOffset &&
			(left + width) > window.pageXOffset
		);
	}
	var	attached = false,
	instanceCount = 0,
	instances = [],
	$elements = $(),
	monitor = function(e) {
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
		visible = null,
		checking = false,
		count = 0,
		defaults = {
			count: $element.data("iv-count") === undefined ? 1 : parseInt($element.data("iv-count")),
			classVisible: $element.data("iv-class-visible") || "in-view",
			classHidden: $element.data("iv-class-hidden") || "out-of-view",
			classInitial: $element.data("iv-class-initial") || "initial-view",
			target: $element.data("iv-target") || element
		};
		options = $.extend({}, defaults, options);

		var classInitial = $.isFunction(options.classInitial) ? 
		options.classInitial.apply(element) : options.classInitial;

		$element.addClass(classInitial);
		$element.trigger('initial-view');

		this.check = function() {
			if (checking) {
				return;
			}
			checking = true;
			
			var classInitial = $.isFunction(options.classInitial) ? 
			options.classInitial.apply(element) : options.classInitial;

			$element.removeClass(classInitial);

			if ($.isVisible(element)) {
				if (visible == false || visible == null) {
					$element.trigger('in-view');

					if (!options.count || count++ < options.count) {
						var classHidden = $.isFunction(options.classHidden) ? 
						options.classHidden.apply(element) : options.classHidden,
						classVisible = $.isFunction(options.classVisible) ? 
						options.classVisible.apply(element) : options.classVisible,
						$target = $.isFunction(options.target) ? 
						options.target.apply(element) : $(options.target);

						if ($target.length) {
							$target.addClass(classVisible).removeClass(classHidden);
						}
						$element.trigger('in-view-pass');
					}
				}
				visible = true;
			} else {
				if (visible == true || visible == null) {
					$element.trigger('out-of-view');

					if (!options.count || count < options.count) {

						var classHidden = $.isFunction(options.classHidden) ? 
						options.classHidden.apply(element) : options.classHidden,
						classVisible = $.isFunction(options.classVisible) ? 
						options.classVisible.apply(element) : options.classVisible,
						$target = $.isFunction(options.target) ? 
						options.target.apply(element) : $(options.target);

						if ($target.length) {
							$target.addClass(classHidden).removeClass(classVisible);
						}
						$element.trigger('out-of-view-pass');
					}
				}
				visible = false;
			}
			checking = false;
		};
		attach(element);
	}

	$.fn.inView = function(options) {
		var apis = [],
		elements = this.each(function() {
			var id = $(this).data('in-view'), instance = null;

			if (id === undefined) {
				id = instanceCount++;
				$(this).data('in-view', id);
			} else {
				instance = instances[id] || null;
			}
			if (instance === null || typeof options !== 'undefined') {
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

	$.isVisible = function(element) {
		return elementInViewport($(element).get(0));
	};

	$(function() {
		if (!$('[data-iv-detect=false]').first().length) {
			$('[data-in-view]').inView();
		}
	});

}(window, document, window.Zepto || window.jQuery);