require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function blacklist (src) {
  var copy = {}
  var filter = arguments[1]

  if (typeof filter === 'string') {
    filter = {}
    for (var i = 1; i < arguments.length; i++) {
      filter[arguments[i]] = true
    }
  }

  for (var key in src) {
    // blacklist?
    if (filter[key]) continue

    copy[key] = src[key]
  }

  return copy
}

},{}],2:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _Select = require('./Select');

var _Select2 = _interopRequireDefault(_Select);

var _utilsStripDiacritics = require('./utils/stripDiacritics');

var _utilsStripDiacritics2 = _interopRequireDefault(_utilsStripDiacritics);

var requestId = 0;

function initCache(cache) {
	if (cache && typeof cache !== 'object') {
		cache = {};
	}
	return cache ? cache : null;
}

function updateCache(cache, input, data) {
	if (!cache) return;
	cache[input] = data;
}

function getFromCache(cache, input) {
	if (!cache) return;
	for (var i = input.length; i >= 0; --i) {
		var cacheKey = input.slice(0, i);
		if (cache[cacheKey] && (input === cacheKey || cache[cacheKey].complete)) {
			return cache[cacheKey];
		}
	}
}

function thenPromise(promise, callback) {
	if (!promise || typeof promise.then !== 'function') return;
	return promise.then(function (data) {
		callback(null, data);
	}, function (err) {
		callback(err);
	});
}

var stringOrNode = _react2['default'].PropTypes.oneOfType([_react2['default'].PropTypes.string, _react2['default'].PropTypes.node]);

var Async = _react2['default'].createClass({
	displayName: 'Async',

	propTypes: {
		cache: _react2['default'].PropTypes.any, // object to use to cache results, can be null to disable cache
		ignoreAccents: _react2['default'].PropTypes.bool, // whether to strip diacritics when filtering (shared with Select)
		ignoreCase: _react2['default'].PropTypes.bool, // whether to perform case-insensitive filtering (shared with Select)
		isLoading: _react2['default'].PropTypes.bool, // overrides the isLoading state when set to true
		loadOptions: _react2['default'].PropTypes.func.isRequired, // function to call to load options asynchronously
		loadingPlaceholder: _react2['default'].PropTypes.string, // replaces the placeholder while options are loading
		minimumInput: _react2['default'].PropTypes.number, // the minimum number of characters that trigger loadOptions
		noResultsText: stringOrNode, // placeholder displayed when there are no matching search results (shared with Select)
		onInputChange: _react2['default'].PropTypes.func, // onInputChange handler: function (inputValue) {}
		placeholder: stringOrNode, // field placeholder, displayed when there's no value (shared with Select)
		searchPromptText: stringOrNode, // label to prompt for search input
		searchingText: _react2['default'].PropTypes.string },
	// message to display while options are loading
	getDefaultProps: function getDefaultProps() {
		return {
			cache: true,
			ignoreAccents: true,
			ignoreCase: true,
			loadingPlaceholder: 'Loading...',
			minimumInput: 0,
			searchingText: 'Searching...',
			searchPromptText: 'Type to search'
		};
	},
	getInitialState: function getInitialState() {
		return {
			cache: initCache(this.props.cache),
			isLoading: false,
			options: []
		};
	},
	componentWillMount: function componentWillMount() {
		this._lastInput = '';
	},
	componentDidMount: function componentDidMount() {
		this.loadOptions('');
	},
	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		if (nextProps.cache !== this.props.cache) {
			this.setState({
				cache: initCache(nextProps.cache)
			});
		}
	},
	focus: function focus() {
		this.refs.select.focus();
	},
	resetState: function resetState() {
		this._currentRequestId = -1;
		this.setState({
			isLoading: false,
			options: []
		});
	},
	getResponseHandler: function getResponseHandler(input) {
		var _this = this;

		var _requestId = this._currentRequestId = requestId++;
		return function (err, data) {
			if (err) throw err;
			if (!_this.isMounted()) return;
			updateCache(_this.state.cache, input, data);
			if (_requestId !== _this._currentRequestId) return;
			_this.setState({
				isLoading: false,
				options: data && data.options || []
			});
		};
	},
	loadOptions: function loadOptions(input) {
		if (this.props.onInputChange) {
			var nextState = this.props.onInputChange(input);
			// Note: != used deliberately here to catch undefined and null
			if (nextState != null) {
				input = '' + nextState;
			}
		}
		if (this.props.ignoreAccents) input = (0, _utilsStripDiacritics2['default'])(input);
		if (this.props.ignoreCase) input = input.toLowerCase();

		this._lastInput = input;
		if (input.length < this.props.minimumInput) {
			return this.resetState();
		}
		var cacheResult = getFromCache(this.state.cache, input);
		if (cacheResult) {
			return this.setState({
				options: cacheResult.options
			});
		}
		this.setState({
			isLoading: true
		});
		var responseHandler = this.getResponseHandler(input);
		var inputPromise = thenPromise(this.props.loadOptions(input, responseHandler), responseHandler);
		return inputPromise ? inputPromise.then(function () {
			return input;
		}) : input;
	},
	render: function render() {
		var noResultsText = this.props.noResultsText;
		var _state = this.state;
		var isLoading = _state.isLoading;
		var options = _state.options;

		if (this.props.isLoading) isLoading = true;
		var placeholder = isLoading ? this.props.loadingPlaceholder : this.props.placeholder;
		if (isLoading) {
			noResultsText = this.props.searchingText;
		} else if (!options.length && this._lastInput.length < this.props.minimumInput) {
			noResultsText = this.props.searchPromptText;
		}
		return _react2['default'].createElement(_Select2['default'], _extends({}, this.props, {
			ref: 'select',
			isLoading: isLoading,
			noResultsText: noResultsText,
			onInputChange: this.loadOptions,
			options: options,
			placeholder: placeholder
		}));
	}
});

module.exports = Async;

},{"./Select":"react-select-plus","./utils/stripDiacritics":7,"react":undefined}],3:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var Dropdown = _react2['default'].createClass({
  displayName: 'Dropdown',

  propTypes: {
    children: _react2['default'].PropTypes.node
  },
  render: function render() {
    // This component adds no markup
    return this.props.children;
  }
});

module.exports = Dropdown;

},{"react":undefined}],4:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var Option = _react2['default'].createClass({
	displayName: 'Option',

	propTypes: {
		children: _react2['default'].PropTypes.node,
		className: _react2['default'].PropTypes.string, // className (based on mouse position)
		instancePrefix: _react2['default'].PropTypes.string.isRequired, // unique prefix for the ids (used for aria)
		isDisabled: _react2['default'].PropTypes.bool, // the option is disabled
		isFocused: _react2['default'].PropTypes.bool, // the option is focused
		isSelected: _react2['default'].PropTypes.bool, // the option is selected
		onFocus: _react2['default'].PropTypes.func, // method to handle mouseEnter on option element
		onSelect: _react2['default'].PropTypes.func, // method to handle click on option element
		onUnfocus: _react2['default'].PropTypes.func, // method to handle mouseLeave on option element
		option: _react2['default'].PropTypes.object.isRequired, // object that is base for that option
		optionIndex: _react2['default'].PropTypes.number, // index of the option, used to generate unique ids for aria
		showCheckedIcon: _react2['default'].PropTypes.bool // show/hide cheched icon (used for multuple options select)
	},
	getInitialState: function getInitialState() {
		return {
			isChecked: this.props.isSelected
		};
	},
	blockEvent: function blockEvent(event) {
		event.preventDefault();
		event.stopPropagation();
		if (event.target.tagName !== 'A' || !('href' in event.target)) {
			return;
		}
		if (event.target.target) {
			window.open(event.target.href, event.target.target);
		} else {
			window.location.href = event.target.href;
		}
	},
	handleMouseDown: function handleMouseDown(event) {
		event.preventDefault();
		event.stopPropagation();
		this.props.onSelect(this.props.option, event);
		this.setState({
			isChecked: !this.state.isChecked
		});
	},

	handleMouseEnter: function handleMouseEnter(event) {
		this.onFocus(event);
	},

	handleMouseMove: function handleMouseMove(event) {
		this.onFocus(event);
	},

	handleTouchEnd: function handleTouchEnd(event) {
		// Check if the view is being dragged, In this case
		// we don't want to fire the click event (because the user only wants to scroll)
		if (this.dragging) return;

		this.handleMouseDown(event);
	},

	handleTouchMove: function handleTouchMove(event) {
		// Set a flag that the view is being dragged
		this.dragging = true;
	},

	handleTouchStart: function handleTouchStart(event) {
		// Set a flag that the view is not being dragged
		this.dragging = false;
	},

	onFocus: function onFocus(event) {
		if (!this.props.isFocused) {
			this.props.onFocus(this.props.option, event);
		}
	},
	render: function render() {
		var _props = this.props;
		var option = _props.option;
		var instancePrefix = _props.instancePrefix;
		var optionIndex = _props.optionIndex;

		var className = (0, _classnames2['default'])(this.props.className, option.className, {
			'has-checkicon': this.props.showCheckedIcon && this.state.isChecked
		});

		return option.disabled ? _react2['default'].createElement(
			'div',
			{ className: className,
				onMouseDown: this.blockEvent,
				onClick: this.blockEvent },
			this.props.children
		) : _react2['default'].createElement(
			'div',
			{ className: className,
				style: option.style,
				role: 'option',
				onMouseDown: this.handleMouseDown,
				onMouseEnter: this.handleMouseEnter,
				onMouseMove: this.handleMouseMove,
				onTouchStart: this.handleTouchStart,
				onTouchMove: this.handleTouchMove,
				onTouchEnd: this.handleTouchEnd,
				id: instancePrefix + '-option-' + optionIndex,
				title: option.title },
			this.props.children
		);
	}
});

module.exports = Option;

},{"classnames":undefined,"react":undefined}],5:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var OptionGroup = _react2['default'].createClass({
	displayName: 'OptionGroup',

	propTypes: {
		children: _react2['default'].PropTypes.any,
		className: _react2['default'].PropTypes.string, // className (based on mouse position)
		label: _react2['default'].PropTypes.node, // the heading to show above the child options
		option: _react2['default'].PropTypes.object.isRequired },

	// object that is base for that option group
	blockEvent: function blockEvent(event) {
		event.preventDefault();
		event.stopPropagation();
		if (event.target.tagName !== 'A' || !('href' in event.target)) {
			return;
		}
		if (event.target.target) {
			window.open(event.target.href, event.target.target);
		} else {
			window.location.href = event.target.href;
		}
	},

	handleMouseDown: function handleMouseDown(event) {
		event.preventDefault();
		event.stopPropagation();
	},

	handleTouchEnd: function handleTouchEnd(event) {
		// Check if the view is being dragged, In this case
		// we don't want to fire the click event (because the user only wants to scroll)
		if (this.dragging) return;

		this.handleMouseDown(event);
	},

	handleTouchMove: function handleTouchMove(event) {
		// Set a flag that the view is being dragged
		this.dragging = true;
	},

	handleTouchStart: function handleTouchStart(event) {
		// Set a flag that the view is not being dragged
		this.dragging = false;
	},

	render: function render() {
		var option = this.props.option;

		var className = (0, _classnames2['default'])(this.props.className, option.className);

		return option.disabled ? _react2['default'].createElement(
			'div',
			{ className: className,
				onMouseDown: this.blockEvent,
				onClick: this.blockEvent },
			this.props.children
		) : _react2['default'].createElement(
			'div',
			{ className: className,
				style: option.style,
				onMouseDown: this.handleMouseDown,
				onMouseEnter: this.handleMouseEnter,
				onMouseMove: this.handleMouseMove,
				onTouchStart: this.handleTouchStart,
				onTouchMove: this.handleTouchMove,
				onTouchEnd: this.handleTouchEnd,
				title: option.title },
			_react2['default'].createElement(
				'div',
				{ className: 'Select-option-group-label' },
				this.props.label
			),
			this.props.children
		);
	}
});

module.exports = OptionGroup;

},{"classnames":undefined,"react":undefined}],6:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var Value = _react2['default'].createClass({

	displayName: 'Value',

	propTypes: {
		children: _react2['default'].PropTypes.node,
		disabled: _react2['default'].PropTypes.bool, // disabled prop passed to ReactSelect
		id: _react2['default'].PropTypes.string, // Unique id for the value - used for aria
		onClick: _react2['default'].PropTypes.func, // method to handle click on value label
		onRemove: _react2['default'].PropTypes.func, // method to handle removal of the value
		value: _react2['default'].PropTypes.object.isRequired },

	// the option object for this value
	handleMouseDown: function handleMouseDown(event) {
		if (event.type === 'mousedown' && event.button !== 0) {
			return;
		}
		if (this.props.onClick) {
			event.stopPropagation();
			this.props.onClick(this.props.value, event);
			return;
		}
		if (this.props.value.href) {
			event.stopPropagation();
		}
	},

	onRemove: function onRemove(event) {
		event.preventDefault();
		event.stopPropagation();
		this.props.onRemove(this.props.value);
	},

	handleTouchEndRemove: function handleTouchEndRemove(event) {
		// Check if the view is being dragged, In this case
		// we don't want to fire the click event (because the user only wants to scroll)
		if (this.dragging) return;

		// Fire the mouse events
		this.onRemove(event);
	},

	handleTouchMove: function handleTouchMove(event) {
		// Set a flag that the view is being dragged
		this.dragging = true;
	},

	handleTouchStart: function handleTouchStart(event) {
		// Set a flag that the view is not being dragged
		this.dragging = false;
	},

	renderRemoveIcon: function renderRemoveIcon() {
		if (this.props.disabled || !this.props.onRemove) return;
		return _react2['default'].createElement(
			'span',
			{ className: 'Select-value-icon',
				'aria-hidden': 'true',
				onMouseDown: this.onRemove,
				onTouchEnd: this.handleTouchEndRemove,
				onTouchStart: this.handleTouchStart,
				onTouchMove: this.handleTouchMove },
			'×'
		);
	},

	renderLabel: function renderLabel() {
		var className = 'Select-value-label';
		return this.props.onClick || this.props.value.href ? _react2['default'].createElement(
			'a',
			{ className: className, href: this.props.value.href, target: this.props.value.target, onMouseDown: this.handleMouseDown, onTouchEnd: this.handleMouseDown },
			this.props.children
		) : _react2['default'].createElement(
			'span',
			{ className: className, role: 'option', 'aria-selected': 'true', id: this.props.id },
			this.props.children
		);
	},

	render: function render() {
		return _react2['default'].createElement(
			'div',
			{ className: (0, _classnames2['default'])('Select-value', this.props.value.className),
				style: this.props.value.style,
				title: this.props.value.title
			},
			this.renderRemoveIcon(),
			this.renderLabel()
		);
	}

});

module.exports = Value;

},{"classnames":undefined,"react":undefined}],7:[function(require,module,exports){
'use strict';

var map = [{ 'base': 'A', 'letters': /[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g }, { 'base': 'AA', 'letters': /[\uA732]/g }, { 'base': 'AE', 'letters': /[\u00C6\u01FC\u01E2]/g }, { 'base': 'AO', 'letters': /[\uA734]/g }, { 'base': 'AU', 'letters': /[\uA736]/g }, { 'base': 'AV', 'letters': /[\uA738\uA73A]/g }, { 'base': 'AY', 'letters': /[\uA73C]/g }, { 'base': 'B', 'letters': /[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g }, { 'base': 'C', 'letters': /[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g }, { 'base': 'D', 'letters': /[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g }, { 'base': 'DZ', 'letters': /[\u01F1\u01C4]/g }, { 'base': 'Dz', 'letters': /[\u01F2\u01C5]/g }, { 'base': 'E', 'letters': /[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g }, { 'base': 'F', 'letters': /[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g }, { 'base': 'G', 'letters': /[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g }, { 'base': 'H', 'letters': /[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g }, { 'base': 'I', 'letters': /[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g }, { 'base': 'J', 'letters': /[\u004A\u24BF\uFF2A\u0134\u0248]/g }, { 'base': 'K', 'letters': /[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g }, { 'base': 'L', 'letters': /[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g }, { 'base': 'LJ', 'letters': /[\u01C7]/g }, { 'base': 'Lj', 'letters': /[\u01C8]/g }, { 'base': 'M', 'letters': /[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g }, { 'base': 'N', 'letters': /[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g }, { 'base': 'NJ', 'letters': /[\u01CA]/g }, { 'base': 'Nj', 'letters': /[\u01CB]/g }, { 'base': 'O', 'letters': /[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g }, { 'base': 'OI', 'letters': /[\u01A2]/g }, { 'base': 'OO', 'letters': /[\uA74E]/g }, { 'base': 'OU', 'letters': /[\u0222]/g }, { 'base': 'P', 'letters': /[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g }, { 'base': 'Q', 'letters': /[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g }, { 'base': 'R', 'letters': /[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g }, { 'base': 'S', 'letters': /[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g }, { 'base': 'T', 'letters': /[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g }, { 'base': 'TZ', 'letters': /[\uA728]/g }, { 'base': 'U', 'letters': /[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g }, { 'base': 'V', 'letters': /[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g }, { 'base': 'VY', 'letters': /[\uA760]/g }, { 'base': 'W', 'letters': /[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g }, { 'base': 'X', 'letters': /[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g }, { 'base': 'Y', 'letters': /[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g }, { 'base': 'Z', 'letters': /[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g }, { 'base': 'a', 'letters': /[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g }, { 'base': 'aa', 'letters': /[\uA733]/g }, { 'base': 'ae', 'letters': /[\u00E6\u01FD\u01E3]/g }, { 'base': 'ao', 'letters': /[\uA735]/g }, { 'base': 'au', 'letters': /[\uA737]/g }, { 'base': 'av', 'letters': /[\uA739\uA73B]/g }, { 'base': 'ay', 'letters': /[\uA73D]/g }, { 'base': 'b', 'letters': /[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g }, { 'base': 'c', 'letters': /[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g }, { 'base': 'd', 'letters': /[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g }, { 'base': 'dz', 'letters': /[\u01F3\u01C6]/g }, { 'base': 'e', 'letters': /[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g }, { 'base': 'f', 'letters': /[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g }, { 'base': 'g', 'letters': /[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g }, { 'base': 'h', 'letters': /[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g }, { 'base': 'hv', 'letters': /[\u0195]/g }, { 'base': 'i', 'letters': /[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g }, { 'base': 'j', 'letters': /[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g }, { 'base': 'k', 'letters': /[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g }, { 'base': 'l', 'letters': /[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g }, { 'base': 'lj', 'letters': /[\u01C9]/g }, { 'base': 'm', 'letters': /[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g }, { 'base': 'n', 'letters': /[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g }, { 'base': 'nj', 'letters': /[\u01CC]/g }, { 'base': 'o', 'letters': /[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g }, { 'base': 'oi', 'letters': /[\u01A3]/g }, { 'base': 'ou', 'letters': /[\u0223]/g }, { 'base': 'oo', 'letters': /[\uA74F]/g }, { 'base': 'p', 'letters': /[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g }, { 'base': 'q', 'letters': /[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g }, { 'base': 'r', 'letters': /[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g }, { 'base': 's', 'letters': /[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g }, { 'base': 't', 'letters': /[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g }, { 'base': 'tz', 'letters': /[\uA729]/g }, { 'base': 'u', 'letters': /[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g }, { 'base': 'v', 'letters': /[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g }, { 'base': 'vy', 'letters': /[\uA761]/g }, { 'base': 'w', 'letters': /[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g }, { 'base': 'x', 'letters': /[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g }, { 'base': 'y', 'letters': /[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g }, { 'base': 'z', 'letters': /[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g }];

module.exports = function stripDiacritics(str) {
	for (var i = 0; i < map.length; i++) {
		str = str.replace(map[i].letters, map[i].base);
	}
	return str;
};

},{}],"react-select-plus":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactInputAutosize = require('react-input-autosize');

var _reactInputAutosize2 = _interopRequireDefault(_reactInputAutosize);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _blacklist = require('blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _utilsStripDiacritics = require('./utils/stripDiacritics');

var _utilsStripDiacritics2 = _interopRequireDefault(_utilsStripDiacritics);

var _Async = require('./Async');

var _Async2 = _interopRequireDefault(_Async);

var _Dropdown = require('./Dropdown');

var _Dropdown2 = _interopRequireDefault(_Dropdown);

var _Option = require('./Option');

var _Option2 = _interopRequireDefault(_Option);

var _OptionGroup = require('./OptionGroup');

var _OptionGroup2 = _interopRequireDefault(_OptionGroup);

var _Value = require('./Value');

var _Value2 = _interopRequireDefault(_Value);

function clone(obj) {
	var copy = {};
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) {
			copy[attr] = obj[attr];
		};
	}
	return copy;
}

function stringifyValue(value) {
	if (typeof value === 'object') {
		return JSON.stringify(value);
	} else {
		return value;
	}
}

var stringOrNode = _react2['default'].PropTypes.oneOfType([_react2['default'].PropTypes.string, _react2['default'].PropTypes.node]);

var instanceId = 1;

var Select = _react2['default'].createClass({

	displayName: 'Select',

	propTypes: {
		addLabelText: _react2['default'].PropTypes.string, // placeholder displayed when you want to add a label on a multi-value input
		allowCreate: _react2['default'].PropTypes.bool, // whether to allow creation of new entries
		'aria-label': _react2['default'].PropTypes.string, // Aria label (for assistive tech)
		'aria-labelledby': _react2['default'].PropTypes.string, // HTML ID of an element that should be used as the label (for assistive tech)
		autoBlur: _react2['default'].PropTypes.bool, // automatically blur the component when an option is selected
		autofocus: _react2['default'].PropTypes.bool, // autofocus the component on mount
		autosize: _react2['default'].PropTypes.bool, // whether to enable autosizing or not
		backspaceRemoves: _react2['default'].PropTypes.bool, // whether backspace removes an item if there is no text input
		backspaceToRemoveMessage: _react2['default'].PropTypes.string, // Message to use for screenreaders to press backspace to remove the current item -
		// {label} is replaced with the item label
		className: _react2['default'].PropTypes.string, // className for the outer element
		clearAllText: stringOrNode, // title for the "clear" control when multi: true
		clearValueText: stringOrNode, // title for the "clear" control
		clearable: _react2['default'].PropTypes.bool, // should it be possible to reset value
		delimiter: _react2['default'].PropTypes.string, // delimiter to use to join multiple values for the hidden field value
		disabled: _react2['default'].PropTypes.bool, // whether the Select is disabled or not
		dropdownComponent: _react2['default'].PropTypes.func, // dropdown component to render the menu in
		escapeClearsValue: _react2['default'].PropTypes.bool, // whether escape clears the value when the menu is closed
		filterOption: _react2['default'].PropTypes.func, // method to filter a single option (option, filterString)
		filterOptions: _react2['default'].PropTypes.any, // boolean to enable default filtering or function to filter the options array ([options], filterString, [values])
		ignoreAccents: _react2['default'].PropTypes.bool, // whether to strip diacritics when filtering
		ignoreCase: _react2['default'].PropTypes.bool, // whether to perform case-insensitive filtering
		inputProps: _react2['default'].PropTypes.object, // custom attributes for the Input
		inputRenderer: _react2['default'].PropTypes.func, // returns a custom input component
		isLoading: _react2['default'].PropTypes.bool, // whether the Select is loading externally or not (such as options being loaded)
		isOpen: _react2['default'].PropTypes.bool, // whether the Select dropdown menu is open or not
		joinValues: _react2['default'].PropTypes.bool, // joins multiple values into a single form field with the delimiter (legacy mode)
		labelKey: _react2['default'].PropTypes.string, // path of the label value in option objects
		matchPos: _react2['default'].PropTypes.string, // (any|start) match the start or entire string when filtering
		matchProp: _react2['default'].PropTypes.string, // (any|label|value) which option property to filter on
		menuBuffer: _react2['default'].PropTypes.number, // optional buffer (in px) between the bottom of the viewport and the bottom of the menu
		menuContainerStyle: _react2['default'].PropTypes.object, // optional style to apply to the menu container
		menuRenderer: _react2['default'].PropTypes.func, // renders a custom menu with options
		menuStyle: _react2['default'].PropTypes.object, // optional style to apply to the menu
		multi: _react2['default'].PropTypes.bool, // multi-value input
		multiText: _react2['default'].PropTypes.bool, // show selected values only as text, defaults to false
		name: _react2['default'].PropTypes.string, // generates a hidden <input /> tag with this field name for html forms
		newOptionCreator: _react2['default'].PropTypes.func, // factory to create new options when allowCreate set
		noResultsText: stringOrNode, // placeholder displayed when there are no matching search results
		onBlur: _react2['default'].PropTypes.func, // onBlur handler: function (event) {}
		onBlurResetsInput: _react2['default'].PropTypes.bool, // whether input is cleared on blur
		onChange: _react2['default'].PropTypes.func, // onChange handler: function (newValue) {}
		onClose: _react2['default'].PropTypes.func, // fires when the menu is closed
		onFocus: _react2['default'].PropTypes.func, // onFocus handler: function (event) {}
		onInputChange: _react2['default'].PropTypes.func, // onInputChange handler: function (inputValue) {}
		onMenuScrollToBottom: _react2['default'].PropTypes.func, // fires when the menu is scrolled to the bottom; can be used to paginate options
		onOpen: _react2['default'].PropTypes.func, // fires when the menu is opened
		onValueClick: _react2['default'].PropTypes.func, // onClick handler for value labels: function (value, event) {}
		openAfterFocus: _react2['default'].PropTypes.bool, // boolean to enable opening dropdown when focused
		openOnFocus: _react2['default'].PropTypes.bool, // always open options menu on focus
		optionClassName: _react2['default'].PropTypes.string, // additional class(es) to apply to the <Option /> elements
		optionComponent: _react2['default'].PropTypes.func, // option component to render in dropdown
		optionGroupComponent: _react2['default'].PropTypes.func, // option group component to render in dropdown
		optionRenderer: _react2['default'].PropTypes.func, // optionRenderer: function (option) {}
		options: _react2['default'].PropTypes.array, // array of options
		pageSize: _react2['default'].PropTypes.number, // number of entries to page when using page up/down keys
		placeholder: stringOrNode, // field placeholder, displayed when there's no value
		renderInvalidValues: _react2['default'].PropTypes.bool, // boolean to enable rendering values that do not match any options
		required: _react2['default'].PropTypes.bool, // applies HTML5 required attribute when needed
		removeOptions: _react2['default'].PropTypes.bool, // remove options on select in multiple dropdown,
		resetValue: _react2['default'].PropTypes.any, // value to use when you clear the control
		scrollMenuIntoView: _react2['default'].PropTypes.bool, // boolean to enable the viewport to shift so that the full menu fully visible when engaged
		searchable: _react2['default'].PropTypes.bool, // whether to enable searching feature or not
		simpleValue: _react2['default'].PropTypes.bool, // pass the value to onChange as a simple value (legacy pre 1.0 mode), defaults to false
		style: _react2['default'].PropTypes.object, // optional style to apply to the control
		tabIndex: _react2['default'].PropTypes.string, // optional tab index of the control
		tabSelectsValue: _react2['default'].PropTypes.bool, // whether to treat tabbing out while focused to be value selection
		value: _react2['default'].PropTypes.any, // initial field value
		valueComponent: _react2['default'].PropTypes.func, // value component to render
		valueKey: _react2['default'].PropTypes.string, // path of the label value in option objects
		valueRenderer: _react2['default'].PropTypes.func, // valueRenderer: function (option) {}
		wrapperStyle: _react2['default'].PropTypes.object },

	// optional style to apply to the component wrapper
	statics: { Async: _Async2['default'] },

	getDefaultProps: function getDefaultProps() {
		return {
			addLabelText: 'Add "{label}"?',
			autosize: true,
			allowCreate: false,
			backspaceRemoves: true,
			backspaceToRemoveMessage: 'Press backspace to remove {label}',
			clearable: true,
			clearAllText: 'Clear all',
			clearValueText: 'Clear value',
			delimiter: ',',
			disabled: false,
			dropdownComponent: _Dropdown2['default'],
			escapeClearsValue: true,
			filterOptions: true,
			ignoreAccents: true,
			ignoreCase: true,
			inputProps: {},
			isLoading: false,
			joinValues: false,
			labelKey: 'label',
			matchPos: 'any',
			matchProp: 'any',
			menuBuffer: 0,
			multi: false,
			multiText: false,
			noResultsText: 'No results found',
			onBlurResetsInput: true,
			openAfterFocus: false,
			optionComponent: _Option2['default'],
			optionGroupComponent: _OptionGroup2['default'],
			pageSize: 5,
			placeholder: 'Select...',
			renderInvalidValues: false,
			removeOptions: true,
			required: false,

			resetValue: null,
			scrollMenuIntoView: true,
			searchable: true,
			simpleValue: false,
			tabSelectsValue: true,
			valueComponent: _Value2['default'],
			valueKey: 'value'
		};
	},

	getInitialState: function getInitialState() {
		return {
			inputValue: '',
			isFocused: false,
			isLoading: false,
			isOpen: false,
			isPseudoFocused: false,
			required: false
		};
	},

	componentWillMount: function componentWillMount() {
		this._flatOptions = this.flattenOptions(this.props.options);
		this._instancePrefix = 'react-select-' + ++instanceId + '-';
		var valueArray = this.getValueArray(this.props.value);

		if (this.props.required) {
			this.setState({
				required: this.handleRequired(valueArray[0], this.props.multi)
			});
		}
	},

	componentDidMount: function componentDidMount() {
		if (this.props.autofocus) {
			this.focus();
		}
	},

	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		if (nextProps.options !== this.props.options) {
			this._flatOptions = this.flattenOptions(nextProps.options);
		}

		var valueArray = this.getValueArray(nextProps.value, nextProps);

		if (nextProps.required) {
			this.setState({
				required: this.handleRequired(valueArray[0], nextProps.multi)
			});
		}
	},

	componentWillUpdate: function componentWillUpdate(nextProps, nextState) {
		if (nextState.isOpen !== this.state.isOpen) {
			var handler = nextState.isOpen ? nextProps.onOpen : nextProps.onClose;
			handler && handler();
		}
	},

	componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
		// focus to the selected option
		var multiScrollDisable = this.props.multi && !this.props.removeOptions;
		if (this.refs.menu && this.refs.focused && this.state.isOpen && !this.hasScrolledToOption && !multiScrollDisable) {
			var focusedOptionNode = _reactDom2['default'].findDOMNode(this.refs.focused);
			var focusedOptionPreviousSibling = focusedOptionNode.previousSibling;
			var focusedOptionParent = focusedOptionNode.parentElement;
			var menuNode = _reactDom2['default'].findDOMNode(this.refs.menu);
			if (focusedOptionPreviousSibling) {
				menuNode.scrollTop = focusedOptionPreviousSibling.offsetTop;
			} else if (focusedOptionParent && focusedOptionParent === 'Select-menu') {
				menuNode.scrollTop = focusedOptionParent.offsetTop;
			} else {
				menuNode.scrollTop = focusedOptionNode.offsetTop;
			}
			this.hasScrolledToOption = true;
		} else if (!this.state.isOpen) {
			this.hasScrolledToOption = false;
		}

		if (this._scrollToFocusedOptionOnUpdate && this.refs.focused && this.refs.menu && !multiScrollDisable) {
			this._scrollToFocusedOptionOnUpdate = false;
			var focusedDOM = _reactDom2['default'].findDOMNode(this.refs.focused);
			var menuDOM = _reactDom2['default'].findDOMNode(this.refs.menu);
			var focusedRect = focusedDOM.getBoundingClientRect();
			var menuRect = menuDOM.getBoundingClientRect();
			if (focusedRect.bottom > menuRect.bottom || focusedRect.top < menuRect.top) {
				menuDOM.scrollTop = focusedDOM.offsetTop + focusedDOM.clientHeight - menuDOM.offsetHeight;
			}
		}
		if (this.props.scrollMenuIntoView && this.refs.menuContainer && !multiScrollDisable) {
			var menuContainerRect = this.refs.menuContainer.getBoundingClientRect();
			if (window.innerHeight < menuContainerRect.bottom + this.props.menuBuffer) {
				window.scrollBy(0, menuContainerRect.bottom + this.props.menuBuffer - window.innerHeight);
			}
		}
		if (prevProps.disabled !== this.props.disabled) {
			this.setState({ isFocused: false }); // eslint-disable-line react/no-did-update-set-state
			this.closeMenu();
		}
	},

	focus: function focus() {
		if (!this.refs.input) return;
		this.refs.input.focus();

		if (this.props.openAfterFocus) {
			this.setState({
				isOpen: true
			});
		}
	},

	blurInput: function blurInput() {
		if (!this.refs.input) return;
		this.refs.input.blur();
	},

	handleTouchMove: function handleTouchMove(event) {
		// Set a flag that the view is being dragged
		this.dragging = true;
	},

	handleTouchStart: function handleTouchStart(event) {
		// Set a flag that the view is not being dragged
		this.dragging = false;
	},

	handleTouchEnd: function handleTouchEnd(event) {
		// Check if the view is being dragged, In this case
		// we don't want to fire the click event (because the user only wants to scroll)
		if (this.dragging) return;

		// Fire the mouse events
		this.handleMouseDown(event);
	},

	handleTouchEndClearValue: function handleTouchEndClearValue(event) {
		// Check if the view is being dragged, In this case
		// we don't want to fire the click event (because the user only wants to scroll)
		if (this.dragging) return;

		// Clear the value
		this.clearValue(event);
	},

	handleMouseDown: function handleMouseDown(event) {
		// if the event was triggered by a mousedown and not the primary
		// button, or if the component is disabled, ignore it.
		if (this.props.disabled || event.type === 'mousedown' && event.button !== 0) {
			return;
		}

		if (event.target.tagName === 'INPUT') {
			return;
		}

		// prevent default event handlers
		event.stopPropagation();
		event.preventDefault();

		// for the non-searchable select, toggle the menu
		if (!this.props.searchable) {
			this.focus();
			return this.setState({
				isOpen: !this.state.isOpen
			});
		}

		if (this.state.isFocused) {
			// On iOS, we can get into a state where we think the input is focused but it isn't really,
			// since iOS ignores programmatic calls to input.focus() that weren't triggered by a click event.
			// Call focus() again here to be safe.
			this.focus();

			var input = this.refs.input;
			if (typeof input.getInput === 'function') {
				// Get the actual DOM input if the ref is an <Input /> component
				input = input.getInput();
			}

			// clears the value so that the cursor will be at the end of input when the component re-renders
			input.value = '';

			// if the input is focused, ensure the menu is open
			this.setState({
				isOpen: true,
				isPseudoFocused: false
			});
		} else {
			// otherwise, focus the input and open the menu
			this._openAfterFocus = true;
			this.focus();
		}
	},

	handleMouseDownOnArrow: function handleMouseDownOnArrow(event) {
		// if the event was triggered by a mousedown and not the primary
		// button, or if the component is disabled, ignore it.
		if (this.props.disabled || event.type === 'mousedown' && event.button !== 0) {
			return;
		}
		// If the menu isn't open, let the event bubble to the main handleMouseDown
		if (!this.state.isOpen) {
			return;
		}
		// prevent default event handlers
		event.stopPropagation();
		event.preventDefault();
		// close the menu
		this.closeMenu();
	},

	handleMouseDownOnMenu: function handleMouseDownOnMenu(event) {
		// if the event was triggered by a mousedown and not the primary
		// button, or if the component is disabled, ignore it.
		if (this.props.disabled || event.type === 'mousedown' && event.button !== 0) {
			return;
		}
		event.stopPropagation();
		event.preventDefault();

		this._openAfterFocus = true;
		this.focus();
	},

	closeMenu: function closeMenu() {
		this.setState({
			isOpen: false,
			isPseudoFocused: this.state.isFocused && !this.props.multi,
			inputValue: ''
		});
		this.hasScrolledToOption = false;
	},

	handleInputFocus: function handleInputFocus(event) {
		var isOpen = this.state.isOpen || this._openAfterFocus || this.props.openOnFocus;
		if (this.props.onFocus) {
			this.props.onFocus(event);
		}
		this.setState({
			isFocused: true,
			isOpen: isOpen
		});
		this._openAfterFocus = false;
	},

	handleInputBlur: function handleInputBlur(event) {
		// The check for menu.contains(activeElement) is necessary to prevent IE11's scrollbar from closing the menu in certain contexts.
		if (this.refs.menu && (this.refs.menu === document.activeElement || this.refs.menu.contains(document.activeElement))) {
			this.focus();
			return;
		}

		if (this.props.onBlur) {
			this.props.onBlur(event);
		}
		var onBlurredState = {
			isFocused: false,
			isOpen: false,
			isPseudoFocused: false
		};
		if (this.props.onBlurResetsInput) {
			onBlurredState.inputValue = '';
		}
		this.setState(onBlurredState);
	},

	handleInputChange: function handleInputChange(event) {
		var newInputValue = event.target.value;
		if (this.state.inputValue !== event.target.value && this.props.onInputChange) {
			var nextState = this.props.onInputChange(newInputValue);
			// Note: != used deliberately here to catch undefined and null
			if (nextState != null && typeof nextState !== 'object') {
				newInputValue = '' + nextState;
			}
		}
		this.setState({
			isOpen: true,
			isPseudoFocused: false,
			inputValue: newInputValue
		});
	},

	handleKeyDown: function handleKeyDown(event) {
		if (this.props.disabled) return;
		switch (event.keyCode) {
			case 8:
				// backspace
				if (!this.state.inputValue && this.props.backspaceRemoves) {
					event.preventDefault();
					this.popValue();
				}
				return;
			case 9:
				// tab
				if (event.shiftKey || !this.state.isOpen || !this.props.tabSelectsValue) {
					return;
				}
				this.selectFocusedOption();
				return;
			case 13:
				// enter
				if (!this.state.isOpen) return;
				event.stopPropagation();
				this.selectFocusedOption();
				break;
			case 27:
				// escape
				if (this.state.isOpen) {
					this.closeMenu();
					event.stopPropagation();
				} else if (this.props.clearable && this.props.escapeClearsValue) {
					this.clearValue(event);
					event.stopPropagation();
				}
				break;
			case 38:
				// up
				this.focusPreviousOption();
				break;
			case 40:
				// down
				this.focusNextOption();
				break;
			case 33:
				// page up
				this.focusPageUpOption();
				break;
			case 34:
				// page down
				this.focusPageDownOption();
				break;
			case 35:
				// end key
				this.focusEndOption();
				break;
			case 36:
				// home key
				this.focusStartOption();
				break;
			// case 188: // ,
			// 	if (this.props.allowCreate && this.props.multi) {
			// 		event.preventDefault();
			// 		event.stopPropagation();
			// 		this.selectFocusedOption();
			// 	} else {
			// 		return;
			// 	}
			// break;
			default:
				return;
		}
		event.preventDefault();
	},

	handleValueClick: function handleValueClick(option, event) {
		if (!this.props.onValueClick) return;
		this.props.onValueClick(option, event);
	},

	handleMenuScroll: function handleMenuScroll(event) {
		if (!this.props.onMenuScrollToBottom || this.props.multi && !this.props.removeOptions) return;
		var target = event.target;

		if (target.scrollHeight > target.offsetHeight && !(target.scrollHeight - target.offsetHeight - target.scrollTop)) {
			this.props.onMenuScrollToBottom();
		}
	},

	handleRequired: function handleRequired(value, multi) {
		if (!value) return true;
		return multi ? value.length === 0 : Object.keys(value).length === 0;
	},

	getOptionLabel: function getOptionLabel(op) {
		return op[this.props.labelKey];
	},

	/**
  * Turns a value into an array from the given options
  * @param	{String|Number|Array}	value		- the value of the select input
  * @param	{Object}		nextProps	- optionally specify the nextProps so the returned array uses the latest configuration
  * @returns	{Array}	the value of the select represented in an array
  */
	getValueArray: function getValueArray(value, nextProps) {
		var _this = this;

		/** support optionally passing in the `nextProps` so `componentWillReceiveProps` updates will function as expected */
		var props = typeof nextProps === 'object' ? nextProps : this.props;
		if (props.multi) {
			if (typeof value === 'string') value = value.split(props.delimiter);
			if (!Array.isArray(value)) {
				if (value === null || value === undefined) return [];
				value = [value];
			}
			return value.map(function (value) {
				return _this.expandValue(value, props);
			}).filter(function (i) {
				return i;
			});
		}
		var expandedValue = this.expandValue(value, props);
		return expandedValue ? [expandedValue] : [];
	},

	/**
  * Retrieve a value from the given options and valueKey
  * @param	{String|Number|Array}	value	- the selected value(s)
  * @param	{Object}		props	- the Select component's props (or nextProps)
  */
	expandValue: function expandValue(value, props) {
		if (typeof value !== 'string' && typeof value !== 'number') return value;
		var _props = this.props;
		var labelKey = _props.labelKey;
		var valueKey = _props.valueKey;
		var renderInvalidValues = _props.renderInvalidValues;

		var options = this._flatOptions;
		if (!options || value === '') return;
		for (var i = 0; i < options.length; i++) {
			if (options[i][valueKey] === value) return options[i];
		}

		// no matching option, return an invalid option if renderInvalidValues is enabled
		if (renderInvalidValues) {
			var _ref;

			return _ref = {
				invalid: true
			}, _defineProperty(_ref, labelKey, value), _defineProperty(_ref, valueKey, value), _ref;
		}
	},

	setValue: function setValue(value) {
		var _this2 = this;

		if (this.props.autoBlur) {
			this.blurInput();
		}
		if (!this.props.onChange) return;
		if (this.props.required) {
			var required = this.handleRequired(value, this.props.multi);
			this.setState({ required: required });
		}
		if (this.props.simpleValue && value) {
			value = this.props.multi ? value.map(function (i) {
				return i[_this2.props.valueKey];
			}).join(this.props.delimiter) : value[this.props.valueKey];
		}
		this.props.onChange(value);
	},

	selectValue: function selectValue(value) {
		var _this3 = this;

		//NOTE: update value in the callback to make sure the input value is empty so that there are no sttyling issues (Chrome had issue otherwise)
		this.hasScrolledToOption = false;
		if (this.props.multi) {
			this.setState({
				inputValue: '',
				focusedIndex: null
			}, function () {
				if (!_this3.props.removeOptions) {
					var values = _this3.getValueArray(_this3.props.value);
					if (values.indexOf(value) > -1) {
						_this3.removeValue(value);
					} else {
						_this3.addValue(value);
					}
				} else {
					_this3.addValue(value);
				}
			});
		} else {
			this.setState({
				isOpen: false,
				inputValue: '',
				isPseudoFocused: this.state.isFocused
			}, function () {
				_this3.setValue(value);
			});
		}
	},

	addValue: function addValue(value) {
		var valueArray = this.getValueArray(this.props.value);
		this.setValue(valueArray.concat(value));
	},

	popValue: function popValue() {
		var valueArray = this.getValueArray(this.props.value);
		if (!valueArray.length) return;
		if (valueArray[valueArray.length - 1].clearableValue === false) return;
		this.setValue(valueArray.slice(0, valueArray.length - 1));
	},

	removeValue: function removeValue(value) {
		var valueArray = this.getValueArray(this.props.value);
		this.setValue(valueArray.filter(function (i) {
			return i !== value;
		}));
		this.focus();
	},

	clearValue: function clearValue(event) {
		// if the event was triggered by a mousedown and not the primary
		// button, ignore it.
		if (event && event.type === 'mousedown' && event.button !== 0) {
			return;
		}
		event.stopPropagation();
		event.preventDefault();
		this.setValue(this.props.resetValue);
		this.setState({
			isOpen: false,
			inputValue: ''
		}, this.focus);
	},

	focusOption: function focusOption(option) {
		this.setState({
			focusedOption: option
		});
	},

	focusNextOption: function focusNextOption() {
		this.focusAdjacentOption('next');
	},

	focusPreviousOption: function focusPreviousOption() {
		this.focusAdjacentOption('previous');
	},

	focusPageUpOption: function focusPageUpOption() {
		this.focusAdjacentOption('page_up');
	},

	focusPageDownOption: function focusPageDownOption() {
		this.focusAdjacentOption('page_down');
	},

	focusStartOption: function focusStartOption() {
		this.focusAdjacentOption('start');
	},

	focusEndOption: function focusEndOption() {
		this.focusAdjacentOption('end');
	},

	focusAdjacentOption: function focusAdjacentOption(dir) {
		var options = this._visibleOptions.map(function (option, index) {
			return { option: option, index: index };
		}).filter(function (option) {
			return !option.option.disabled;
		});
		this._scrollToFocusedOptionOnUpdate = true;
		if (!this.state.isOpen) {
			this.setState({
				isOpen: true,
				inputValue: '',
				focusedOption: this._focusedOption || options[dir === 'next' ? 0 : options.length - 1].option
			});
			return;
		}
		if (!options.length) return;
		var focusedIndex = -1;
		for (var i = 0; i < options.length; i++) {
			if (this._focusedOption === options[i].option) {
				focusedIndex = i;
				break;
			}
		}
		if (dir === 'next' && focusedIndex !== -1) {
			focusedIndex = (focusedIndex + 1) % options.length;
		} else if (dir === 'previous') {
			if (focusedIndex > 0) {
				focusedIndex = focusedIndex - 1;
			} else {
				focusedIndex = options.length - 1;
			}
		} else if (dir === 'start') {
			focusedIndex = 0;
		} else if (dir === 'end') {
			focusedIndex = options.length - 1;
		} else if (dir === 'page_up') {
			var potentialIndex = focusedIndex - this.props.pageSize;
			if (potentialIndex < 0) {
				focusedIndex = 0;
			} else {
				focusedIndex = potentialIndex;
			}
		} else if (dir === 'page_down') {
			var potentialIndex = focusedIndex + this.props.pageSize;
			if (potentialIndex > options.length - 1) {
				focusedIndex = options.length - 1;
			} else {
				focusedIndex = potentialIndex;
			}
		}

		if (focusedIndex === -1) {
			focusedIndex = 0;
		}

		this.setState({
			focusedIndex: options[focusedIndex].index,
			focusedOption: options[focusedIndex].option
		});
	},

	selectFocusedOption: function selectFocusedOption() {
		// if (this.props.allowCreate && !this.state.focusedOption) {
		// 	return this.selectValue(this.state.inputValue);
		// }
		if (this._focusedOption) {
			return this.selectValue(this._focusedOption);
		}
	},

	renderLoading: function renderLoading() {
		if (!this.props.isLoading) return;
		return _react2['default'].createElement(
			'span',
			{ className: 'Select-loading-zone', 'aria-hidden': 'true' },
			_react2['default'].createElement('span', { className: 'Select-loading' })
		);
	},

	renderValue: function renderValue(valueArray, isOpen) {
		var _this4 = this;

		var renderLabel = this.props.valueRenderer || this.getOptionLabel;
		var ValueComponent = this.props.valueComponent;

		if (!valueArray.length) {
			return !this.state.inputValue ? _react2['default'].createElement(
				'div',
				{ className: 'Select-placeholder' },
				this.props.placeholder
			) : null;
		}
		var onClick = this.props.onValueClick ? this.handleValueClick : null;
		if (this.props.multi) {
			if (this.props.multiText) {
				var value = valueArray.map(function (i) {
					return stringifyValue(i[_this4.props.valueKey]);
				}).join(', ');
				return _react2['default'].createElement(
					'span',
					{ className: 'Select-value-text' },
					value
				);
			} else {
				return valueArray.map(function (value, i) {
					return _react2['default'].createElement(
						ValueComponent,
						{
							id: _this4._instancePrefix + '-value-' + i,
							instancePrefix: _this4._instancePrefix,
							disabled: _this4.props.disabled || value.clearableValue === false,
							key: 'value-' + i + '-' + value[_this4.props.valueKey],
							onClick: onClick,
							onRemove: _this4.removeValue,
							value: value
						},
						renderLabel(value),
						_react2['default'].createElement(
							'span',
							{ className: 'Select-aria-only' },
							' '
						)
					);
				});
			}
		} else if (!this.state.inputValue) {
			if (isOpen) onClick = null;
			return _react2['default'].createElement(
				ValueComponent,
				{
					id: this._instancePrefix + '-value-item',
					disabled: this.props.disabled,
					instancePrefix: this._instancePrefix,
					onClick: onClick,
					value: valueArray[0]
				},
				renderLabel(valueArray[0])
			);
		}
	},

	renderInput: function renderInput(valueArray, focusedOptionIndex) {
		if (this.props.inputRenderer) {
			return this.props.inputRenderer();
		} else {
			var _classNames;

			var className = (0, _classnames2['default'])('Select-input', this.props.inputProps.className);
			var isOpen = !!this.state.isOpen;

			var ariaOwns = (0, _classnames2['default'])((_classNames = {}, _defineProperty(_classNames, this._instancePrefix + '-list', isOpen), _defineProperty(_classNames, this._instancePrefix + '-backspace-remove-message', this.props.multi && !this.props.disabled && this.state.isFocused && !this.state.inputValue), _classNames));

			// TODO: Check how this project includes Object.assign()
			var inputProps = _extends({}, this.props.inputProps, {
				role: 'combobox',
				'aria-expanded': '' + isOpen,
				'aria-owns': ariaOwns,
				'aria-haspopup': '' + isOpen,
				'aria-activedescendant': isOpen ? this._instancePrefix + '-option-' + focusedOptionIndex : this._instancePrefix + '-value',
				'aria-labelledby': this.props['aria-labelledby'],
				'aria-label': this.props['aria-label'],
				className: className,
				tabIndex: this.props.tabIndex,
				onBlur: this.handleInputBlur,
				onChange: this.handleInputChange,
				onFocus: this.handleInputFocus,
				ref: 'input',
				required: this.state.required,
				value: this.state.inputValue
			});

			if (this.props.disabled || !this.props.searchable) {
				var divProps = (0, _blacklist2['default'])(this.props.inputProps, 'inputClassName');
				return _react2['default'].createElement('div', _extends({}, divProps, {
					role: 'combobox',
					'aria-expanded': isOpen,
					'aria-owns': isOpen ? this._instancePrefix + '-list' : this._instancePrefix + '-value',
					'aria-activedescendant': isOpen ? this._instancePrefix + '-option-' + focusedOptionIndex : this._instancePrefix + '-value',
					className: className,
					tabIndex: this.props.tabIndex || 0,
					onBlur: this.handleInputBlur,
					onFocus: this.handleInputFocus,
					ref: 'input',
					'aria-readonly': '' + !!this.props.disabled,
					style: { border: 0, width: 0, marginLeft: 0, display: 'inline-block' } }));
			}

			if (this.props.autosize) {
				return _react2['default'].createElement(_reactInputAutosize2['default'], _extends({}, inputProps, { minWidth: '5px' }));
			}
			return _react2['default'].createElement(
				'div',
				{ className: className },
				_react2['default'].createElement('input', inputProps)
			);
		}
	},

	renderClear: function renderClear() {
		if (!this.props.clearable || !this.props.value || this.props.multi && !this.props.value.length || this.props.disabled || this.props.isLoading) return;
		return _react2['default'].createElement(
			'span',
			{ className: 'Select-clear-zone', title: this.props.multi ? this.props.clearAllText : this.props.clearValueText,
				'aria-label': this.props.multi ? this.props.clearAllText : this.props.clearValueText,
				onMouseDown: this.clearValue,
				onTouchStart: this.handleTouchStart,
				onTouchMove: this.handleTouchMove,
				onTouchEnd: this.handleTouchEndClearValue
			},
			_react2['default'].createElement('span', { className: 'Select-clear', dangerouslySetInnerHTML: { __html: '&times;' } })
		);
	},

	renderArrow: function renderArrow() {
		return _react2['default'].createElement(
			'span',
			{ className: 'Select-arrow-zone', onMouseDown: this.handleMouseDownOnArrow },
			_react2['default'].createElement('span', { className: 'Select-arrow', onMouseDown: this.handleMouseDownOnArrow })
		);
	},

	filterOptions: function filterOptions(options, excludeOptions) {
		var _this5 = this;

		var excludeOptionValues = null;
		var filterValue = this.state.inputValue;
		if (typeof this.props.filterOptions === 'function') {
			return this.props.filterOptions.call(this, options, filterValue, excludeOptions);
		} else if (this.props.filterOptions) {
			var _ret = (function () {
				if (_this5.props.ignoreAccents) {
					filterValue = (0, _utilsStripDiacritics2['default'])(filterValue);
				}
				if (_this5.props.ignoreCase) {
					filterValue = filterValue.toLowerCase();
				}
				if (excludeOptions) excludeOptionValues = excludeOptions.map(function (i) {
					return i[_this5.props.valueKey];
				});
				var includeOption = function includeOption(option) {
					if (excludeOptionValues && excludeOptionValues.indexOf(option[_this5.props.valueKey]) > -1) return false;
					if (_this5.props.filterOption) return _this5.props.filterOption.call(_this5, option, filterValue);
					if (!filterValue) return true;
					var valueTest = String(option[_this5.props.valueKey]);
					var labelTest = String(option[_this5.props.labelKey]);
					if (_this5.props.ignoreAccents) {
						if (_this5.props.matchProp !== 'label') valueTest = (0, _utilsStripDiacritics2['default'])(valueTest);
						if (_this5.props.matchProp !== 'value') labelTest = (0, _utilsStripDiacritics2['default'])(labelTest);
					}
					if (_this5.props.ignoreCase) {
						if (_this5.props.matchProp !== 'label') valueTest = valueTest.toLowerCase();
						if (_this5.props.matchProp !== 'value') labelTest = labelTest.toLowerCase();
					}
					return _this5.props.matchPos === 'start' ? _this5.props.matchProp !== 'label' && valueTest.substr(0, filterValue.length) === filterValue || _this5.props.matchProp !== 'value' && labelTest.substr(0, filterValue.length) === filterValue : _this5.props.matchProp !== 'label' && valueTest.indexOf(filterValue) >= 0 || _this5.props.matchProp !== 'value' && labelTest.indexOf(filterValue) >= 0;
				};
				var filteredOptions = [];
				options.forEach(function (option) {
					if (_this5.isGroup(option)) {
						var filteredGroup = clone(option);
						filteredGroup.options = _this5.filterOptions(option.options, excludeOptions);
						if (filteredGroup.options.length) {
							filteredOptions.push(filteredGroup);
						};
					} else if (includeOption(option)) {
						filteredOptions.push(option);
					};
				});
				return {
					v: filteredOptions
				};
			})();

			if (typeof _ret === 'object') return _ret.v;
		} else {
			return options;
		}
	},

	isGroup: function isGroup(option) {
		return option && Array.isArray(option.options);
	},

	flattenOptions: function flattenOptions(options) {
		if (!options) return;
		var flatOptions = [];
		for (var i = 0; i < options.length; i++) {
			if (this.isGroup(options[i])) {
				flatOptions = flatOptions.concat(this.flattenOptions(options[i].options));
			} else {
				flatOptions.push(options[i]);
			}
		}
		return flatOptions;
	},

	renderMenu: function renderMenu(options, valueArray, focusedOption) {
		var _this6 = this;

		if (options && options.length) {
			if (this.props.menuRenderer) {
				return this.props.menuRenderer({
					focusedOption: focusedOption,
					focusOption: this.focusOption,
					labelKey: this.props.labelKey,
					options: options,
					selectValue: this.selectValue,
					valueArray: valueArray
				});
			} else {
				var _ret2 = (function () {
					var OptionGroup = _this6.props.optionGroupComponent;
					var Option = _this6.props.optionComponent;
					var renderLabel = _this6.props.optionRenderer || _this6.getOptionLabel;

					return {
						v: options.map(function (option, i) {
							if (_this6.isGroup(option)) {
								var optionGroupClass = (0, _classnames2['default'])({
									'Select-option-group': true
								});

								return _react2['default'].createElement(
									OptionGroup,
									{
										className: optionGroupClass,
										key: 'option-group-' + i,
										label: renderLabel(option),
										option: option
									},
									_this6.renderMenu(option.options, valueArray, focusedOption)
								);
							} else {
								var isSelected = valueArray && valueArray.indexOf(option) > -1;
								var isFocused = option === focusedOption;
								var optionRef = isFocused ? 'focused' : null;
								var optionClass = (0, _classnames2['default'])(_this6.props.optionClassName, {
									'Select-option': true,
									'is-selected': isSelected,
									'is-focused': isFocused,
									'is-disabled': option.disabled
								});

								return _react2['default'].createElement(
									Option,
									{
										instancePrefix: _this6._instancePrefix,
										optionIndex: i,
										className: optionClass,
										isDisabled: option.disabled,
										isFocused: isFocused,
										key: 'option-' + i + '-' + option[_this6.props.valueKey],
										onSelect: _this6.selectValue,
										onFocus: _this6.focusOption,
										option: option,
										isSelected: isSelected,
										ref: optionRef,
										showCheckedIcon: _this6.props.multi && !_this6.props.removeOptions
									},
									renderLabel(option)
								);
							}
						})
					};
				})();

				if (typeof _ret2 === 'object') return _ret2.v;
			}
		} else if (this.props.noResultsText) {
			return _react2['default'].createElement(
				'div',
				{ className: 'Select-noresults' },
				this.props.noResultsText
			);
		} else {
			return null;
		}
	},

	renderHiddenField: function renderHiddenField(valueArray) {
		var _this7 = this;

		if (!this.props.name) return;
		if (this.props.joinValues) {
			var value = valueArray.map(function (i) {
				return stringifyValue(i[_this7.props.valueKey]);
			}).join(this.props.delimiter);
			return _react2['default'].createElement('input', {
				type: 'hidden',
				ref: 'value',
				name: this.props.name,
				value: value,
				disabled: this.props.disabled });
		}
		return valueArray.map(function (item, index) {
			return _react2['default'].createElement('input', { key: 'hidden.' + index,
				type: 'hidden',
				ref: 'value' + index,
				name: _this7.props.name,
				value: stringifyValue(item[_this7.props.valueKey]),
				disabled: _this7.props.disabled });
		});
	},

	getFocusableOptionIndex: function getFocusableOptionIndex(selectedOption) {
		var options = this._visibleOptions;
		if (!options.length) return null;

		var focusedOption = this.state.focusedOption || selectedOption;
		if (focusedOption && !focusedOption.disabled) {
			var focusedOptionIndex = options.indexOf(focusedOption);
			if (focusedOptionIndex !== -1) {
				return focusedOptionIndex;
			}
		}

		for (var i = 0; i < options.length; i++) {
			if (!options[i].disabled) return i;
		}
		return null;
	},

	renderOuter: function renderOuter(options, valueArray, focusedOption) {
		var Dropdown = this.props.dropdownComponent;
		var menu = this.renderMenu(options, valueArray, focusedOption);
		if (!menu) {
			return null;
		}

		return _react2['default'].createElement(
			Dropdown,
			null,
			_react2['default'].createElement(
				'div',
				{ ref: 'menuContainer', className: 'Select-menu-outer bal', style: this.props.menuContainerStyle },
				_react2['default'].createElement(
					'div',
					{ ref: 'menu', role: 'listbox', className: 'Select-menu', id: this._instancePrefix + '-list',
						style: this.props.menuStyle,
						onScroll: this.handleMenuScroll,
						onMouseDown: this.handleMouseDownOnMenu },
					menu
				)
			)
		);
	},

	render: function render() {
		var valueArray = this.getValueArray(this.props.value);
		var excludeOptions = this.props.multi ? valueArray : null;
		if (this.props.multi && !this.props.removeOptions) {
			excludeOptions = null;
		}
		var options = this.filterOptions(this.props.options || [], excludeOptions);
		this._visibleOptions = this.flattenOptions(options);
		var isOpen = typeof this.props.isOpen === 'boolean' ? this.props.isOpen : this.state.isOpen;
		if (this.props.multi && !options.length && valueArray.length && !this.state.inputValue) isOpen = false;
		var focusedOptionIndex = this.getFocusableOptionIndex(valueArray[0]);

		var focusedOption = null;
		if (focusedOptionIndex !== null) {
			focusedOption = this._focusedOption = this._visibleOptions[focusedOptionIndex];
		} else {
			focusedOption = this._focusedOption = null;
		}
		var className = (0, _classnames2['default'])('Select', this.props.className, {
			'Select--multi': this.props.multi,
			'Select--multiText': this.props.multiText,
			'Select--single': !this.props.multi,
			'is-disabled': this.props.disabled,
			'is-focused': this.state.isFocused,
			'is-loading': this.props.isLoading,
			'is-open': isOpen,
			'is-pseudo-focused': this.state.isPseudoFocused,
			'is-searchable': this.props.searchable,
			'has-value': valueArray.length
		});

		var removeMessage = null;
		var outerValueArray = !this.props.multi ? valueArray : null;
		if (this.props.multi && !this.props.removeOptions) {
			outerValueArray = valueArray;
		}
		if (this.props.multi && !this.props.disabled && valueArray.length && !this.state.inputValue && this.state.isFocused && this.props.backspaceRemoves) {
			removeMessage = _react2['default'].createElement(
				'span',
				{ id: this._instancePrefix + '-backspace-remove-message', className: 'Select-aria-only', 'aria-live': 'assertive' },
				this.props.backspaceToRemoveMessage.replace('{label}', valueArray[valueArray.length - 1][this.props.labelKey])
			);
		}

		return _react2['default'].createElement(
			'div',
			{ ref: 'wrapper',
				className: className,
				style: this.props.wrapperStyle },
			this.renderHiddenField(valueArray),
			_react2['default'].createElement(
				'div',
				{ ref: 'control',
					className: 'Select-control',
					style: this.props.style,
					onKeyDown: this.handleKeyDown,
					onMouseDown: this.handleMouseDown,
					onTouchEnd: this.handleTouchEnd,
					onTouchStart: this.handleTouchStart,
					onTouchMove: this.handleTouchMove
				},
				_react2['default'].createElement(
					'span',
					{ className: 'Select-multi-value-wrapper', id: this._instancePrefix + '-value' },
					this.renderValue(valueArray, isOpen),
					this.renderInput(valueArray, focusedOptionIndex)
				),
				removeMessage,
				this.renderLoading(),
				this.renderClear(),
				this.renderArrow()
			),
			isOpen ? this.renderOuter(options, outerValueArray, focusedOption) : null
		);
	}

});

exports['default'] = Select;
module.exports = exports['default'];

},{"./Async":2,"./Dropdown":3,"./Option":4,"./OptionGroup":5,"./Value":6,"./utils/stripDiacritics":7,"blacklist":1,"classnames":undefined,"react":undefined,"react-dom":undefined,"react-input-autosize":undefined}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmxhY2tsaXN0L2luZGV4LmpzIiwiRDovUHJvamVrdGUvQnJhbmRzbGlzdGVuL3JlYWN0LXNlbGVjdC9zcmMvQXN5bmMuanMiLCJEOi9Qcm9qZWt0ZS9CcmFuZHNsaXN0ZW4vcmVhY3Qtc2VsZWN0L3NyYy9Ecm9wZG93bi5qcyIsIkQ6L1Byb2pla3RlL0JyYW5kc2xpc3Rlbi9yZWFjdC1zZWxlY3Qvc3JjL09wdGlvbi5qcyIsIkQ6L1Byb2pla3RlL0JyYW5kc2xpc3Rlbi9yZWFjdC1zZWxlY3Qvc3JjL09wdGlvbkdyb3VwLmpzIiwiRDovUHJvamVrdGUvQnJhbmRzbGlzdGVuL3JlYWN0LXNlbGVjdC9zcmMvVmFsdWUuanMiLCJEOi9Qcm9qZWt0ZS9CcmFuZHNsaXN0ZW4vcmVhY3Qtc2VsZWN0L3NyYy91dGlscy9zdHJpcERpYWNyaXRpY3MuanMiLCJEOi9Qcm9qZWt0ZS9CcmFuZHNsaXN0ZW4vcmVhY3Qtc2VsZWN0L3NyYy9TZWxlY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7O3FCQ3BCa0IsT0FBTzs7OztzQkFFTixVQUFVOzs7O29DQUNELHlCQUF5Qjs7OztBQUVyRCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7O0FBRWxCLFNBQVMsU0FBUyxDQUFFLEtBQUssRUFBRTtBQUMxQixLQUFJLEtBQUssSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7QUFDdkMsT0FBSyxHQUFHLEVBQUUsQ0FBQztFQUNYO0FBQ0QsUUFBTyxLQUFLLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQztDQUM1Qjs7QUFFRCxTQUFTLFdBQVcsQ0FBRSxLQUFLLEVBQUUs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QUNsQzs7TUFBSyxHQUFHLEVBQUMsU0FBUztBQUNuQixjQUFTLEVBQUMsZ0JBQWdCO0FBQzFCLFVBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQUFBQztBQUN4QixjQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQUFBQztBQUM5QixnQkFBVyxFQUFFLElBQUksQ0FBQyxlQUFlLEFBQUM7QUFDbEMsZUFBVSxFQUFFLElBQUksQ0FBQyxjQUFjLEFBQUM7QUFDaEMsaUJBQVksRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEFBQUM7QUFDcEMsZ0JBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxBQUFDOztJQUVqQzs7T0FBTSxTQUFTLEVBQUMsNEJBQTRCLEVBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxlQUFlLEdBQUcsUUFBUSxBQUFDO0tBQ2pGLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQztLQUNwQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQztLQUN6QztJQUNQLGFBQWE7SUFDYixJQUFJLENBQUMsYUFBYSxFQUFFO0lBQ3BCLElBQUksQ0FBQyxXQUFXLEVBQUU7SUFDbEIsSUFBSSxDQUFDLFdBQVcsRUFBRTtJQUNaO0dBQ04sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxhQUFhLENBQUMsR0FBRyxJQUFJO0dBQ25FLENBQ0o7RUFDRDs7Q0FFRixDQUFDLENBQUM7O3FCQUVZLE1BQU0iLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBibGFja2xpc3QgKHNyYykge1xuICB2YXIgY29weSA9IHt9XG4gIHZhciBmaWx0ZXIgPSBhcmd1bWVudHNbMV1cblxuICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ3N0cmluZycpIHtcbiAgICBmaWx0ZXIgPSB7fVxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmaWx0ZXJbYXJndW1lbnRzW2ldXSA9IHRydWVcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgLy8gYmxhY2tsaXN0P1xuICAgIGlmIChmaWx0ZXJba2V5XSkgY29udGludWVcblxuICAgIGNvcHlba2V5XSA9IHNyY1trZXldXG4gIH1cblxuICByZXR1cm4gY29weVxufVxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmltcG9ydCBTZWxlY3QgZnJvbSAnLi9TZWxlY3QnO1xyXG5pbXBvcnQgc3RyaXBEaWFjcml0aWNzIGZyb20gJy4vdXRpbHMvc3RyaXBEaWFjcml0aWNzJztcclxuXHJcbmxldCByZXF1ZXN0SWQgPSAwO1xyXG5cclxuZnVuY3Rpb24gaW5pdENhY2hlIChjYWNoZSkge1xyXG5cdGlmIChjYWNoZSAmJiB0eXBlb2YgY2FjaGUgIT09ICdvYmplY3QnKSB7XHJcblx0XHRjYWNoZSA9IHt9O1xyXG5cdH1cclxuXHRyZXR1cm4gY2FjaGUgPyBjYWNoZSA6IG51bGw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZUNhY2hlIChjYWNoZSwgaW5wdXQsIGRhdGEpIHtcclxuXHRpZiAoIWNhY2hlKSByZXR1cm47XHJcblx0Y2FjaGVbaW5wdXRdID0gZGF0YTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0RnJvbUNhY2hlIChjYWNoZSwgaW5wdXQpIHtcclxuXHRpZiAoIWNhY2hlKSByZXR1cm47XHJcblx0Zm9yIChsZXQgaSA9IGlucHV0Lmxlbmd0aDsgaSA+PSAwOyAtLWkpIHtcclxuXHRcdGxldCBjYWNoZUtleSA9IGlucHV0LnNsaWNlKDAsIGkpO1xyXG5cdFx0aWYgKGNhY2hlW2NhY2hlS2V5XSAmJiAoaW5wdXQgPT09IGNhY2hlS2V5IHx8IGNhY2hlW2NhY2hlS2V5XS5jb21wbGV0ZSkpIHtcclxuXHRcdFx0cmV0dXJuIGNhY2hlW2NhY2hlS2V5XTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRoZW5Qcm9taXNlIChwcm9taXNlLCBjYWxsYmFjaykge1xyXG5cdGlmICghcHJvbWlzZSB8fCB0eXBlb2YgcHJvbWlzZS50aGVuICE9PSAnZnVuY3Rpb24nKSByZXR1cm47XHJcblx0cmV0dXJuIHByb21pc2UudGhlbigoZGF0YSkgPT4ge1xyXG5cdFx0Y2FsbGJhY2sobnVsbCwgZGF0YSk7XHJcblx0fSwgKGVycikgPT4ge1xyXG5cdFx0Y2FsbGJhY2soZXJyKTtcclxuXHR9KTtcclxufVxyXG5cclxuY29uc3Qgc3RyaW5nT3JOb2RlID0gUmVhY3QuUHJvcFR5cGVzLm9uZU9mVHlwZShbXHJcblx0UmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcclxuXHRSZWFjdC5Qcm9wVHlwZXMubm9kZVxyXG5dKTtcclxuXHJcbmNvbnN0IEFzeW5jID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG5cdHByb3BUeXBlczoge1xyXG5cdFx0Y2FjaGU6IFJlYWN0LlByb3BUeXBlcy5hbnksICAgICAgICAgICAgICAgICAgICAgLy8gb2JqZWN0IHRvIHVzZSB0byBjYWNoZSByZXN1bHRzLCBjYW4gYmUgbnVsbCB0byBkaXNhYmxlIGNhY2hlXHJcblx0XHRpZ25vcmVBY2NlbnRzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgICAvLyB3aGV0aGVyIHRvIHN0cmlwIGRpYWNyaXRpY3Mgd2hlbiBmaWx0ZXJpbmcgKHNoYXJlZCB3aXRoIFNlbGVjdClcclxuXHRcdGlnbm9yZUNhc2U6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgICAgIC8vIHdoZXRoZXIgdG8gcGVyZm9ybSBjYXNlLWluc2Vuc2l0aXZlIGZpbHRlcmluZyAoc2hhcmVkIHdpdGggU2VsZWN0KVxyXG5cdFx0aXNMb2FkaW5nOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGVzIHRoZSBpc0xvYWRpbmcgc3RhdGUgd2hlbiBzZXQgdG8gdHJ1ZVxyXG5cdFx0bG9hZE9wdGlvbnM6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsICAgLy8gZnVuY3Rpb24gdG8gY2FsbCB0byBsb2FkIG9wdGlvbnMgYXN5bmNocm9ub3VzbHlcclxuXHRcdGxvYWRpbmdQbGFjZWhvbGRlcjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZywgICAgIC8vIHJlcGxhY2VzIHRoZSBwbGFjZWhvbGRlciB3aGlsZSBvcHRpb25zIGFyZSBsb2FkaW5nXHJcblx0XHRtaW5pbXVtSW5wdXQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsICAgICAgICAgICAvLyB0aGUgbWluaW11bSBudW1iZXIgb2YgY2hhcmFjdGVycyB0aGF0IHRyaWdnZXIgbG9hZE9wdGlvbnNcclxuXHRcdG5vUmVzdWx0c1RleHQ6IHN0cmluZ09yTm9kZSwgICAgICAgICAgICAgICAgICAgIC8vIHBsYWNlaG9sZGVyIGRpc3BsYXllZCB3aGVuIHRoZXJlIGFyZSBubyBtYXRjaGluZyBzZWFyY2ggcmVzdWx0cyAoc2hhcmVkIHdpdGggU2VsZWN0KVxyXG5cdFx0b25JbnB1dENoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAgLy8gb25JbnB1dENoYW5nZSBoYW5kbGVyOiBmdW5jdGlvbiAoaW5wdXRWYWx1ZSkge31cclxuXHRcdHBsYWNlaG9sZGVyOiBzdHJpbmdPck5vZGUsICAgICAgICAgICAgICAgICAgICAgIC8vIGZpZWxkIHBsYWNlaG9sZGVyLCBkaXNwbGF5ZWQgd2hlbiB0aGVyZSdzIG5vIHZhbHVlIChzaGFyZWQgd2l0aCBTZWxlY3QpXHJcblx0XHRzZWFyY2hQcm9tcHRUZXh0OiBzdHJpbmdPck5vZGUsICAgICAgIC8vIGxhYmVsIHRvIHByb21wdCBmb3Igc2VhcmNoIGlucHV0XHJcblx0XHRzZWFyY2hpbmdUZXh0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAgICAgICAvLyBtZXNzYWdlIHRvIGRpc3BsYXkgd2hpbGUgb3B0aW9ucyBhcmUgbG9hZGluZ1xyXG5cdH0sXHJcblx0Z2V0RGVmYXVsdFByb3BzICgpIHtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGNhY2hlOiB0cnVlLFxyXG5cdFx0XHRpZ25vcmVBY2NlbnRzOiB0cnVlLFxyXG5cdFx0XHRpZ25vcmVDYXNlOiB0cnVlLFxyXG5cdFx0XHRsb2FkaW5nUGxhY2Vob2xkZXI6ICdMb2FkaW5nLi4uJyxcclxuXHRcdFx0bWluaW11bUlucHV0OiAwLFxyXG5cdFx0XHRzZWFyY2hpbmdUZXh0OiAnU2VhcmNoaW5nLi4uJyxcclxuXHRcdFx0c2VhcmNoUHJvbXB0VGV4dDogJ1R5cGUgdG8gc2VhcmNoJyxcclxuXHRcdH07XHJcblx0fSxcclxuXHRnZXRJbml0aWFsU3RhdGUgKCkge1xyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Y2FjaGU6IGluaXRDYWNoZSh0aGlzLnByb3BzLmNhY2hlKSxcclxuXHRcdFx0aXNMb2FkaW5nOiBmYWxzZSxcclxuXHRcdFx0b3B0aW9uczogW10sXHJcblx0XHR9O1xyXG5cdH0sXHJcblx0Y29tcG9uZW50V2lsbE1vdW50ICgpIHtcclxuXHRcdHRoaXMuX2xhc3RJbnB1dCA9ICcnO1xyXG5cdH0sXHJcblx0Y29tcG9uZW50RGlkTW91bnQgKCkge1xyXG5cdFx0dGhpcy5sb2FkT3B0aW9ucygnJyk7XHJcblx0fSxcclxuXHRjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIChuZXh0UHJvcHMpIHtcclxuXHRcdGlmIChuZXh0UHJvcHMuY2FjaGUgIT09IHRoaXMucHJvcHMuY2FjaGUpIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0Y2FjaGU6IGluaXRDYWNoZShuZXh0UHJvcHMuY2FjaGUpLFxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9LFxyXG5cdGZvY3VzICgpIHtcclxuXHRcdHRoaXMucmVmcy5zZWxlY3QuZm9jdXMoKTtcclxuXHR9LFxyXG5cdHJlc2V0U3RhdGUgKCkge1xyXG5cdFx0dGhpcy5fY3VycmVudFJlcXVlc3RJZCA9IC0xO1xyXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdGlzTG9hZGluZzogZmFsc2UsXHJcblx0XHRcdG9wdGlvbnM6IFtdLFxyXG5cdFx0fSk7XHJcblx0fSxcclxuXHRnZXRSZXNwb25zZUhhbmRsZXIgKGlucHV0KSB7XHJcblx0XHRsZXQgX3JlcXVlc3RJZCA9IHRoaXMuX2N1cnJlbnRSZXF1ZXN0SWQgPSByZXF1ZXN0SWQrKztcclxuXHRcdHJldHVybiAoZXJyLCBkYXRhKSA9PiB7XHJcblx0XHRcdGlmIChlcnIpIHRocm93IGVycjtcclxuXHRcdFx0aWYgKCF0aGlzLmlzTW91bnRlZCgpKSByZXR1cm47XHJcblx0XHRcdHVwZGF0ZUNhY2hlKHRoaXMuc3RhdGUuY2FjaGUsIGlucHV0LCBkYXRhKTtcclxuXHRcdFx0aWYgKF9yZXF1ZXN0SWQgIT09IHRoaXMuX2N1cnJlbnRSZXF1ZXN0SWQpIHJldHVybjtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0aXNMb2FkaW5nOiBmYWxzZSxcclxuXHRcdFx0XHRvcHRpb25zOiBkYXRhICYmIGRhdGEub3B0aW9ucyB8fCBbXSxcclxuXHRcdFx0fSk7XHJcblx0XHR9O1xyXG5cdH0sXHJcblx0bG9hZE9wdGlvbnMgKGlucHV0KSB7XHJcblx0XHRpZiAodGhpcy5wcm9wcy5vbklucHV0Q2hhbmdlKSB7XHJcblx0XHRcdGxldCBuZXh0U3RhdGUgPSB0aGlzLnByb3BzLm9uSW5wdXRDaGFuZ2UoaW5wdXQpO1xyXG5cdFx0XHQvLyBOb3RlOiAhPSB1c2VkIGRlbGliZXJhdGVseSBoZXJlIHRvIGNhdGNoIHVuZGVmaW5lZCBhbmQgbnVsbFxyXG5cdFx0XHRpZiAobmV4dFN0YXRlICE9IG51bGwpIHtcclxuXHRcdFx0XHRpbnB1dCA9ICcnICsgbmV4dFN0YXRlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAodGhpcy5wcm9wcy5pZ25vcmVBY2NlbnRzKSBpbnB1dCA9IHN0cmlwRGlhY3JpdGljcyhpbnB1dCk7XHJcblx0XHRpZiAodGhpcy5wcm9wcy5pZ25vcmVDYXNlKSBpbnB1dCA9IGlucHV0LnRvTG93ZXJDYXNlKCk7XHJcblxyXG5cdFx0dGhpcy5fbGFzdElucHV0ID0gaW5wdXQ7XHJcblx0XHRpZiAoaW5wdXQubGVuZ3RoIDwgdGhpcy5wcm9wcy5taW5pbXVtSW5wdXQpIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucmVzZXRTdGF0ZSgpO1xyXG5cdFx0fVxyXG5cdFx0bGV0IGNhY2hlUmVzdWx0ID0gZ2V0RnJvbUNhY2hlKHRoaXMuc3RhdGUuY2FjaGUsIGlucHV0KTtcclxuXHRcdGlmIChjYWNoZVJlc3VsdCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5zZXRTdGF0ZSh7XHJcblx0XHRcdFx0b3B0aW9uczogY2FjaGVSZXN1bHQub3B0aW9ucyxcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHR0aGlzLnNldFN0YXRlKHtcclxuXHRcdFx0aXNMb2FkaW5nOiB0cnVlLFxyXG5cdFx0fSk7XHJcblx0XHRsZXQgcmVzcG9uc2VIYW5kbGVyID0gdGhpcy5nZXRSZXNwb25zZUhhbmRsZXIoaW5wdXQpO1xyXG5cdFx0bGV0IGlucHV0UHJvbWlzZSA9IHRoZW5Qcm9taXNlKHRoaXMucHJvcHMubG9hZE9wdGlvbnMoaW5wdXQsIHJlc3BvbnNlSGFuZGxlciksIHJlc3BvbnNlSGFuZGxlcik7XHJcblx0XHRyZXR1cm4gaW5wdXRQcm9taXNlID8gaW5wdXRQcm9taXNlLnRoZW4oKCkgPT4ge1xyXG5cdFx0XHRyZXR1cm4gaW5wdXQ7XHJcblx0XHR9KSA6IGlucHV0O1xyXG5cdH0sXHJcblx0cmVuZGVyICgpIHtcclxuXHRcdGxldCB7IG5vUmVzdWx0c1RleHQgfSA9IHRoaXMucHJvcHM7XHJcblx0XHRsZXQgeyBpc0xvYWRpbmcsIG9wdGlvbnMgfSA9IHRoaXMuc3RhdGU7XHJcblx0XHRpZiAodGhpcy5wcm9wcy5pc0xvYWRpbmcpIGlzTG9hZGluZyA9IHRydWU7XHJcblx0XHRsZXQgcGxhY2Vob2xkZXIgPSBpc0xvYWRpbmcgPyB0aGlzLnByb3BzLmxvYWRpbmdQbGFjZWhvbGRlciA6IHRoaXMucHJvcHMucGxhY2Vob2xkZXI7XHJcblx0XHRpZiAoaXNMb2FkaW5nKSB7XHJcblx0XHRcdG5vUmVzdWx0c1RleHQgPSB0aGlzLnByb3BzLnNlYXJjaGluZ1RleHQ7XHJcblx0XHR9IGVsc2UgaWYgKCFvcHRpb25zLmxlbmd0aCAmJiB0aGlzLl9sYXN0SW5wdXQubGVuZ3RoIDwgdGhpcy5wcm9wcy5taW5pbXVtSW5wdXQpIHtcclxuXHRcdFx0bm9SZXN1bHRzVGV4dCA9IHRoaXMucHJvcHMuc2VhcmNoUHJvbXB0VGV4dDtcclxuXHRcdH1cclxuXHRcdHJldHVybiAoXHJcblx0XHRcdDxTZWxlY3RcclxuXHRcdFx0XHR7Li4udGhpcy5wcm9wc31cclxuXHRcdFx0XHRyZWY9XCJzZWxlY3RcIlxyXG5cdFx0XHRcdGlzTG9hZGluZz17aXNMb2FkaW5nfVxyXG5cdFx0XHRcdG5vUmVzdWx0c1RleHQ9e25vUmVzdWx0c1RleHR9XHJcblx0XHRcdFx0b25JbnB1dENoYW5nZT17dGhpcy5sb2FkT3B0aW9uc31cclxuXHRcdFx0XHRvcHRpb25zPXtvcHRpb25zfVxyXG5cdFx0XHRcdHBsYWNlaG9sZGVyPXtwbGFjZWhvbGRlcn1cclxuXHRcdFx0XHQvPlxyXG5cdFx0KTtcclxuXHR9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBc3luYztcclxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmNvbnN0IERyb3Bkb3duID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gIHByb3BUeXBlczoge1xyXG4gICAgY2hpbGRyZW46IFJlYWN0LlByb3BUeXBlcy5ub2RlLFxyXG4gIH0sXHJcbiAgcmVuZGVyICgpIHtcclxuICAgIC8vIFRoaXMgY29tcG9uZW50IGFkZHMgbm8gbWFya3VwXHJcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5jaGlsZHJlbjtcclxuICB9XHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bjtcclxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuXG5jb25zdCBPcHRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuXHRjaGlsZHJlbjogUmVhY3QuUHJvcFR5cGVzLm5vZGUsXG5cdGNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZywgICAgICAgICAgICAgLy8gY2xhc3NOYW1lIChiYXNlZCBvbiBtb3VzZSBwb3NpdGlvbilcblx0aW5zdGFuY2VQcmVmaXg6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCwgIC8vIHVuaXF1ZSBwcmVmaXggZm9yIHRoZSBpZHMgKHVzZWQgZm9yIGFyaWEpXG5cdGlzRGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgICAgLy8gdGhlIG9wdGlvbiBpcyBkaXNhYmxlZFxuXHRpc0ZvY3VzZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgICAgIC8vIHRoZSBvcHRpb24gaXMgZm9jdXNlZFxuXHRpc1NlbGVjdGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgICAgIC8vIHRoZSBvcHRpb24gaXMgc2VsZWN0ZWRcblx0b25Gb2N1czogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAgICAgICAvLyBtZXRob2QgdG8gaGFuZGxlIG1vdXNlRW50ZXIgb24gb3B0aW9uIGVsZW1lbnRcblx0b25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAgICAgICAgICAvLyBtZXRob2QgdG8gaGFuZGxlIGNsaWNrIG9uIG9wdGlvbiBlbGVtZW50XG5cdG9uVW5mb2N1czogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAgICAgLy8gbWV0aG9kIHRvIGhhbmRsZSBtb3VzZUxlYXZlIG9uIG9wdGlvbiBlbGVtZW50XG5cdG9wdGlvbjogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLCAgICAgLy8gb2JqZWN0IHRoYXQgaXMgYmFzZSBmb3IgdGhhdCBvcHRpb25cblx0b3B0aW9uSW5kZXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsICAgICAgICAgICAvLyBpbmRleCBvZiB0aGUgb3B0aW9uLCB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBpZHMgZm9yIGFyaWFcblx0c2hvd0NoZWNrZWRJY29uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCAgICAgICAgICAvLyBzaG93L2hpZGUgY2hlY2hlZCBpY29uICh1c2VkIGZvciBtdWx0dXBsZSBvcHRpb25zIHNlbGVjdClcbiAgfSxcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0ICBpc0NoZWNrZWQ6IHRoaXMucHJvcHMuaXNTZWxlY3RlZFxuXHR9O1xuICB9LFxuICBibG9ja0V2ZW50IChldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0aWYgKChldmVudC50YXJnZXQudGFnTmFtZSAhPT0gJ0EnKSB8fCAhKCdocmVmJyBpbiBldmVudC50YXJnZXQpKSB7XG5cdCAgcmV0dXJuO1xuXHR9XG5cdGlmIChldmVudC50YXJnZXQudGFyZ2V0KSB7XG5cdCAgd2luZG93Lm9wZW4oZXZlbnQudGFyZ2V0LmhyZWYsIGV2ZW50LnRhcmdldC50YXJnZXQpO1xuXHR9IGVsc2Uge1xuXHQgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gZXZlbnQudGFyZ2V0LmhyZWY7XG5cdH1cbiAgfSxcbiAgaGFuZGxlTW91c2VEb3duIChldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0dGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLm9wdGlvbiwgZXZlbnQpO1xuXHR0aGlzLnNldFN0YXRlKHtcblx0ICBpc0NoZWNrZWQ6ICF0aGlzLnN0YXRlLmlzQ2hlY2tlZFxuXHR9KTtcbiAgfSxcblxuICBoYW5kbGVNb3VzZUVudGVyIChldmVudCkge1xuXHR0aGlzLm9uRm9jdXMoZXZlbnQpO1xuICB9LFxuXG4gIGhhbmRsZU1vdXNlTW92ZSAoZXZlbnQpIHtcblx0dGhpcy5vbkZvY3VzKGV2ZW50KTtcbiAgfSxcblxuICBoYW5kbGVUb3VjaEVuZChldmVudCl7XG5cdC8vIENoZWNrIGlmIHRoZSB2aWV3IGlzIGJlaW5nIGRyYWdnZWQsIEluIHRoaXMgY2FzZVxuXHQvLyB3ZSBkb24ndCB3YW50IHRvIGZpcmUgdGhlIGNsaWNrIGV2ZW50IChiZWNhdXNlIHRoZSB1c2VyIG9ubHkgd2FudHMgdG8gc2Nyb2xsKVxuXHRpZih0aGlzLmRyYWdnaW5nKSByZXR1cm47XG5cblx0dGhpcy5oYW5kbGVNb3VzZURvd24oZXZlbnQpO1xuICB9LFxuXG4gIGhhbmRsZVRvdWNoTW92ZSAoZXZlbnQpIHtcblx0Ly8gU2V0IGEgZmxhZyB0aGF0IHRoZSB2aWV3IGlzIGJlaW5nIGRyYWdnZWRcblx0dGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gIH0sXG5cbiAgaGFuZGxlVG91Y2hTdGFydCAoZXZlbnQpIHtcblx0Ly8gU2V0IGEgZmxhZyB0aGF0IHRoZSB2aWV3IGlzIG5vdCBiZWluZyBkcmFnZ2VkXG5cdHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcbiAgfSxcblxuICBvbkZvY3VzIChldmVudCkge1xuXHRpZiAoIXRoaXMucHJvcHMuaXNGb2N1c2VkKSB7XG5cdCAgdGhpcy5wcm9wcy5vbkZvY3VzKHRoaXMucHJvcHMub3B0aW9uLCBldmVudCk7XG5cdH1cbiAgfSxcbiAgcmVuZGVyICgpIHtcblx0dmFyIHsgb3B0aW9uLCBpbnN0YW5jZVByZWZpeCwgb3B0aW9uSW5kZXggfSA9IHRoaXMucHJvcHM7XG5cblx0bGV0IGNsYXNzTmFtZSA9IGNsYXNzTmFtZXModGhpcy5wcm9wcy5jbGFzc05hbWUsIG9wdGlvbi5jbGFzc05hbWUsIHtcblx0ICAnaGFzLWNoZWNraWNvbic6IHRoaXMucHJvcHMuc2hvd0NoZWNrZWRJY29uICYmIHRoaXMuc3RhdGUuaXNDaGVja2VkXG5cdH0pO1xuXG5cdHJldHVybiBvcHRpb24uZGlzYWJsZWQgPyAoXG5cdFx0PGRpdiBjbGFzc05hbWU9e2NsYXNzTmFtZX1cblx0XHRcdCBvbk1vdXNlRG93bj17dGhpcy5ibG9ja0V2ZW50fVxuXHRcdFx0IG9uQ2xpY2s9e3RoaXMuYmxvY2tFdmVudH0+XG5cdFx0ICB7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHQ8L2Rpdj5cblx0KSA6IChcblx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuXHRcdFx0IHN0eWxlPXtvcHRpb24uc3R5bGV9XG5cdFx0XHQgcm9sZT1cIm9wdGlvblwiXG5cdFx0XHQgb25Nb3VzZURvd249e3RoaXMuaGFuZGxlTW91c2VEb3dufVxuXHRcdFx0IG9uTW91c2VFbnRlcj17dGhpcy5oYW5kbGVNb3VzZUVudGVyfVxuXHRcdFx0IG9uTW91c2VNb3ZlPXt0aGlzLmhhbmRsZU1vdXNlTW92ZX1cblx0XHRcdCBvblRvdWNoU3RhcnQ9e3RoaXMuaGFuZGxlVG91Y2hTdGFydH1cblx0XHRcdCBvblRvdWNoTW92ZT17dGhpcy5oYW5kbGVUb3VjaE1vdmV9XG5cdFx0XHQgb25Ub3VjaEVuZD17dGhpcy5oYW5kbGVUb3VjaEVuZH1cblx0XHRcdCBpZD17aW5zdGFuY2VQcmVmaXggKyAnLW9wdGlvbi0nICsgb3B0aW9uSW5kZXh9XG5cdFx0XHQgdGl0bGU9e29wdGlvbi50aXRsZX0+XG5cdFx0ICB7dGhpcy5wcm9wcy5jaGlsZHJlbn1cblx0XHQ8L2Rpdj5cblx0KTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gT3B0aW9uO1xuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XHJcblxyXG5jb25zdCBPcHRpb25Hcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHRwcm9wVHlwZXM6IHtcclxuXHRcdGNoaWxkcmVuOiBSZWFjdC5Qcm9wVHlwZXMuYW55LFxyXG5cdFx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAgICAgICAgICAvLyBjbGFzc05hbWUgKGJhc2VkIG9uIG1vdXNlIHBvc2l0aW9uKVxyXG5cdFx0bGFiZWw6IFJlYWN0LlByb3BUeXBlcy5ub2RlLCAgICAgICAgICAgICAgICAgICAvLyB0aGUgaGVhZGluZyB0byBzaG93IGFib3ZlIHRoZSBjaGlsZCBvcHRpb25zXHJcblx0XHRvcHRpb246IFJlYWN0LlByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCwgICAgIC8vIG9iamVjdCB0aGF0IGlzIGJhc2UgZm9yIHRoYXQgb3B0aW9uIGdyb3VwXHJcblx0fSxcclxuXHJcblx0YmxvY2tFdmVudCAoZXZlbnQpIHtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHRcdGlmICgoZXZlbnQudGFyZ2V0LnRhZ05hbWUgIT09ICdBJykgfHwgISgnaHJlZicgaW4gZXZlbnQudGFyZ2V0KSkge1xyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRpZiAoZXZlbnQudGFyZ2V0LnRhcmdldCkge1xyXG5cdFx0XHR3aW5kb3cub3BlbihldmVudC50YXJnZXQuaHJlZiwgZXZlbnQudGFyZ2V0LnRhcmdldCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR3aW5kb3cubG9jYXRpb24uaHJlZiA9IGV2ZW50LnRhcmdldC5ocmVmO1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG5cdGhhbmRsZU1vdXNlRG93biAoZXZlbnQpIHtcclxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHR9LFxyXG5cclxuXHRoYW5kbGVUb3VjaEVuZChldmVudCl7XHJcblx0XHQvLyBDaGVjayBpZiB0aGUgdmlldyBpcyBiZWluZyBkcmFnZ2VkLCBJbiB0aGlzIGNhc2VcclxuXHRcdC8vIHdlIGRvbid0IHdhbnQgdG8gZmlyZSB0aGUgY2xpY2sgZXZlbnQgKGJlY2F1c2UgdGhlIHVzZXIgb25seSB3YW50cyB0byBzY3JvbGwpXHJcblx0XHRpZih0aGlzLmRyYWdnaW5nKSByZXR1cm47XHJcblxyXG5cdFx0dGhpcy5oYW5kbGVNb3VzZURvd24oZXZlbnQpO1xyXG5cdH0sXHJcblxyXG5cdGhhbmRsZVRvdWNoTW92ZSAoZXZlbnQpIHtcclxuXHRcdC8vIFNldCBhIGZsYWcgdGhhdCB0aGUgdmlldyBpcyBiZWluZyBkcmFnZ2VkXHJcblx0XHR0aGlzLmRyYWdnaW5nID0gdHJ1ZTtcclxuXHR9LFxyXG5cclxuXHRoYW5kbGVUb3VjaFN0YXJ0IChldmVudCkge1xyXG5cdFx0Ly8gU2V0IGEgZmxhZyB0aGF0IHRoZSB2aWV3IGlzIG5vdCBiZWluZyBkcmFnZ2VkXHJcblx0XHR0aGlzLmRyYWdnaW5nID0gZmFsc2U7XHJcblx0fSxcclxuXHJcblx0cmVuZGVyICgpIHtcclxuXHRcdHZhciB7IG9wdGlvbiB9ID0gdGhpcy5wcm9wcztcclxuXHRcdHZhciBjbGFzc05hbWUgPSBjbGFzc05hbWVzKHRoaXMucHJvcHMuY2xhc3NOYW1lLCBvcHRpb24uY2xhc3NOYW1lKTtcclxuXHJcblx0XHRyZXR1cm4gb3B0aW9uLmRpc2FibGVkID8gKFxyXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxyXG5cdFx0XHRcdG9uTW91c2VEb3duPXt0aGlzLmJsb2NrRXZlbnR9XHJcblx0XHRcdFx0b25DbGljaz17dGhpcy5ibG9ja0V2ZW50fT5cclxuXHRcdFx0XHR7dGhpcy5wcm9wcy5jaGlsZHJlbn1cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpIDogKFxyXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxyXG5cdFx0XHRcdHN0eWxlPXtvcHRpb24uc3R5bGV9XHJcblx0XHRcdFx0b25Nb3VzZURvd249e3RoaXMuaGFuZGxlTW91c2VEb3dufVxyXG5cdFx0XHRcdG9uTW91c2VFbnRlcj17dGhpcy5oYW5kbGVNb3VzZUVudGVyfVxyXG5cdFx0XHRcdG9uTW91c2VNb3ZlPXt0aGlzLmhhbmRsZU1vdXNlTW92ZX1cclxuXHRcdFx0XHRvblRvdWNoU3RhcnQ9e3RoaXMuaGFuZGxlVG91Y2hTdGFydH1cclxuXHRcdFx0XHRvblRvdWNoTW92ZT17dGhpcy5oYW5kbGVUb3VjaE1vdmV9XHJcblx0XHRcdFx0b25Ub3VjaEVuZD17dGhpcy5oYW5kbGVUb3VjaEVuZH1cclxuXHRcdFx0XHR0aXRsZT17b3B0aW9uLnRpdGxlfT5cclxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIlNlbGVjdC1vcHRpb24tZ3JvdXAtbGFiZWxcIj5cclxuXHRcdFx0XHRcdHt0aGlzLnByb3BzLmxhYmVsfVxyXG5cdFx0XHRcdDwvZGl2PlxyXG5cdFx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxyXG5cdFx0XHQ8L2Rpdj5cclxuXHRcdCk7XHJcblx0fVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gT3B0aW9uR3JvdXA7XHJcbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xyXG5cclxuY29uc3QgVmFsdWUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcblxyXG5cdGRpc3BsYXlOYW1lOiAnVmFsdWUnLFxyXG5cclxuXHRwcm9wVHlwZXM6IHtcclxuXHRcdGNoaWxkcmVuOiBSZWFjdC5Qcm9wVHlwZXMubm9kZSxcclxuXHRcdGRpc2FibGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgICAgICAvLyBkaXNhYmxlZCBwcm9wIHBhc3NlZCB0byBSZWFjdFNlbGVjdFxyXG5cdFx0aWQ6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsICAgICAgICAgICAgICAgICAgIC8vIFVuaXF1ZSBpZCBmb3IgdGhlIHZhbHVlIC0gdXNlZCBmb3IgYXJpYVxyXG5cdFx0b25DbGljazogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAgICAgIC8vIG1ldGhvZCB0byBoYW5kbGUgY2xpY2sgb24gdmFsdWUgbGFiZWxcclxuXHRcdG9uUmVtb3ZlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgICAgICAgICAgICAgICAvLyBtZXRob2QgdG8gaGFuZGxlIHJlbW92YWwgb2YgdGhlIHZhbHVlXHJcblx0XHR2YWx1ZTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLCAgICAgLy8gdGhlIG9wdGlvbiBvYmplY3QgZm9yIHRoaXMgdmFsdWVcclxuXHR9LFxyXG5cclxuXHRoYW5kbGVNb3VzZURvd24gKGV2ZW50KSB7XHJcblx0XHRpZiAoZXZlbnQudHlwZSA9PT0gJ21vdXNlZG93bicgJiYgZXZlbnQuYnV0dG9uICE9PSAwKSB7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLnByb3BzLm9uQ2xpY2spIHtcclxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHRcdHRoaXMucHJvcHMub25DbGljayh0aGlzLnByb3BzLnZhbHVlLCBldmVudCk7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHRcdGlmICh0aGlzLnByb3BzLnZhbHVlLmhyZWYpIHtcclxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHR9XHJcblx0fSxcclxuXHJcblx0b25SZW1vdmUgKGV2ZW50KSB7XHJcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblx0XHR0aGlzLnByb3BzLm9uUmVtb3ZlKHRoaXMucHJvcHMudmFsdWUpO1xyXG5cdH0sXHJcblxyXG5cdGhhbmRsZVRvdWNoRW5kUmVtb3ZlIChldmVudCl7XHJcblx0XHQvLyBDaGVjayBpZiB0aGUgdmlldyBpcyBiZWluZyBkcmFnZ2VkLCBJbiB0aGlzIGNhc2VcclxuXHRcdC8vIHdlIGRvbid0IHdhbnQgdG8gZmlyZSB0aGUgY2xpY2sgZXZlbnQgKGJlY2F1c2UgdGhlIHVzZXIgb25seSB3YW50cyB0byBzY3JvbGwpXHJcblx0XHRpZih0aGlzLmRyYWdnaW5nKSByZXR1cm47XHJcblxyXG5cdFx0Ly8gRmlyZSB0aGUgbW91c2UgZXZlbnRzXHJcblx0XHR0aGlzLm9uUmVtb3ZlKGV2ZW50KTtcclxuXHR9LFxyXG5cclxuXHRoYW5kbGVUb3VjaE1vdmUgKGV2ZW50KSB7XHJcblx0XHQvLyBTZXQgYSBmbGFnIHRoYXQgdGhlIHZpZXcgaXMgYmVpbmcgZHJhZ2dlZFxyXG5cdFx0dGhpcy5kcmFnZ2luZyA9IHRydWU7XHJcblx0fSxcclxuXHJcblx0aGFuZGxlVG91Y2hTdGFydCAoZXZlbnQpIHtcclxuXHRcdC8vIFNldCBhIGZsYWcgdGhhdCB0aGUgdmlldyBpcyBub3QgYmVpbmcgZHJhZ2dlZFxyXG5cdFx0dGhpcy5kcmFnZ2luZyA9IGZhbHNlO1xyXG5cdH0sXHJcblxyXG5cdHJlbmRlclJlbW92ZUljb24gKCkge1xyXG5cdFx0aWYgKHRoaXMucHJvcHMuZGlzYWJsZWQgfHwgIXRoaXMucHJvcHMub25SZW1vdmUpIHJldHVybjtcclxuXHRcdHJldHVybiAoXHJcblx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cIlNlbGVjdC12YWx1ZS1pY29uXCJcclxuXHRcdFx0XHRhcmlhLWhpZGRlbj1cInRydWVcIlxyXG5cdFx0XHRcdG9uTW91c2VEb3duPXt0aGlzLm9uUmVtb3ZlfVxyXG5cdFx0XHRcdG9uVG91Y2hFbmQ9e3RoaXMuaGFuZGxlVG91Y2hFbmRSZW1vdmV9XHJcblx0XHRcdFx0b25Ub3VjaFN0YXJ0PXt0aGlzLmhhbmRsZVRvdWNoU3RhcnR9XHJcblx0XHRcdFx0b25Ub3VjaE1vdmU9e3RoaXMuaGFuZGxlVG91Y2hNb3ZlfT5cclxuXHRcdFx0XHQmdGltZXM7XHJcblx0XHRcdDwvc3Bhbj5cclxuXHRcdCk7XHJcblx0fSxcclxuXHJcblx0cmVuZGVyTGFiZWwgKCkge1xyXG5cdFx0bGV0IGNsYXNzTmFtZSA9ICdTZWxlY3QtdmFsdWUtbGFiZWwnO1xyXG5cdFx0cmV0dXJuIHRoaXMucHJvcHMub25DbGljayB8fCB0aGlzLnByb3BzLnZhbHVlLmhyZWYgPyAoXHJcblx0XHRcdDxhIGNsYXNzTmFtZT17Y2xhc3NOYW1lfSBocmVmPXt0aGlzLnByb3BzLnZhbHVlLmhyZWZ9IHRhcmdldD17dGhpcy5wcm9wcy52YWx1ZS50YXJnZXR9IG9uTW91c2VEb3duPXt0aGlzLmhhbmRsZU1vdXNlRG93bn0gb25Ub3VjaEVuZD17dGhpcy5oYW5kbGVNb3VzZURvd259PlxyXG5cdFx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxyXG5cdFx0XHQ8L2E+XHJcblx0XHQpIDogKFxyXG5cdFx0XHQ8c3BhbiBjbGFzc05hbWU9e2NsYXNzTmFtZX0gcm9sZT1cIm9wdGlvblwiIGFyaWEtc2VsZWN0ZWQ9XCJ0cnVlXCIgaWQ9e3RoaXMucHJvcHMuaWR9PlxyXG5cdFx0XHRcdHt0aGlzLnByb3BzLmNoaWxkcmVufVxyXG5cdFx0XHQ8L3NwYW4+XHJcblx0XHQpO1xyXG5cdH0sXHJcblxyXG5cdHJlbmRlciAoKSB7XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3NOYW1lcygnU2VsZWN0LXZhbHVlJywgdGhpcy5wcm9wcy52YWx1ZS5jbGFzc05hbWUpfVxyXG5cdFx0XHRcdHN0eWxlPXt0aGlzLnByb3BzLnZhbHVlLnN0eWxlfVxyXG5cdFx0XHRcdHRpdGxlPXt0aGlzLnByb3BzLnZhbHVlLnRpdGxlfVxyXG5cdFx0XHRcdD5cclxuXHRcdFx0XHR7dGhpcy5yZW5kZXJSZW1vdmVJY29uKCl9XHJcblx0XHRcdFx0e3RoaXMucmVuZGVyTGFiZWwoKX1cclxuXHRcdFx0PC9kaXY+XHJcblx0XHQpO1xyXG5cdH1cclxuXHJcbn0pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBWYWx1ZTtcclxuIiwidmFyIG1hcCA9IFtcclxuXHR7ICdiYXNlJzonQScsICdsZXR0ZXJzJzovW1xcdTAwNDFcXHUyNEI2XFx1RkYyMVxcdTAwQzBcXHUwMEMxXFx1MDBDMlxcdTFFQTZcXHUxRUE0XFx1MUVBQVxcdTFFQThcXHUwMEMzXFx1MDEwMFxcdTAxMDJcXHUxRUIwXFx1MUVBRVxcdTFFQjRcXHUxRUIyXFx1MDIyNlxcdTAxRTBcXHUwMEM0XFx1MDFERVxcdTFFQTJcXHUwMEM1XFx1MDFGQVxcdTAxQ0RcXHUwMjAwXFx1MDIwMlxcdTFFQTBcXHUxRUFDXFx1MUVCNlxcdTFFMDBcXHUwMTA0XFx1MDIzQVxcdTJDNkZdL2cgfSxcclxuXHR7ICdiYXNlJzonQUEnLCdsZXR0ZXJzJzovW1xcdUE3MzJdL2cgfSxcclxuXHR7ICdiYXNlJzonQUUnLCdsZXR0ZXJzJzovW1xcdTAwQzZcXHUwMUZDXFx1MDFFMl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidBTycsJ2xldHRlcnMnOi9bXFx1QTczNF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidBVScsJ2xldHRlcnMnOi9bXFx1QTczNl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidBVicsJ2xldHRlcnMnOi9bXFx1QTczOFxcdUE3M0FdL2cgfSxcclxuXHR7ICdiYXNlJzonQVknLCdsZXR0ZXJzJzovW1xcdUE3M0NdL2cgfSxcclxuXHR7ICdiYXNlJzonQicsICdsZXR0ZXJzJzovW1xcdTAwNDJcXHUyNEI3XFx1RkYyMlxcdTFFMDJcXHUxRTA0XFx1MUUwNlxcdTAyNDNcXHUwMTgyXFx1MDE4MV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidDJywgJ2xldHRlcnMnOi9bXFx1MDA0M1xcdTI0QjhcXHVGRjIzXFx1MDEwNlxcdTAxMDhcXHUwMTBBXFx1MDEwQ1xcdTAwQzdcXHUxRTA4XFx1MDE4N1xcdTAyM0JcXHVBNzNFXS9nIH0sXHJcblx0eyAnYmFzZSc6J0QnLCAnbGV0dGVycyc6L1tcXHUwMDQ0XFx1MjRCOVxcdUZGMjRcXHUxRTBBXFx1MDEwRVxcdTFFMENcXHUxRTEwXFx1MUUxMlxcdTFFMEVcXHUwMTEwXFx1MDE4QlxcdTAxOEFcXHUwMTg5XFx1QTc3OV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidEWicsJ2xldHRlcnMnOi9bXFx1MDFGMVxcdTAxQzRdL2cgfSxcclxuXHR7ICdiYXNlJzonRHonLCdsZXR0ZXJzJzovW1xcdTAxRjJcXHUwMUM1XS9nIH0sXHJcblx0eyAnYmFzZSc6J0UnLCAnbGV0dGVycyc6L1tcXHUwMDQ1XFx1MjRCQVxcdUZGMjVcXHUwMEM4XFx1MDBDOVxcdTAwQ0FcXHUxRUMwXFx1MUVCRVxcdTFFQzRcXHUxRUMyXFx1MUVCQ1xcdTAxMTJcXHUxRTE0XFx1MUUxNlxcdTAxMTRcXHUwMTE2XFx1MDBDQlxcdTFFQkFcXHUwMTFBXFx1MDIwNFxcdTAyMDZcXHUxRUI4XFx1MUVDNlxcdTAyMjhcXHUxRTFDXFx1MDExOFxcdTFFMThcXHUxRTFBXFx1MDE5MFxcdTAxOEVdL2cgfSxcclxuXHR7ICdiYXNlJzonRicsICdsZXR0ZXJzJzovW1xcdTAwNDZcXHUyNEJCXFx1RkYyNlxcdTFFMUVcXHUwMTkxXFx1QTc3Ql0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidHJywgJ2xldHRlcnMnOi9bXFx1MDA0N1xcdTI0QkNcXHVGRjI3XFx1MDFGNFxcdTAxMUNcXHUxRTIwXFx1MDExRVxcdTAxMjBcXHUwMUU2XFx1MDEyMlxcdTAxRTRcXHUwMTkzXFx1QTdBMFxcdUE3N0RcXHVBNzdFXS9nIH0sXHJcblx0eyAnYmFzZSc6J0gnLCAnbGV0dGVycyc6L1tcXHUwMDQ4XFx1MjRCRFxcdUZGMjhcXHUwMTI0XFx1MUUyMlxcdTFFMjZcXHUwMjFFXFx1MUUyNFxcdTFFMjhcXHUxRTJBXFx1MDEyNlxcdTJDNjdcXHUyQzc1XFx1QTc4RF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidJJywgJ2xldHRlcnMnOi9bXFx1MDA0OVxcdTI0QkVcXHVGRjI5XFx1MDBDQ1xcdTAwQ0RcXHUwMENFXFx1MDEyOFxcdTAxMkFcXHUwMTJDXFx1MDEzMFxcdTAwQ0ZcXHUxRTJFXFx1MUVDOFxcdTAxQ0ZcXHUwMjA4XFx1MDIwQVxcdTFFQ0FcXHUwMTJFXFx1MUUyQ1xcdTAxOTddL2cgfSxcclxuXHR7ICdiYXNlJzonSicsICdsZXR0ZXJzJzovW1xcdTAwNEFcXHUyNEJGXFx1RkYyQVxcdTAxMzRcXHUwMjQ4XS9nIH0sXHJcblx0eyAnYmFzZSc6J0snLCAnbGV0dGVycyc6L1tcXHUwMDRCXFx1MjRDMFxcdUZGMkJcXHUxRTMwXFx1MDFFOFxcdTFFMzJcXHUwMTM2XFx1MUUzNFxcdTAxOThcXHUyQzY5XFx1QTc0MFxcdUE3NDJcXHVBNzQ0XFx1QTdBMl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidMJywgJ2xldHRlcnMnOi9bXFx1MDA0Q1xcdTI0QzFcXHVGRjJDXFx1MDEzRlxcdTAxMzlcXHUwMTNEXFx1MUUzNlxcdTFFMzhcXHUwMTNCXFx1MUUzQ1xcdTFFM0FcXHUwMTQxXFx1MDIzRFxcdTJDNjJcXHUyQzYwXFx1QTc0OFxcdUE3NDZcXHVBNzgwXS9nIH0sXHJcblx0eyAnYmFzZSc6J0xKJywnbGV0dGVycyc6L1tcXHUwMUM3XS9nIH0sXHJcblx0eyAnYmFzZSc6J0xqJywnbGV0dGVycyc6L1tcXHUwMUM4XS9nIH0sXHJcblx0eyAnYmFzZSc6J00nLCAnbGV0dGVycyc6L1tcXHUwMDREXFx1MjRDMlxcdUZGMkRcXHUxRTNFXFx1MUU0MFxcdTFFNDJcXHUyQzZFXFx1MDE5Q10vZyB9LFxyXG5cdHsgJ2Jhc2UnOidOJywgJ2xldHRlcnMnOi9bXFx1MDA0RVxcdTI0QzNcXHVGRjJFXFx1MDFGOFxcdTAxNDNcXHUwMEQxXFx1MUU0NFxcdTAxNDdcXHUxRTQ2XFx1MDE0NVxcdTFFNEFcXHUxRTQ4XFx1MDIyMFxcdTAxOURcXHVBNzkwXFx1QTdBNF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidOSicsJ2xldHRlcnMnOi9bXFx1MDFDQV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidOaicsJ2xldHRlcnMnOi9bXFx1MDFDQl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidPJywgJ2xldHRlcnMnOi9bXFx1MDA0RlxcdTI0QzRcXHVGRjJGXFx1MDBEMlxcdTAwRDNcXHUwMEQ0XFx1MUVEMlxcdTFFRDBcXHUxRUQ2XFx1MUVENFxcdTAwRDVcXHUxRTRDXFx1MDIyQ1xcdTFFNEVcXHUwMTRDXFx1MUU1MFxcdTFFNTJcXHUwMTRFXFx1MDIyRVxcdTAyMzBcXHUwMEQ2XFx1MDIyQVxcdTFFQ0VcXHUwMTUwXFx1MDFEMVxcdTAyMENcXHUwMjBFXFx1MDFBMFxcdTFFRENcXHUxRURBXFx1MUVFMFxcdTFFREVcXHUxRUUyXFx1MUVDQ1xcdTFFRDhcXHUwMUVBXFx1MDFFQ1xcdTAwRDhcXHUwMUZFXFx1MDE4NlxcdTAxOUZcXHVBNzRBXFx1QTc0Q10vZyB9LFxyXG5cdHsgJ2Jhc2UnOidPSScsJ2xldHRlcnMnOi9bXFx1MDFBMl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidPTycsJ2xldHRlcnMnOi9bXFx1QTc0RV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidPVScsJ2xldHRlcnMnOi9bXFx1MDIyMl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidQJywgJ2xldHRlcnMnOi9bXFx1MDA1MFxcdTI0QzVcXHVGRjMwXFx1MUU1NFxcdTFFNTZcXHUwMUE0XFx1MkM2M1xcdUE3NTBcXHVBNzUyXFx1QTc1NF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidRJywgJ2xldHRlcnMnOi9bXFx1MDA1MVxcdTI0QzZcXHVGRjMxXFx1QTc1NlxcdUE3NThcXHUwMjRBXS9nIH0sXHJcblx0eyAnYmFzZSc6J1InLCAnbGV0dGVycyc6L1tcXHUwMDUyXFx1MjRDN1xcdUZGMzJcXHUwMTU0XFx1MUU1OFxcdTAxNThcXHUwMjEwXFx1MDIxMlxcdTFFNUFcXHUxRTVDXFx1MDE1NlxcdTFFNUVcXHUwMjRDXFx1MkM2NFxcdUE3NUFcXHVBN0E2XFx1QTc4Ml0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidTJywgJ2xldHRlcnMnOi9bXFx1MDA1M1xcdTI0QzhcXHVGRjMzXFx1MUU5RVxcdTAxNUFcXHUxRTY0XFx1MDE1Q1xcdTFFNjBcXHUwMTYwXFx1MUU2NlxcdTFFNjJcXHUxRTY4XFx1MDIxOFxcdTAxNUVcXHUyQzdFXFx1QTdBOFxcdUE3ODRdL2cgfSxcclxuXHR7ICdiYXNlJzonVCcsICdsZXR0ZXJzJzovW1xcdTAwNTRcXHUyNEM5XFx1RkYzNFxcdTFFNkFcXHUwMTY0XFx1MUU2Q1xcdTAyMUFcXHUwMTYyXFx1MUU3MFxcdTFFNkVcXHUwMTY2XFx1MDFBQ1xcdTAxQUVcXHUwMjNFXFx1QTc4Nl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidUWicsJ2xldHRlcnMnOi9bXFx1QTcyOF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidVJywgJ2xldHRlcnMnOi9bXFx1MDA1NVxcdTI0Q0FcXHVGRjM1XFx1MDBEOVxcdTAwREFcXHUwMERCXFx1MDE2OFxcdTFFNzhcXHUwMTZBXFx1MUU3QVxcdTAxNkNcXHUwMERDXFx1MDFEQlxcdTAxRDdcXHUwMUQ1XFx1MDFEOVxcdTFFRTZcXHUwMTZFXFx1MDE3MFxcdTAxRDNcXHUwMjE0XFx1MDIxNlxcdTAxQUZcXHUxRUVBXFx1MUVFOFxcdTFFRUVcXHUxRUVDXFx1MUVGMFxcdTFFRTRcXHUxRTcyXFx1MDE3MlxcdTFFNzZcXHUxRTc0XFx1MDI0NF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidWJywgJ2xldHRlcnMnOi9bXFx1MDA1NlxcdTI0Q0JcXHVGRjM2XFx1MUU3Q1xcdTFFN0VcXHUwMUIyXFx1QTc1RVxcdTAyNDVdL2cgfSxcclxuXHR7ICdiYXNlJzonVlknLCdsZXR0ZXJzJzovW1xcdUE3NjBdL2cgfSxcclxuXHR7ICdiYXNlJzonVycsICdsZXR0ZXJzJzovW1xcdTAwNTdcXHUyNENDXFx1RkYzN1xcdTFFODBcXHUxRTgyXFx1MDE3NFxcdTFFODZcXHUxRTg0XFx1MUU4OFxcdTJDNzJdL2cgfSxcclxuXHR7ICdiYXNlJzonWCcsICdsZXR0ZXJzJzovW1xcdTAwNThcXHUyNENEXFx1RkYzOFxcdTFFOEFcXHUxRThDXS9nIH0sXHJcblx0eyAnYmFzZSc6J1knLCAnbGV0dGVycyc6L1tcXHUwMDU5XFx1MjRDRVxcdUZGMzlcXHUxRUYyXFx1MDBERFxcdTAxNzZcXHUxRUY4XFx1MDIzMlxcdTFFOEVcXHUwMTc4XFx1MUVGNlxcdTFFRjRcXHUwMUIzXFx1MDI0RVxcdTFFRkVdL2cgfSxcclxuXHR7ICdiYXNlJzonWicsICdsZXR0ZXJzJzovW1xcdTAwNUFcXHUyNENGXFx1RkYzQVxcdTAxNzlcXHUxRTkwXFx1MDE3QlxcdTAxN0RcXHUxRTkyXFx1MUU5NFxcdTAxQjVcXHUwMjI0XFx1MkM3RlxcdTJDNkJcXHVBNzYyXS9nIH0sXHJcblx0eyAnYmFzZSc6J2EnLCAnbGV0dGVycyc6L1tcXHUwMDYxXFx1MjREMFxcdUZGNDFcXHUxRTlBXFx1MDBFMFxcdTAwRTFcXHUwMEUyXFx1MUVBN1xcdTFFQTVcXHUxRUFCXFx1MUVBOVxcdTAwRTNcXHUwMTAxXFx1MDEwM1xcdTFFQjFcXHUxRUFGXFx1MUVCNVxcdTFFQjNcXHUwMjI3XFx1MDFFMVxcdTAwRTRcXHUwMURGXFx1MUVBM1xcdTAwRTVcXHUwMUZCXFx1MDFDRVxcdTAyMDFcXHUwMjAzXFx1MUVBMVxcdTFFQURcXHUxRUI3XFx1MUUwMVxcdTAxMDVcXHUyQzY1XFx1MDI1MF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidhYScsJ2xldHRlcnMnOi9bXFx1QTczM10vZyB9LFxyXG5cdHsgJ2Jhc2UnOidhZScsJ2xldHRlcnMnOi9bXFx1MDBFNlxcdTAxRkRcXHUwMUUzXS9nIH0sXHJcblx0eyAnYmFzZSc6J2FvJywnbGV0dGVycyc6L1tcXHVBNzM1XS9nIH0sXHJcblx0eyAnYmFzZSc6J2F1JywnbGV0dGVycyc6L1tcXHVBNzM3XS9nIH0sXHJcblx0eyAnYmFzZSc6J2F2JywnbGV0dGVycyc6L1tcXHVBNzM5XFx1QTczQl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidheScsJ2xldHRlcnMnOi9bXFx1QTczRF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidiJywgJ2xldHRlcnMnOi9bXFx1MDA2MlxcdTI0RDFcXHVGRjQyXFx1MUUwM1xcdTFFMDVcXHUxRTA3XFx1MDE4MFxcdTAxODNcXHUwMjUzXS9nIH0sXHJcblx0eyAnYmFzZSc6J2MnLCAnbGV0dGVycyc6L1tcXHUwMDYzXFx1MjREMlxcdUZGNDNcXHUwMTA3XFx1MDEwOVxcdTAxMEJcXHUwMTBEXFx1MDBFN1xcdTFFMDlcXHUwMTg4XFx1MDIzQ1xcdUE3M0ZcXHUyMTg0XS9nIH0sXHJcblx0eyAnYmFzZSc6J2QnLCAnbGV0dGVycyc6L1tcXHUwMDY0XFx1MjREM1xcdUZGNDRcXHUxRTBCXFx1MDEwRlxcdTFFMERcXHUxRTExXFx1MUUxM1xcdTFFMEZcXHUwMTExXFx1MDE4Q1xcdTAyNTZcXHUwMjU3XFx1QTc3QV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidkeicsJ2xldHRlcnMnOi9bXFx1MDFGM1xcdTAxQzZdL2cgfSxcclxuXHR7ICdiYXNlJzonZScsICdsZXR0ZXJzJzovW1xcdTAwNjVcXHUyNEQ0XFx1RkY0NVxcdTAwRThcXHUwMEU5XFx1MDBFQVxcdTFFQzFcXHUxRUJGXFx1MUVDNVxcdTFFQzNcXHUxRUJEXFx1MDExM1xcdTFFMTVcXHUxRTE3XFx1MDExNVxcdTAxMTdcXHUwMEVCXFx1MUVCQlxcdTAxMUJcXHUwMjA1XFx1MDIwN1xcdTFFQjlcXHUxRUM3XFx1MDIyOVxcdTFFMURcXHUwMTE5XFx1MUUxOVxcdTFFMUJcXHUwMjQ3XFx1MDI1QlxcdTAxRERdL2cgfSxcclxuXHR7ICdiYXNlJzonZicsICdsZXR0ZXJzJzovW1xcdTAwNjZcXHUyNEQ1XFx1RkY0NlxcdTFFMUZcXHUwMTkyXFx1QTc3Q10vZyB9LFxyXG5cdHsgJ2Jhc2UnOidnJywgJ2xldHRlcnMnOi9bXFx1MDA2N1xcdTI0RDZcXHVGRjQ3XFx1MDFGNVxcdTAxMURcXHUxRTIxXFx1MDExRlxcdTAxMjFcXHUwMUU3XFx1MDEyM1xcdTAxRTVcXHUwMjYwXFx1QTdBMVxcdTFENzlcXHVBNzdGXS9nIH0sXHJcblx0eyAnYmFzZSc6J2gnLCAnbGV0dGVycyc6L1tcXHUwMDY4XFx1MjREN1xcdUZGNDhcXHUwMTI1XFx1MUUyM1xcdTFFMjdcXHUwMjFGXFx1MUUyNVxcdTFFMjlcXHUxRTJCXFx1MUU5NlxcdTAxMjdcXHUyQzY4XFx1MkM3NlxcdTAyNjVdL2cgfSxcclxuXHR7ICdiYXNlJzonaHYnLCdsZXR0ZXJzJzovW1xcdTAxOTVdL2cgfSxcclxuXHR7ICdiYXNlJzonaScsICdsZXR0ZXJzJzovW1xcdTAwNjlcXHUyNEQ4XFx1RkY0OVxcdTAwRUNcXHUwMEVEXFx1MDBFRVxcdTAxMjlcXHUwMTJCXFx1MDEyRFxcdTAwRUZcXHUxRTJGXFx1MUVDOVxcdTAxRDBcXHUwMjA5XFx1MDIwQlxcdTFFQ0JcXHUwMTJGXFx1MUUyRFxcdTAyNjhcXHUwMTMxXS9nIH0sXHJcblx0eyAnYmFzZSc6J2onLCAnbGV0dGVycyc6L1tcXHUwMDZBXFx1MjREOVxcdUZGNEFcXHUwMTM1XFx1MDFGMFxcdTAyNDldL2cgfSxcclxuXHR7ICdiYXNlJzonaycsICdsZXR0ZXJzJzovW1xcdTAwNkJcXHUyNERBXFx1RkY0QlxcdTFFMzFcXHUwMUU5XFx1MUUzM1xcdTAxMzdcXHUxRTM1XFx1MDE5OVxcdTJDNkFcXHVBNzQxXFx1QTc0M1xcdUE3NDVcXHVBN0EzXS9nIH0sXHJcblx0eyAnYmFzZSc6J2wnLCAnbGV0dGVycyc6L1tcXHUwMDZDXFx1MjREQlxcdUZGNENcXHUwMTQwXFx1MDEzQVxcdTAxM0VcXHUxRTM3XFx1MUUzOVxcdTAxM0NcXHUxRTNEXFx1MUUzQlxcdTAxN0ZcXHUwMTQyXFx1MDE5QVxcdTAyNkJcXHUyQzYxXFx1QTc0OVxcdUE3ODFcXHVBNzQ3XS9nIH0sXHJcblx0eyAnYmFzZSc6J2xqJywnbGV0dGVycyc6L1tcXHUwMUM5XS9nIH0sXHJcblx0eyAnYmFzZSc6J20nLCAnbGV0dGVycyc6L1tcXHUwMDZEXFx1MjREQ1xcdUZGNERcXHUxRTNGXFx1MUU0MVxcdTFFNDNcXHUwMjcxXFx1MDI2Rl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOiduJywgJ2xldHRlcnMnOi9bXFx1MDA2RVxcdTI0RERcXHVGRjRFXFx1MDFGOVxcdTAxNDRcXHUwMEYxXFx1MUU0NVxcdTAxNDhcXHUxRTQ3XFx1MDE0NlxcdTFFNEJcXHUxRTQ5XFx1MDE5RVxcdTAyNzJcXHUwMTQ5XFx1QTc5MVxcdUE3QTVdL2cgfSxcclxuXHR7ICdiYXNlJzonbmonLCdsZXR0ZXJzJzovW1xcdTAxQ0NdL2cgfSxcclxuXHR7ICdiYXNlJzonbycsICdsZXR0ZXJzJzovW1xcdTAwNkZcXHUyNERFXFx1RkY0RlxcdTAwRjJcXHUwMEYzXFx1MDBGNFxcdTFFRDNcXHUxRUQxXFx1MUVEN1xcdTFFRDVcXHUwMEY1XFx1MUU0RFxcdTAyMkRcXHUxRTRGXFx1MDE0RFxcdTFFNTFcXHUxRTUzXFx1MDE0RlxcdTAyMkZcXHUwMjMxXFx1MDBGNlxcdTAyMkJcXHUxRUNGXFx1MDE1MVxcdTAxRDJcXHUwMjBEXFx1MDIwRlxcdTAxQTFcXHUxRUREXFx1MUVEQlxcdTFFRTFcXHUxRURGXFx1MUVFM1xcdTFFQ0RcXHUxRUQ5XFx1MDFFQlxcdTAxRURcXHUwMEY4XFx1MDFGRlxcdTAyNTRcXHVBNzRCXFx1QTc0RFxcdTAyNzVdL2cgfSxcclxuXHR7ICdiYXNlJzonb2knLCdsZXR0ZXJzJzovW1xcdTAxQTNdL2cgfSxcclxuXHR7ICdiYXNlJzonb3UnLCdsZXR0ZXJzJzovW1xcdTAyMjNdL2cgfSxcclxuXHR7ICdiYXNlJzonb28nLCdsZXR0ZXJzJzovW1xcdUE3NEZdL2cgfSxcclxuXHR7ICdiYXNlJzoncCcsICdsZXR0ZXJzJzovW1xcdTAwNzBcXHUyNERGXFx1RkY1MFxcdTFFNTVcXHUxRTU3XFx1MDFBNVxcdTFEN0RcXHVBNzUxXFx1QTc1M1xcdUE3NTVdL2cgfSxcclxuXHR7ICdiYXNlJzoncScsICdsZXR0ZXJzJzovW1xcdTAwNzFcXHUyNEUwXFx1RkY1MVxcdTAyNEJcXHVBNzU3XFx1QTc1OV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOidyJywgJ2xldHRlcnMnOi9bXFx1MDA3MlxcdTI0RTFcXHVGRjUyXFx1MDE1NVxcdTFFNTlcXHUwMTU5XFx1MDIxMVxcdTAyMTNcXHUxRTVCXFx1MUU1RFxcdTAxNTdcXHUxRTVGXFx1MDI0RFxcdTAyN0RcXHVBNzVCXFx1QTdBN1xcdUE3ODNdL2cgfSxcclxuXHR7ICdiYXNlJzoncycsICdsZXR0ZXJzJzovW1xcdTAwNzNcXHUyNEUyXFx1RkY1M1xcdTAwREZcXHUwMTVCXFx1MUU2NVxcdTAxNURcXHUxRTYxXFx1MDE2MVxcdTFFNjdcXHUxRTYzXFx1MUU2OVxcdTAyMTlcXHUwMTVGXFx1MDIzRlxcdUE3QTlcXHVBNzg1XFx1MUU5Ql0vZyB9LFxyXG5cdHsgJ2Jhc2UnOid0JywgJ2xldHRlcnMnOi9bXFx1MDA3NFxcdTI0RTNcXHVGRjU0XFx1MUU2QlxcdTFFOTdcXHUwMTY1XFx1MUU2RFxcdTAyMUJcXHUwMTYzXFx1MUU3MVxcdTFFNkZcXHUwMTY3XFx1MDFBRFxcdTAyODhcXHUyQzY2XFx1QTc4N10vZyB9LFxyXG5cdHsgJ2Jhc2UnOid0eicsJ2xldHRlcnMnOi9bXFx1QTcyOV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOid1JywgJ2xldHRlcnMnOi9bXFx1MDA3NVxcdTI0RTRcXHVGRjU1XFx1MDBGOVxcdTAwRkFcXHUwMEZCXFx1MDE2OVxcdTFFNzlcXHUwMTZCXFx1MUU3QlxcdTAxNkRcXHUwMEZDXFx1MDFEQ1xcdTAxRDhcXHUwMUQ2XFx1MDFEQVxcdTFFRTdcXHUwMTZGXFx1MDE3MVxcdTAxRDRcXHUwMjE1XFx1MDIxN1xcdTAxQjBcXHUxRUVCXFx1MUVFOVxcdTFFRUZcXHUxRUVEXFx1MUVGMVxcdTFFRTVcXHUxRTczXFx1MDE3M1xcdTFFNzdcXHUxRTc1XFx1MDI4OV0vZyB9LFxyXG5cdHsgJ2Jhc2UnOid2JywgJ2xldHRlcnMnOi9bXFx1MDA3NlxcdTI0RTVcXHVGRjU2XFx1MUU3RFxcdTFFN0ZcXHUwMjhCXFx1QTc1RlxcdTAyOENdL2cgfSxcclxuXHR7ICdiYXNlJzondnknLCdsZXR0ZXJzJzovW1xcdUE3NjFdL2cgfSxcclxuXHR7ICdiYXNlJzondycsICdsZXR0ZXJzJzovW1xcdTAwNzdcXHUyNEU2XFx1RkY1N1xcdTFFODFcXHUxRTgzXFx1MDE3NVxcdTFFODdcXHUxRTg1XFx1MUU5OFxcdTFFODlcXHUyQzczXS9nIH0sXHJcblx0eyAnYmFzZSc6J3gnLCAnbGV0dGVycyc6L1tcXHUwMDc4XFx1MjRFN1xcdUZGNThcXHUxRThCXFx1MUU4RF0vZyB9LFxyXG5cdHsgJ2Jhc2UnOid5JywgJ2xldHRlcnMnOi9bXFx1MDA3OVxcdTI0RThcXHVGRjU5XFx1MUVGM1xcdTAwRkRcXHUwMTc3XFx1MUVGOVxcdTAyMzNcXHUxRThGXFx1MDBGRlxcdTFFRjdcXHUxRTk5XFx1MUVGNVxcdTAxQjRcXHUwMjRGXFx1MUVGRl0vZyB9LFxyXG5cdHsgJ2Jhc2UnOid6JywgJ2xldHRlcnMnOi9bXFx1MDA3QVxcdTI0RTlcXHVGRjVBXFx1MDE3QVxcdTFFOTFcXHUwMTdDXFx1MDE3RVxcdTFFOTNcXHUxRTk1XFx1MDFCNlxcdTAyMjVcXHUwMjQwXFx1MkM2Q1xcdUE3NjNdL2cgfSxcclxuXTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaXBEaWFjcml0aWNzIChzdHIpIHtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IG1hcC5sZW5ndGg7IGkrKykge1xyXG5cdFx0c3RyID0gc3RyLnJlcGxhY2UobWFwW2ldLmxldHRlcnMsIG1hcFtpXS5iYXNlKTtcclxuXHR9XHJcblx0cmV0dXJuIHN0cjtcclxufTtcclxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nO1xuaW1wb3J0IElucHV0IGZyb20gJ3JlYWN0LWlucHV0LWF1dG9zaXplJztcbmltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuaW1wb3J0IGJsYWNrbGlzdCBmcm9tICdibGFja2xpc3QnO1xuXG5pbXBvcnQgc3RyaXBEaWFjcml0aWNzIGZyb20gJy4vdXRpbHMvc3RyaXBEaWFjcml0aWNzJztcblxuaW1wb3J0IEFzeW5jIGZyb20gJy4vQXN5bmMnO1xuaW1wb3J0IERyb3Bkb3duIGZyb20gJy4vRHJvcGRvd24nO1xuaW1wb3J0IE9wdGlvbiBmcm9tICcuL09wdGlvbic7XG5pbXBvcnQgT3B0aW9uR3JvdXAgZnJvbSAnLi9PcHRpb25Hcm91cCc7XG5pbXBvcnQgVmFsdWUgZnJvbSAnLi9WYWx1ZSc7XG5cbmZ1bmN0aW9uIGNsb25lKG9iaikge1xuICBjb25zdCBjb3B5ID0ge307XG4gIGZvciAobGV0IGF0dHIgaW4gb2JqKSB7XG5cdGlmIChvYmouaGFzT3duUHJvcGVydHkoYXR0cikpIHtcblx0ICBjb3B5W2F0dHJdID0gb2JqW2F0dHJdO1xuXHR9O1xuICB9XG4gIHJldHVybiBjb3B5O1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlWYWx1ZSAodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcblx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgfSBlbHNlIHtcblx0cmV0dXJuIHZhbHVlO1xuICB9XG59XG5cbmNvbnN0IHN0cmluZ09yTm9kZSA9IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICBSZWFjdC5Qcm9wVHlwZXMubm9kZVxuXSk7XG5cbmxldCBpbnN0YW5jZUlkID0gMTtcblxuY29uc3QgU2VsZWN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGRpc3BsYXlOYW1lOiAnU2VsZWN0JyxcblxuICBwcm9wVHlwZXM6IHtcblx0YWRkTGFiZWxUZXh0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAgICAvLyBwbGFjZWhvbGRlciBkaXNwbGF5ZWQgd2hlbiB5b3Ugd2FudCB0byBhZGQgYSBsYWJlbCBvbiBhIG11bHRpLXZhbHVlIGlucHV0XG5cdGFsbG93Q3JlYXRlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgLy8gd2hldGhlciB0byBhbGxvdyBjcmVhdGlvbiBvZiBuZXcgZW50cmllc1xuXHQnYXJpYS1sYWJlbCc6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHRcdC8vIEFyaWEgbGFiZWwgKGZvciBhc3Npc3RpdmUgdGVjaClcblx0J2FyaWEtbGFiZWxsZWRieSc6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXHQvLyBIVE1MIElEIG9mIGFuIGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgdXNlZCBhcyB0aGUgbGFiZWwgKGZvciBhc3Npc3RpdmUgdGVjaClcblx0YXV0b0JsdXI6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgICAvLyBhdXRvbWF0aWNhbGx5IGJsdXIgdGhlIGNvbXBvbmVudCB3aGVuIGFuIG9wdGlvbiBpcyBzZWxlY3RlZFxuXHRhdXRvZm9jdXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgIC8vIGF1dG9mb2N1cyB0aGUgY29tcG9uZW50IG9uIG1vdW50XG5cdGF1dG9zaXplOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgICAgLy8gd2hldGhlciB0byBlbmFibGUgYXV0b3NpemluZyBvciBub3Rcblx0YmFja3NwYWNlUmVtb3ZlczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAgICAvLyB3aGV0aGVyIGJhY2tzcGFjZSByZW1vdmVzIGFuIGl0ZW0gaWYgdGhlcmUgaXMgbm8gdGV4dCBpbnB1dFxuXHRiYWNrc3BhY2VUb1JlbW92ZU1lc3NhZ2U6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsICAvLyBNZXNzYWdlIHRvIHVzZSBmb3Igc2NyZWVucmVhZGVycyB0byBwcmVzcyBiYWNrc3BhY2UgdG8gcmVtb3ZlIHRoZSBjdXJyZW50IGl0ZW0gLVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgICAvLyB7bGFiZWx9IGlzIHJlcGxhY2VkIHdpdGggdGhlIGl0ZW0gbGFiZWxcblx0Y2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAgICAgICAvLyBjbGFzc05hbWUgZm9yIHRoZSBvdXRlciBlbGVtZW50XG5cdGNsZWFyQWxsVGV4dDogc3RyaW5nT3JOb2RlLCAgICAgICAgICAgICAgICAgLy8gdGl0bGUgZm9yIHRoZSBcImNsZWFyXCIgY29udHJvbCB3aGVuIG11bHRpOiB0cnVlXG5cdGNsZWFyVmFsdWVUZXh0OiBzdHJpbmdPck5vZGUsICAgICAgICAgICAgICAgLy8gdGl0bGUgZm9yIHRoZSBcImNsZWFyXCIgY29udHJvbFxuXHRjbGVhcmFibGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgIC8vIHNob3VsZCBpdCBiZSBwb3NzaWJsZSB0byByZXNldCB2YWx1ZVxuXHRkZWxpbWl0ZXI6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsICAgICAgICAgIC8vIGRlbGltaXRlciB0byB1c2UgdG8gam9pbiBtdWx0aXBsZSB2YWx1ZXMgZm9yIHRoZSBoaWRkZW4gZmllbGQgdmFsdWVcblx0ZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgICAvLyB3aGV0aGVyIHRoZSBTZWxlY3QgaXMgZGlzYWJsZWQgb3Igbm90XG5cdGRyb3Bkb3duQ29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgICAgLy8gZHJvcGRvd24gY29tcG9uZW50IHRvIHJlbmRlciB0aGUgbWVudSBpblxuXHRlc2NhcGVDbGVhcnNWYWx1ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAgIC8vIHdoZXRoZXIgZXNjYXBlIGNsZWFycyB0aGUgdmFsdWUgd2hlbiB0aGUgbWVudSBpcyBjbG9zZWRcblx0ZmlsdGVyT3B0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgICAgICAgICAvLyBtZXRob2QgdG8gZmlsdGVyIGEgc2luZ2xlIG9wdGlvbiAob3B0aW9uLCBmaWx0ZXJTdHJpbmcpXG5cdGZpbHRlck9wdGlvbnM6IFJlYWN0LlByb3BUeXBlcy5hbnksICAgICAgICAgLy8gYm9vbGVhbiB0byBlbmFibGUgZGVmYXVsdCBmaWx0ZXJpbmcgb3IgZnVuY3Rpb24gdG8gZmlsdGVyIHRoZSBvcHRpb25zIGFycmF5IChbb3B0aW9uc10sIGZpbHRlclN0cmluZywgW3ZhbHVlc10pXG5cdGlnbm9yZUFjY2VudHM6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgLy8gd2hldGhlciB0byBzdHJpcCBkaWFjcml0aWNzIHdoZW4gZmlsdGVyaW5nXG5cdGlnbm9yZUNhc2U6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgLy8gd2hldGhlciB0byBwZXJmb3JtIGNhc2UtaW5zZW5zaXRpdmUgZmlsdGVyaW5nXG5cdGlucHV0UHJvcHM6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsICAgICAgICAgLy8gY3VzdG9tIGF0dHJpYnV0ZXMgZm9yIHRoZSBJbnB1dFxuXHRpbnB1dFJlbmRlcmVyOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgICAgICAgIC8vIHJldHVybnMgYSBjdXN0b20gaW5wdXQgY29tcG9uZW50XG5cdGlzTG9hZGluZzogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAgICAgICAgICAgLy8gd2hldGhlciB0aGUgU2VsZWN0IGlzIGxvYWRpbmcgZXh0ZXJuYWxseSBvciBub3QgKHN1Y2ggYXMgb3B0aW9ucyBiZWluZyBsb2FkZWQpXG5cdGlzT3BlbjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAgICAgICAgICAgICAgLy8gd2hldGhlciB0aGUgU2VsZWN0IGRyb3Bkb3duIG1lbnUgaXMgb3BlbiBvciBub3Rcblx0am9pblZhbHVlczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAgICAgICAgICAvLyBqb2lucyBtdWx0aXBsZSB2YWx1ZXMgaW50byBhIHNpbmdsZSBmb3JtIGZpZWxkIHdpdGggdGhlIGRlbGltaXRlciAobGVnYWN5IG1vZGUpXG5cdGxhYmVsS2V5OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAgICAgICAgLy8gcGF0aCBvZiB0aGUgbGFiZWwgdmFsdWUgaW4gb3B0aW9uIG9iamVjdHNcblx0bWF0Y2hQb3M6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsICAgICAgICAgICAvLyAoYW55fHN0YXJ0KSBtYXRjaCB0aGUgc3RhcnQgb3IgZW50aXJlIHN0cmluZyB3aGVuIGZpbHRlcmluZ1xuXHRtYXRjaFByb3A6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsICAgICAgICAgIC8vIChhbnl8bGFiZWx8dmFsdWUpIHdoaWNoIG9wdGlvbiBwcm9wZXJ0eSB0byBmaWx0ZXIgb25cblx0bWVudUJ1ZmZlcjogUmVhY3QuUHJvcFR5cGVzLm51bWJlciwgICAgICAgICAvLyBvcHRpb25hbCBidWZmZXIgKGluIHB4KSBiZXR3ZWVuIHRoZSBib3R0b20gb2YgdGhlIHZpZXdwb3J0IGFuZCB0aGUgYm90dG9tIG9mIHRoZSBtZW51XG5cdG1lbnVDb250YWluZXJTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCwgLy8gb3B0aW9uYWwgc3R5bGUgdG8gYXBwbHkgdG8gdGhlIG1lbnUgY29udGFpbmVyXG5cdG1lbnVSZW5kZXJlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgLy8gcmVuZGVycyBhIGN1c3RvbSBtZW51IHdpdGggb3B0aW9uc1xuXHRtZW51U3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsICAgICAgICAgIC8vIG9wdGlvbmFsIHN0eWxlIHRvIGFwcGx5IHRvIHRoZSBtZW51XG5cdG11bHRpOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgICAgICAgLy8gbXVsdGktdmFsdWUgaW5wdXRcblx0bXVsdGlUZXh0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgXHQvLyBzaG93IHNlbGVjdGVkIHZhbHVlcyBvbmx5IGFzIHRleHQsIGRlZmF1bHRzIHRvIGZhbHNlXG5cdG5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsICAgICAgICAgICAgICAgLy8gZ2VuZXJhdGVzIGEgaGlkZGVuIDxpbnB1dCAvPiB0YWcgd2l0aCB0aGlzIGZpZWxkIG5hbWUgZm9yIGh0bWwgZm9ybXNcblx0bmV3T3B0aW9uQ3JlYXRvcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAvLyBmYWN0b3J5IHRvIGNyZWF0ZSBuZXcgb3B0aW9ucyB3aGVuIGFsbG93Q3JlYXRlIHNldFxuXHRub1Jlc3VsdHNUZXh0OiBzdHJpbmdPck5vZGUsICAgICAgICAgICAgICAgIC8vIHBsYWNlaG9sZGVyIGRpc3BsYXllZCB3aGVuIHRoZXJlIGFyZSBubyBtYXRjaGluZyBzZWFyY2ggcmVzdWx0c1xuXHRvbkJsdXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAgICAgICAgIC8vIG9uQmx1ciBoYW5kbGVyOiBmdW5jdGlvbiAoZXZlbnQpIHt9XG5cdG9uQmx1clJlc2V0c0lucHV0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgLy8gd2hldGhlciBpbnB1dCBpcyBjbGVhcmVkIG9uIGJsdXJcblx0b25DaGFuZ2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAgICAgICAvLyBvbkNoYW5nZSBoYW5kbGVyOiBmdW5jdGlvbiAobmV3VmFsdWUpIHt9XG5cdG9uQ2xvc2U6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAgICAgICAgLy8gZmlyZXMgd2hlbiB0aGUgbWVudSBpcyBjbG9zZWRcblx0b25Gb2N1czogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgICAgICAvLyBvbkZvY3VzIGhhbmRsZXI6IGZ1bmN0aW9uIChldmVudCkge31cblx0b25JbnB1dENoYW5nZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAvLyBvbklucHV0Q2hhbmdlIGhhbmRsZXI6IGZ1bmN0aW9uIChpbnB1dFZhbHVlKSB7fVxuXHRvbk1lbnVTY3JvbGxUb0JvdHRvbTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsIC8vIGZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgc2Nyb2xsZWQgdG8gdGhlIGJvdHRvbTsgY2FuIGJlIHVzZWQgdG8gcGFnaW5hdGUgb3B0aW9uc1xuXHRvbk9wZW46IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAgICAgICAgIC8vIGZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgb3BlbmVkXG5cdG9uVmFsdWVDbGljazogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAgLy8gb25DbGljayBoYW5kbGVyIGZvciB2YWx1ZSBsYWJlbHM6IGZ1bmN0aW9uICh2YWx1ZSwgZXZlbnQpIHt9XG5cdG9wZW5BZnRlckZvY3VzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcdFx0Ly8gYm9vbGVhbiB0byBlbmFibGUgb3BlbmluZyBkcm9wZG93biB3aGVuIGZvY3VzZWRcblx0b3Blbk9uRm9jdXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAvLyBhbHdheXMgb3BlbiBvcHRpb25zIG1lbnUgb24gZm9jdXNcblx0b3B0aW9uQ2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAvLyBhZGRpdGlvbmFsIGNsYXNzKGVzKSB0byBhcHBseSB0byB0aGUgPE9wdGlvbiAvPiBlbGVtZW50c1xuXHRvcHRpb25Db21wb25lbnQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgIC8vIG9wdGlvbiBjb21wb25lbnQgdG8gcmVuZGVyIGluIGRyb3Bkb3duXG5cdG9wdGlvbkdyb3VwQ29tcG9uZW50OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYywgLy8gb3B0aW9uIGdyb3VwIGNvbXBvbmVudCB0byByZW5kZXIgaW4gZHJvcGRvd25cblx0b3B0aW9uUmVuZGVyZXI6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAvLyBvcHRpb25SZW5kZXJlcjogZnVuY3Rpb24gKG9wdGlvbikge31cblx0b3B0aW9uczogUmVhY3QuUHJvcFR5cGVzLmFycmF5LCAgICAgICAgICAgICAvLyBhcnJheSBvZiBvcHRpb25zXG5cdHBhZ2VTaXplOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLCAgICAgICAgICAgLy8gbnVtYmVyIG9mIGVudHJpZXMgdG8gcGFnZSB3aGVuIHVzaW5nIHBhZ2UgdXAvZG93biBrZXlzXG5cdHBsYWNlaG9sZGVyOiBzdHJpbmdPck5vZGUsICAgICAgICAgICAgICAgICAgLy8gZmllbGQgcGxhY2Vob2xkZXIsIGRpc3BsYXllZCB3aGVuIHRoZXJlJ3Mgbm8gdmFsdWVcblx0cmVuZGVySW52YWxpZFZhbHVlczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAvLyBib29sZWFuIHRvIGVuYWJsZSByZW5kZXJpbmcgdmFsdWVzIHRoYXQgZG8gbm90IG1hdGNoIGFueSBvcHRpb25zXG5cdHJlcXVpcmVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgICAgLy8gYXBwbGllcyBIVE1MNSByZXF1aXJlZCBhdHRyaWJ1dGUgd2hlbiBuZWVkZWRcblx0cmVtb3ZlT3B0aW9uczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAgXHRcdC8vIHJlbW92ZSBvcHRpb25zIG9uIHNlbGVjdCBpbiBtdWx0aXBsZSBkcm9wZG93bixcblx0cmVzZXRWYWx1ZTogUmVhY3QuUHJvcFR5cGVzLmFueSwgICAgICAgICAgICAvLyB2YWx1ZSB0byB1c2Ugd2hlbiB5b3UgY2xlYXIgdGhlIGNvbnRyb2xcblx0c2Nyb2xsTWVudUludG9WaWV3OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAvLyBib29sZWFuIHRvIGVuYWJsZSB0aGUgdmlld3BvcnQgdG8gc2hpZnQgc28gdGhhdCB0aGUgZnVsbCBtZW51IGZ1bGx5IHZpc2libGUgd2hlbiBlbmdhZ2VkXG5cdHNlYXJjaGFibGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLCAgICAgICAgICAgLy8gd2hldGhlciB0byBlbmFibGUgc2VhcmNoaW5nIGZlYXR1cmUgb3Igbm90XG5cdHNpbXBsZVZhbHVlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCwgICAgICAgICAgLy8gcGFzcyB0aGUgdmFsdWUgdG8gb25DaGFuZ2UgYXMgYSBzaW1wbGUgdmFsdWUgKGxlZ2FjeSBwcmUgMS4wIG1vZGUpLCBkZWZhdWx0cyB0byBmYWxzZVxuXHRzdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCwgICAgICAgICAgICAgIC8vIG9wdGlvbmFsIHN0eWxlIHRvIGFwcGx5IHRvIHRoZSBjb250cm9sXG5cdHRhYkluZGV4OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAgICAgICAgLy8gb3B0aW9uYWwgdGFiIGluZGV4IG9mIHRoZSBjb250cm9sXG5cdHRhYlNlbGVjdHNWYWx1ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsICAgICAgLy8gd2hldGhlciB0byB0cmVhdCB0YWJiaW5nIG91dCB3aGlsZSBmb2N1c2VkIHRvIGJlIHZhbHVlIHNlbGVjdGlvblxuXHR2YWx1ZTogUmVhY3QuUHJvcFR5cGVzLmFueSwgICAgICAgICAgICAgICAgIC8vIGluaXRpYWwgZmllbGQgdmFsdWVcblx0dmFsdWVDb21wb25lbnQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAgICAgICAvLyB2YWx1ZSBjb21wb25lbnQgdG8gcmVuZGVyXG5cdHZhbHVlS2V5OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLCAgICAgICAgICAgLy8gcGF0aCBvZiB0aGUgbGFiZWwgdmFsdWUgaW4gb3B0aW9uIG9iamVjdHNcblx0dmFsdWVSZW5kZXJlcjogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsICAgICAgICAvLyB2YWx1ZVJlbmRlcmVyOiBmdW5jdGlvbiAob3B0aW9uKSB7fVxuXHR3cmFwcGVyU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vYmplY3QsICAgICAgIC8vIG9wdGlvbmFsIHN0eWxlIHRvIGFwcGx5IHRvIHRoZSBjb21wb25lbnQgd3JhcHBlclxuICB9LFxuXG4gIHN0YXRpY3M6IHsgQXN5bmMgfSxcblxuICBnZXREZWZhdWx0UHJvcHMgKCkge1xuXHRyZXR1cm4ge1xuXHQgIGFkZExhYmVsVGV4dDogJ0FkZCBcIntsYWJlbH1cIj8nLFxuXHQgIGF1dG9zaXplOiB0cnVlLFxuXHQgIGFsbG93Q3JlYXRlOiBmYWxzZSxcblx0ICBiYWNrc3BhY2VSZW1vdmVzOiB0cnVlLFxuXHQgIGJhY2tzcGFjZVRvUmVtb3ZlTWVzc2FnZTogJ1ByZXNzIGJhY2tzcGFjZSB0byByZW1vdmUge2xhYmVsfScsXG5cdCAgY2xlYXJhYmxlOiB0cnVlLFxuXHQgIGNsZWFyQWxsVGV4dDogJ0NsZWFyIGFsbCcsXG5cdCAgY2xlYXJWYWx1ZVRleHQ6ICdDbGVhciB2YWx1ZScsXG5cdCAgZGVsaW1pdGVyOiAnLCcsXG5cdCAgZGlzYWJsZWQ6IGZhbHNlLFxuXHQgIGRyb3Bkb3duQ29tcG9uZW50OiBEcm9wZG93bixcblx0ICBlc2NhcGVDbGVhcnNWYWx1ZTogdHJ1ZSxcblx0ICBmaWx0ZXJPcHRpb25zOiB0cnVlLFxuXHQgIGlnbm9yZUFjY2VudHM6IHRydWUsXG5cdCAgaWdub3JlQ2FzZTogdHJ1ZSxcblx0ICBpbnB1dFByb3BzOiB7fSxcblx0ICBpc0xvYWRpbmc6IGZhbHNlLFxuXHQgIGpvaW5WYWx1ZXM6IGZhbHNlLFxuXHQgIGxhYmVsS2V5OiAnbGFiZWwnLFxuXHQgIG1hdGNoUG9zOiAnYW55Jyxcblx0ICBtYXRjaFByb3A6ICdhbnknLFxuXHQgIG1lbnVCdWZmZXI6IDAsXG5cdCAgbXVsdGk6IGZhbHNlLFxuXHQgIG11bHRpVGV4dDogZmFsc2UsXG5cdCAgbm9SZXN1bHRzVGV4dDogJ05vIHJlc3VsdHMgZm91bmQnLFxuXHQgIG9uQmx1clJlc2V0c0lucHV0OiB0cnVlLFxuXHQgIG9wZW5BZnRlckZvY3VzOiBmYWxzZSxcblx0ICBvcHRpb25Db21wb25lbnQ6IE9wdGlvbixcblx0ICBvcHRpb25Hcm91cENvbXBvbmVudDogT3B0aW9uR3JvdXAsXG5cdCAgcGFnZVNpemU6IDUsXG5cdCAgcGxhY2Vob2xkZXI6ICdTZWxlY3QuLi4nLFxuXHQgIHJlbmRlckludmFsaWRWYWx1ZXM6IGZhbHNlLFxuXHQgIHJlbW92ZU9wdGlvbnM6IHRydWUsXG5cdCAgcmVxdWlyZWQ6IGZhbHNlLFxuXG5cblx0ICBcblx0ICByZXNldFZhbHVlOiBudWxsLFxuXHQgIHNjcm9sbE1lbnVJbnRvVmlldzogdHJ1ZSxcblx0ICBzZWFyY2hhYmxlOiB0cnVlLFxuXHQgIHNpbXBsZVZhbHVlOiBmYWxzZSxcblx0ICB0YWJTZWxlY3RzVmFsdWU6IHRydWUsXG5cdCAgdmFsdWVDb21wb25lbnQ6IFZhbHVlLFxuXHQgIHZhbHVlS2V5OiAndmFsdWUnLFxuXHR9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSAoKSB7XG5cdHJldHVybiB7XG5cdCAgaW5wdXRWYWx1ZTogJycsXG5cdCAgaXNGb2N1c2VkOiBmYWxzZSxcblx0ICBpc0xvYWRpbmc6IGZhbHNlLFxuXHQgIGlzT3BlbjogZmFsc2UsXG5cdCAgaXNQc2V1ZG9Gb2N1c2VkOiBmYWxzZSxcblx0ICByZXF1aXJlZDogZmFsc2UsXG5cdH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuXHR0aGlzLl9mbGF0T3B0aW9ucyA9IHRoaXMuZmxhdHRlbk9wdGlvbnModGhpcy5wcm9wcy5vcHRpb25zKTtcblx0dGhpcy5faW5zdGFuY2VQcmVmaXggPSAncmVhY3Qtc2VsZWN0LScgKyAoKytpbnN0YW5jZUlkKSArICctJztcblx0Y29uc3QgdmFsdWVBcnJheSA9IHRoaXMuZ2V0VmFsdWVBcnJheSh0aGlzLnByb3BzLnZhbHVlKTtcblxuXHRpZiAodGhpcy5wcm9wcy5yZXF1aXJlZCkge1xuXHQgIHRoaXMuc2V0U3RhdGUoe1xuXHRcdHJlcXVpcmVkOiB0aGlzLmhhbmRsZVJlcXVpcmVkKHZhbHVlQXJyYXlbMF0sIHRoaXMucHJvcHMubXVsdGkpLFxuXHQgIH0pO1xuXHR9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQgKCkge1xuXHRpZiAodGhpcy5wcm9wcy5hdXRvZm9jdXMpIHtcblx0ICB0aGlzLmZvY3VzKCk7XG5cdH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wcykge1xuXHRpZiAobmV4dFByb3BzLm9wdGlvbnMgIT09IHRoaXMucHJvcHMub3B0aW9ucykge1xuXHQgIHRoaXMuX2ZsYXRPcHRpb25zID0gdGhpcy5mbGF0dGVuT3B0aW9ucyhuZXh0UHJvcHMub3B0aW9ucyk7XG5cdH1cblxuXHRjb25zdCB2YWx1ZUFycmF5ID0gdGhpcy5nZXRWYWx1ZUFycmF5KG5leHRQcm9wcy52YWx1ZSwgbmV4dFByb3BzKTtcblxuXHRpZiAobmV4dFByb3BzLnJlcXVpcmVkKSB7XG5cdCAgdGhpcy5zZXRTdGF0ZSh7XG5cdFx0cmVxdWlyZWQ6IHRoaXMuaGFuZGxlUmVxdWlyZWQodmFsdWVBcnJheVswXSwgbmV4dFByb3BzLm11bHRpKSxcblx0ICB9KTtcblx0fVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGUgKG5leHRQcm9wcywgbmV4dFN0YXRlKSB7XG5cdGlmIChuZXh0U3RhdGUuaXNPcGVuICE9PSB0aGlzLnN0YXRlLmlzT3Blbikge1xuXHQgIGNvbnN0IGhhbmRsZXIgPSBuZXh0U3RhdGUuaXNPcGVuID8gbmV4dFByb3BzLm9uT3BlbiA6IG5leHRQcm9wcy5vbkNsb3NlO1xuXHQgIGhhbmRsZXIgJiYgaGFuZGxlcigpO1xuXHR9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuXHQvLyBmb2N1cyB0byB0aGUgc2VsZWN0ZWQgb3B0aW9uXG5cdGxldCBtdWx0aVNjcm9sbERpc2FibGUgPSB0aGlzLnByb3BzLm11bHRpICYmICF0aGlzLnByb3BzLnJlbW92ZU9wdGlvbnM7XG5cdGlmICh0aGlzLnJlZnMubWVudSAmJiB0aGlzLnJlZnMuZm9jdXNlZCAmJiB0aGlzLnN0YXRlLmlzT3BlbiAmJiAhdGhpcy5oYXNTY3JvbGxlZFRvT3B0aW9uICYmICFtdWx0aVNjcm9sbERpc2FibGUpIHtcblx0ICBsZXQgZm9jdXNlZE9wdGlvbk5vZGUgPSBSZWFjdERPTS5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZm9jdXNlZCk7XG5cdCAgbGV0IGZvY3VzZWRPcHRpb25QcmV2aW91c1NpYmxpbmcgPSBmb2N1c2VkT3B0aW9uTm9kZS5wcmV2aW91c1NpYmxpbmc7XG5cdCAgbGV0IGZvY3VzZWRPcHRpb25QYXJlbnQgPSBmb2N1c2VkT3B0aW9uTm9kZS5wYXJlbnRFbGVtZW50O1xuXHQgIGxldCBtZW51Tm9kZSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHRoaXMucmVmcy5tZW51KTtcblx0ICBpZiAoZm9jdXNlZE9wdGlvblByZXZpb3VzU2libGluZykge1xuXHRcdG1lbnVOb2RlLnNjcm9sbFRvcCA9IGZvY3VzZWRPcHRpb25QcmV2aW91c1NpYmxpbmcub2Zmc2V0VG9wO1xuXHQgIH0gZWxzZSBpZiAoZm9jdXNlZE9wdGlvblBhcmVudCAmJiBmb2N1c2VkT3B0aW9uUGFyZW50ID09PSAnU2VsZWN0LW1lbnUnKSB7XG5cdFx0bWVudU5vZGUuc2Nyb2xsVG9wID0gZm9jdXNlZE9wdGlvblBhcmVudC5vZmZzZXRUb3A7XG5cdCAgfSBlbHNlIHtcblx0XHRtZW51Tm9kZS5zY3JvbGxUb3AgPSBmb2N1c2VkT3B0aW9uTm9kZS5vZmZzZXRUb3A7XG5cdCAgfVxuXHQgIHRoaXMuaGFzU2Nyb2xsZWRUb09wdGlvbiA9IHRydWU7XG5cdH0gZWxzZSBpZiAoIXRoaXMuc3RhdGUuaXNPcGVuKSB7XG5cdCAgdGhpcy5oYXNTY3JvbGxlZFRvT3B0aW9uID0gZmFsc2U7XG5cdH1cblxuXHRpZiAodGhpcy5fc2Nyb2xsVG9Gb2N1c2VkT3B0aW9uT25VcGRhdGUgJiYgdGhpcy5yZWZzLmZvY3VzZWQgJiYgdGhpcy5yZWZzLm1lbnUgJiYgIW11bHRpU2Nyb2xsRGlzYWJsZSkge1xuXHQgIHRoaXMuX3Njcm9sbFRvRm9jdXNlZE9wdGlvbk9uVXBkYXRlID0gZmFsc2U7XG5cdCAgdmFyIGZvY3VzZWRET00gPSBSZWFjdERPTS5maW5kRE9NTm9kZSh0aGlzLnJlZnMuZm9jdXNlZCk7XG5cdCAgdmFyIG1lbnVET00gPSBSZWFjdERPTS5maW5kRE9NTm9kZSh0aGlzLnJlZnMubWVudSk7XG5cdCAgdmFyIGZvY3VzZWRSZWN0ID0gZm9jdXNlZERPTS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0ICB2YXIgbWVudVJlY3QgPSBtZW51RE9NLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHQgIGlmIChmb2N1c2VkUmVjdC5ib3R0b20gPiBtZW51UmVjdC5ib3R0b20gfHwgZm9jdXNlZFJlY3QudG9wIDwgbWVudVJlY3QudG9wKSB7XG5cdFx0bWVudURPTS5zY3JvbGxUb3AgPSAoZm9jdXNlZERPTS5vZmZzZXRUb3AgKyBmb2N1c2VkRE9NLmNsaWVudEhlaWdodCAtIG1lbnVET00ub2Zmc2V0SGVpZ2h0KTtcblx0ICB9XG5cdH1cblx0aWYgKHRoaXMucHJvcHMuc2Nyb2xsTWVudUludG9WaWV3ICYmIHRoaXMucmVmcy5tZW51Q29udGFpbmVyICYmICFtdWx0aVNjcm9sbERpc2FibGUpIHtcblx0ICB2YXIgbWVudUNvbnRhaW5lclJlY3QgPSB0aGlzLnJlZnMubWVudUNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0ICBpZiAod2luZG93LmlubmVySGVpZ2h0IDwgbWVudUNvbnRhaW5lclJlY3QuYm90dG9tICsgdGhpcy5wcm9wcy5tZW51QnVmZmVyKSB7XG5cdFx0d2luZG93LnNjcm9sbEJ5KDAsIG1lbnVDb250YWluZXJSZWN0LmJvdHRvbSArIHRoaXMucHJvcHMubWVudUJ1ZmZlciAtIHdpbmRvdy5pbm5lckhlaWdodCk7XG5cdCAgfVxuXHR9XG5cdGlmIChwcmV2UHJvcHMuZGlzYWJsZWQgIT09IHRoaXMucHJvcHMuZGlzYWJsZWQpIHtcblx0ICB0aGlzLnNldFN0YXRlKHsgaXNGb2N1c2VkOiBmYWxzZSB9KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSByZWFjdC9uby1kaWQtdXBkYXRlLXNldC1zdGF0ZVxuXHQgIHRoaXMuY2xvc2VNZW51KCk7XG5cdH1cbiAgfSxcblxuICBmb2N1cyAoKSB7XG5cdGlmICghdGhpcy5yZWZzLmlucHV0KSByZXR1cm47XG5cdHRoaXMucmVmcy5pbnB1dC5mb2N1cygpO1xuXG5cdGlmICh0aGlzLnByb3BzLm9wZW5BZnRlckZvY3VzKSB7XG5cdCAgdGhpcy5zZXRTdGF0ZSh7XG5cdFx0aXNPcGVuOiB0cnVlLFxuXHQgIH0pO1xuXHR9XG4gIH0sXG5cbiAgYmx1cklucHV0KCkge1xuXHRpZiAoIXRoaXMucmVmcy5pbnB1dCkgcmV0dXJuO1xuXHR0aGlzLnJlZnMuaW5wdXQuYmx1cigpO1xuICB9LFxuXG4gIGhhbmRsZVRvdWNoTW92ZSAoZXZlbnQpIHtcblx0Ly8gU2V0IGEgZmxhZyB0aGF0IHRoZSB2aWV3IGlzIGJlaW5nIGRyYWdnZWRcblx0dGhpcy5kcmFnZ2luZyA9IHRydWU7XG4gIH0sXG5cbiAgaGFuZGxlVG91Y2hTdGFydCAoZXZlbnQpIHtcblx0Ly8gU2V0IGEgZmxhZyB0aGF0IHRoZSB2aWV3IGlzIG5vdCBiZWluZyBkcmFnZ2VkXG5cdHRoaXMuZHJhZ2dpbmcgPSBmYWxzZTtcbiAgfSxcblxuICBoYW5kbGVUb3VjaEVuZCAoZXZlbnQpIHtcblx0Ly8gQ2hlY2sgaWYgdGhlIHZpZXcgaXMgYmVpbmcgZHJhZ2dlZCwgSW4gdGhpcyBjYXNlXG5cdC8vIHdlIGRvbid0IHdhbnQgdG8gZmlyZSB0aGUgY2xpY2sgZXZlbnQgKGJlY2F1c2UgdGhlIHVzZXIgb25seSB3YW50cyB0byBzY3JvbGwpXG5cdGlmKHRoaXMuZHJhZ2dpbmcpIHJldHVybjtcblxuXHQvLyBGaXJlIHRoZSBtb3VzZSBldmVudHNcblx0dGhpcy5oYW5kbGVNb3VzZURvd24oZXZlbnQpO1xuICB9LFxuXG4gIGhhbmRsZVRvdWNoRW5kQ2xlYXJWYWx1ZSAoZXZlbnQpIHtcblx0Ly8gQ2hlY2sgaWYgdGhlIHZpZXcgaXMgYmVpbmcgZHJhZ2dlZCwgSW4gdGhpcyBjYXNlXG5cdC8vIHdlIGRvbid0IHdhbnQgdG8gZmlyZSB0aGUgY2xpY2sgZXZlbnQgKGJlY2F1c2UgdGhlIHVzZXIgb25seSB3YW50cyB0byBzY3JvbGwpXG5cdGlmKHRoaXMuZHJhZ2dpbmcpIHJldHVybjtcblxuXHQvLyBDbGVhciB0aGUgdmFsdWVcblx0dGhpcy5jbGVhclZhbHVlKGV2ZW50KTtcbiAgfSxcblxuICBoYW5kbGVNb3VzZURvd24gKGV2ZW50KSB7XG5cdC8vIGlmIHRoZSBldmVudCB3YXMgdHJpZ2dlcmVkIGJ5IGEgbW91c2Vkb3duIGFuZCBub3QgdGhlIHByaW1hcnlcblx0Ly8gYnV0dG9uLCBvciBpZiB0aGUgY29tcG9uZW50IGlzIGRpc2FibGVkLCBpZ25vcmUgaXQuXG5cdGlmICh0aGlzLnByb3BzLmRpc2FibGVkIHx8IChldmVudC50eXBlID09PSAnbW91c2Vkb3duJyAmJiBldmVudC5idXR0b24gIT09IDApKSB7XG5cdCAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKGV2ZW50LnRhcmdldC50YWdOYW1lID09PSAnSU5QVVQnKSB7XG5cdCAgcmV0dXJuO1xuXHR9XG5cblx0Ly8gcHJldmVudCBkZWZhdWx0IGV2ZW50IGhhbmRsZXJzXG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdC8vIGZvciB0aGUgbm9uLXNlYXJjaGFibGUgc2VsZWN0LCB0b2dnbGUgdGhlIG1lbnVcblx0aWYgKCF0aGlzLnByb3BzLnNlYXJjaGFibGUpIHtcblx0ICB0aGlzLmZvY3VzKCk7XG5cdCAgcmV0dXJuIHRoaXMuc2V0U3RhdGUoe1xuXHRcdGlzT3BlbjogIXRoaXMuc3RhdGUuaXNPcGVuLFxuXHQgIH0pO1xuXHR9XG5cblx0aWYgKHRoaXMuc3RhdGUuaXNGb2N1c2VkKSB7XG5cdCAgLy8gT24gaU9TLCB3ZSBjYW4gZ2V0IGludG8gYSBzdGF0ZSB3aGVyZSB3ZSB0aGluayB0aGUgaW5wdXQgaXMgZm9jdXNlZCBidXQgaXQgaXNuJ3QgcmVhbGx5LFxuXHQgIC8vIHNpbmNlIGlPUyBpZ25vcmVzIHByb2dyYW1tYXRpYyBjYWxscyB0byBpbnB1dC5mb2N1cygpIHRoYXQgd2VyZW4ndCB0cmlnZ2VyZWQgYnkgYSBjbGljayBldmVudC5cblx0ICAvLyBDYWxsIGZvY3VzKCkgYWdhaW4gaGVyZSB0byBiZSBzYWZlLlxuXHQgIHRoaXMuZm9jdXMoKTtcblxuXHQgIGxldCBpbnB1dCA9IHRoaXMucmVmcy5pbnB1dDtcblx0ICBpZiAodHlwZW9mIGlucHV0LmdldElucHV0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0Ly8gR2V0IHRoZSBhY3R1YWwgRE9NIGlucHV0IGlmIHRoZSByZWYgaXMgYW4gPElucHV0IC8+IGNvbXBvbmVudFxuXHRcdGlucHV0ID0gaW5wdXQuZ2V0SW5wdXQoKTtcblx0ICB9XG5cblx0ICAvLyBjbGVhcnMgdGhlIHZhbHVlIHNvIHRoYXQgdGhlIGN1cnNvciB3aWxsIGJlIGF0IHRoZSBlbmQgb2YgaW5wdXQgd2hlbiB0aGUgY29tcG9uZW50IHJlLXJlbmRlcnNcblx0ICBpbnB1dC52YWx1ZSA9ICcnO1xuXG5cdCAgLy8gaWYgdGhlIGlucHV0IGlzIGZvY3VzZWQsIGVuc3VyZSB0aGUgbWVudSBpcyBvcGVuXG5cdCAgdGhpcy5zZXRTdGF0ZSh7XG5cdFx0aXNPcGVuOiB0cnVlLFxuXHRcdGlzUHNldWRvRm9jdXNlZDogZmFsc2UsXG5cdCAgfSk7XG5cdH0gZWxzZSB7XG5cdCAgLy8gb3RoZXJ3aXNlLCBmb2N1cyB0aGUgaW5wdXQgYW5kIG9wZW4gdGhlIG1lbnVcblx0ICB0aGlzLl9vcGVuQWZ0ZXJGb2N1cyA9IHRydWU7XG5cdCAgdGhpcy5mb2N1cygpO1xuXHR9XG4gIH0sXG5cbiAgaGFuZGxlTW91c2VEb3duT25BcnJvdyAoZXZlbnQpIHtcblx0Ly8gaWYgdGhlIGV2ZW50IHdhcyB0cmlnZ2VyZWQgYnkgYSBtb3VzZWRvd24gYW5kIG5vdCB0aGUgcHJpbWFyeVxuXHQvLyBidXR0b24sIG9yIGlmIHRoZSBjb21wb25lbnQgaXMgZGlzYWJsZWQsIGlnbm9yZSBpdC5cblx0aWYgKHRoaXMucHJvcHMuZGlzYWJsZWQgfHwgKGV2ZW50LnR5cGUgPT09ICdtb3VzZWRvd24nICYmIGV2ZW50LmJ1dHRvbiAhPT0gMCkpIHtcblx0ICByZXR1cm47XG5cdH1cblx0Ly8gSWYgdGhlIG1lbnUgaXNuJ3Qgb3BlbiwgbGV0IHRoZSBldmVudCBidWJibGUgdG8gdGhlIG1haW4gaGFuZGxlTW91c2VEb3duXG5cdGlmICghdGhpcy5zdGF0ZS5pc09wZW4pIHtcblx0ICByZXR1cm47XG5cdH1cblx0Ly8gcHJldmVudCBkZWZhdWx0IGV2ZW50IGhhbmRsZXJzXG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHQvLyBjbG9zZSB0aGUgbWVudVxuXHR0aGlzLmNsb3NlTWVudSgpO1xuICB9LFxuXG4gIGhhbmRsZU1vdXNlRG93bk9uTWVudSAoZXZlbnQpIHtcblx0Ly8gaWYgdGhlIGV2ZW50IHdhcyB0cmlnZ2VyZWQgYnkgYSBtb3VzZWRvd24gYW5kIG5vdCB0aGUgcHJpbWFyeVxuXHQvLyBidXR0b24sIG9yIGlmIHRoZSBjb21wb25lbnQgaXMgZGlzYWJsZWQsIGlnbm9yZSBpdC5cblx0aWYgKHRoaXMucHJvcHMuZGlzYWJsZWQgfHwgKGV2ZW50LnR5cGUgPT09ICdtb3VzZWRvd24nICYmIGV2ZW50LmJ1dHRvbiAhPT0gMCkpIHtcblx0ICByZXR1cm47XG5cdH1cblx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0dGhpcy5fb3BlbkFmdGVyRm9jdXMgPSB0cnVlO1xuXHR0aGlzLmZvY3VzKCk7XG4gIH0sXG5cbiAgY2xvc2VNZW51ICgpIHtcblx0dGhpcy5zZXRTdGF0ZSh7XG5cdCAgaXNPcGVuOiBmYWxzZSxcblx0ICBpc1BzZXVkb0ZvY3VzZWQ6IHRoaXMuc3RhdGUuaXNGb2N1c2VkICYmICF0aGlzLnByb3BzLm11bHRpLFxuXHQgIGlucHV0VmFsdWU6ICcnLFxuXHR9KTtcblx0dGhpcy5oYXNTY3JvbGxlZFRvT3B0aW9uID0gZmFsc2U7XG4gIH0sXG5cbiAgaGFuZGxlSW5wdXRGb2N1cyAoZXZlbnQpIHtcblx0dmFyIGlzT3BlbiA9IHRoaXMuc3RhdGUuaXNPcGVuIHx8IHRoaXMuX29wZW5BZnRlckZvY3VzIHx8IHRoaXMucHJvcHMub3Blbk9uRm9jdXM7XG5cdGlmICh0aGlzLnByb3BzLm9uRm9jdXMpIHtcblx0ICB0aGlzLnByb3BzLm9uRm9jdXMoZXZlbnQpO1xuXHR9XG5cdHRoaXMuc2V0U3RhdGUoe1xuXHQgIGlzRm9jdXNlZDogdHJ1ZSxcblx0ICBpc09wZW46IGlzT3BlblxuXHR9KTtcblx0dGhpcy5fb3BlbkFmdGVyRm9jdXMgPSBmYWxzZTtcbiAgfSxcblxuICBoYW5kbGVJbnB1dEJsdXIgKGV2ZW50KSB7XG5cdC8vIFRoZSBjaGVjayBmb3IgbWVudS5jb250YWlucyhhY3RpdmVFbGVtZW50KSBpcyBuZWNlc3NhcnkgdG8gcHJldmVudCBJRTExJ3Mgc2Nyb2xsYmFyIGZyb20gY2xvc2luZyB0aGUgbWVudSBpbiBjZXJ0YWluIGNvbnRleHRzLlxuXHRpZiAodGhpcy5yZWZzLm1lbnUgJiYgKHRoaXMucmVmcy5tZW51ID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IHx8IHRoaXMucmVmcy5tZW51LmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpKSkge1xuXHQgIHRoaXMuZm9jdXMoKTtcblx0ICByZXR1cm47XG5cdH1cblxuXHRpZiAodGhpcy5wcm9wcy5vbkJsdXIpIHtcblx0ICB0aGlzLnByb3BzLm9uQmx1cihldmVudCk7XG5cdH1cblx0dmFyIG9uQmx1cnJlZFN0YXRlID0ge1xuXHQgIGlzRm9jdXNlZDogZmFsc2UsXG5cdCAgaXNPcGVuOiBmYWxzZSxcblx0ICBpc1BzZXVkb0ZvY3VzZWQ6IGZhbHNlLFxuXHR9O1xuXHRpZiAodGhpcy5wcm9wcy5vbkJsdXJSZXNldHNJbnB1dCkge1xuXHQgIG9uQmx1cnJlZFN0YXRlLmlucHV0VmFsdWUgPSAnJztcblx0fVxuXHR0aGlzLnNldFN0YXRlKG9uQmx1cnJlZFN0YXRlKTtcbiAgfSxcblxuICBoYW5kbGVJbnB1dENoYW5nZSAoZXZlbnQpIHtcblx0bGV0IG5ld0lucHV0VmFsdWUgPSBldmVudC50YXJnZXQudmFsdWU7XG5cdGlmICh0aGlzLnN0YXRlLmlucHV0VmFsdWUgIT09IGV2ZW50LnRhcmdldC52YWx1ZSAmJiB0aGlzLnByb3BzLm9uSW5wdXRDaGFuZ2UpIHtcblx0ICBsZXQgbmV4dFN0YXRlID0gdGhpcy5wcm9wcy5vbklucHV0Q2hhbmdlKG5ld0lucHV0VmFsdWUpO1xuXHQgIC8vIE5vdGU6ICE9IHVzZWQgZGVsaWJlcmF0ZWx5IGhlcmUgdG8gY2F0Y2ggdW5kZWZpbmVkIGFuZCBudWxsXG5cdCAgaWYgKG5leHRTdGF0ZSAhPSBudWxsICYmIHR5cGVvZiBuZXh0U3RhdGUgIT09ICdvYmplY3QnKSB7XG5cdFx0bmV3SW5wdXRWYWx1ZSA9ICcnICsgbmV4dFN0YXRlO1xuXHQgIH1cblx0fVxuXHR0aGlzLnNldFN0YXRlKHtcblx0ICBpc09wZW46IHRydWUsXG5cdCAgaXNQc2V1ZG9Gb2N1c2VkOiBmYWxzZSxcblx0ICBpbnB1dFZhbHVlOiBuZXdJbnB1dFZhbHVlXG5cdH0pO1xuICB9LFxuXG4gIGhhbmRsZUtleURvd24gKGV2ZW50KSB7XG5cdGlmICh0aGlzLnByb3BzLmRpc2FibGVkKSByZXR1cm47XG5cdHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuXHQgIGNhc2UgODogLy8gYmFja3NwYWNlXG5cdFx0aWYgKCF0aGlzLnN0YXRlLmlucHV0VmFsdWUgJiYgdGhpcy5wcm9wcy5iYWNrc3BhY2VSZW1vdmVzKSB7XG5cdFx0ICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdCAgdGhpcy5wb3BWYWx1ZSgpO1xuXHRcdH1cblx0XHRyZXR1cm47XG5cdCAgY2FzZSA5OiAvLyB0YWJcblx0XHRpZiAoZXZlbnQuc2hpZnRLZXkgfHwgIXRoaXMuc3RhdGUuaXNPcGVuIHx8ICF0aGlzLnByb3BzLnRhYlNlbGVjdHNWYWx1ZSkge1xuXHRcdCAgcmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLnNlbGVjdEZvY3VzZWRPcHRpb24oKTtcblx0XHRyZXR1cm47XG5cdCAgY2FzZSAxMzogLy8gZW50ZXJcblx0XHRpZiAoIXRoaXMuc3RhdGUuaXNPcGVuKSByZXR1cm47XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0dGhpcy5zZWxlY3RGb2N1c2VkT3B0aW9uKCk7XG5cdFx0YnJlYWs7XG5cdCAgY2FzZSAyNzogLy8gZXNjYXBlXG5cdFx0aWYgKHRoaXMuc3RhdGUuaXNPcGVuKSB7XG5cdFx0ICB0aGlzLmNsb3NlTWVudSgpO1xuXHRcdCAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnByb3BzLmNsZWFyYWJsZSAmJiB0aGlzLnByb3BzLmVzY2FwZUNsZWFyc1ZhbHVlKSB7XG5cdFx0ICB0aGlzLmNsZWFyVmFsdWUoZXZlbnQpO1xuXHRcdCAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHRcdGJyZWFrO1xuXHQgIGNhc2UgMzg6IC8vIHVwXG5cdFx0dGhpcy5mb2N1c1ByZXZpb3VzT3B0aW9uKCk7XG5cdFx0YnJlYWs7XG5cdCAgY2FzZSA0MDogLy8gZG93blxuXHRcdHRoaXMuZm9jdXNOZXh0T3B0aW9uKCk7XG5cdFx0YnJlYWs7XG5cdCAgY2FzZSAzMzogLy8gcGFnZSB1cFxuXHRcdHRoaXMuZm9jdXNQYWdlVXBPcHRpb24oKTtcblx0XHRicmVhaztcblx0ICBjYXNlIDM0OiAvLyBwYWdlIGRvd25cblx0XHR0aGlzLmZvY3VzUGFnZURvd25PcHRpb24oKTtcblx0XHRicmVhaztcblx0ICBjYXNlIDM1OiAvLyBlbmQga2V5XG5cdFx0dGhpcy5mb2N1c0VuZE9wdGlvbigpO1xuXHRcdGJyZWFrO1xuXHQgIGNhc2UgMzY6IC8vIGhvbWUga2V5XG5cdFx0dGhpcy5mb2N1c1N0YXJ0T3B0aW9uKCk7XG5cdFx0YnJlYWs7XG5cdFx0Ly8gY2FzZSAxODg6IC8vICxcblx0XHQvLyBcdGlmICh0aGlzLnByb3BzLmFsbG93Q3JlYXRlICYmIHRoaXMucHJvcHMubXVsdGkpIHtcblx0XHQvLyBcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHQvLyBcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0Ly8gXHRcdHRoaXMuc2VsZWN0Rm9jdXNlZE9wdGlvbigpO1xuXHRcdC8vIFx0fSBlbHNlIHtcblx0XHQvLyBcdFx0cmV0dXJuO1xuXHRcdC8vIFx0fVxuXHRcdC8vIGJyZWFrO1xuXHQgIGRlZmF1bHQ6IHJldHVybjtcblx0fVxuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB9LFxuXG4gIGhhbmRsZVZhbHVlQ2xpY2sgKG9wdGlvbiwgZXZlbnQpIHtcblx0aWYgKCF0aGlzLnByb3BzLm9uVmFsdWVDbGljaykgcmV0dXJuO1xuXHR0aGlzLnByb3BzLm9uVmFsdWVDbGljayhvcHRpb24sIGV2ZW50KTtcbiAgfSxcblxuICBoYW5kbGVNZW51U2Nyb2xsIChldmVudCkge1xuXHRpZiAoIXRoaXMucHJvcHMub25NZW51U2Nyb2xsVG9Cb3R0b20gfHwgKHRoaXMucHJvcHMubXVsdGkgJiYgIXRoaXMucHJvcHMucmVtb3ZlT3B0aW9ucykpIHJldHVybjtcblx0bGV0IHsgdGFyZ2V0IH0gPSBldmVudDtcblx0aWYgKHRhcmdldC5zY3JvbGxIZWlnaHQgPiB0YXJnZXQub2Zmc2V0SGVpZ2h0ICYmICEodGFyZ2V0LnNjcm9sbEhlaWdodCAtIHRhcmdldC5vZmZzZXRIZWlnaHQgLSB0YXJnZXQuc2Nyb2xsVG9wKSkge1xuXHQgIHRoaXMucHJvcHMub25NZW51U2Nyb2xsVG9Cb3R0b20oKTtcblx0fVxuICB9LFxuXG4gIGhhbmRsZVJlcXVpcmVkICh2YWx1ZSwgbXVsdGkpIHtcblx0aWYgKCF2YWx1ZSkgcmV0dXJuIHRydWU7XG5cdHJldHVybiAobXVsdGkgPyB2YWx1ZS5sZW5ndGggPT09IDAgOiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoID09PSAwKTtcbiAgfSxcblxuICBnZXRPcHRpb25MYWJlbCAob3ApIHtcblx0cmV0dXJuIG9wW3RoaXMucHJvcHMubGFiZWxLZXldO1xuICB9LFxuXG4gIC8qKlxuICAgKiBUdXJucyBhIHZhbHVlIGludG8gYW4gYXJyYXkgZnJvbSB0aGUgZ2l2ZW4gb3B0aW9uc1xuICAgKiBAcGFyYW1cdHtTdHJpbmd8TnVtYmVyfEFycmF5fVx0dmFsdWVcdFx0LSB0aGUgdmFsdWUgb2YgdGhlIHNlbGVjdCBpbnB1dFxuICAgKiBAcGFyYW1cdHtPYmplY3R9XHRcdG5leHRQcm9wc1x0LSBvcHRpb25hbGx5IHNwZWNpZnkgdGhlIG5leHRQcm9wcyBzbyB0aGUgcmV0dXJuZWQgYXJyYXkgdXNlcyB0aGUgbGF0ZXN0IGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnNcdHtBcnJheX1cdHRoZSB2YWx1ZSBvZiB0aGUgc2VsZWN0IHJlcHJlc2VudGVkIGluIGFuIGFycmF5XG4gICAqL1xuICBnZXRWYWx1ZUFycmF5ICh2YWx1ZSwgbmV4dFByb3BzKSB7XG5cdC8qKiBzdXBwb3J0IG9wdGlvbmFsbHkgcGFzc2luZyBpbiB0aGUgYG5leHRQcm9wc2Agc28gYGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHNgIHVwZGF0ZXMgd2lsbCBmdW5jdGlvbiBhcyBleHBlY3RlZCAqL1xuXHRjb25zdCBwcm9wcyA9IHR5cGVvZiBuZXh0UHJvcHMgPT09ICdvYmplY3QnID8gbmV4dFByb3BzIDogdGhpcy5wcm9wcztcblx0aWYgKHByb3BzLm11bHRpKSB7XG5cdCAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHZhbHVlID0gdmFsdWUuc3BsaXQocHJvcHMuZGVsaW1pdGVyKTtcblx0ICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cdFx0aWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcblx0XHR2YWx1ZSA9IFt2YWx1ZV07XG5cdCAgfVxuXHQgIHJldHVybiB2YWx1ZS5tYXAodmFsdWUgPT4gdGhpcy5leHBhbmRWYWx1ZSh2YWx1ZSwgcHJvcHMpKS5maWx0ZXIoaSA9PiBpKTtcblx0fVxuXHR2YXIgZXhwYW5kZWRWYWx1ZSA9IHRoaXMuZXhwYW5kVmFsdWUodmFsdWUsIHByb3BzKTtcblx0cmV0dXJuIGV4cGFuZGVkVmFsdWUgPyBbZXhwYW5kZWRWYWx1ZV0gOiBbXTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0cmlldmUgYSB2YWx1ZSBmcm9tIHRoZSBnaXZlbiBvcHRpb25zIGFuZCB2YWx1ZUtleVxuICAgKiBAcGFyYW1cdHtTdHJpbmd8TnVtYmVyfEFycmF5fVx0dmFsdWVcdC0gdGhlIHNlbGVjdGVkIHZhbHVlKHMpXG4gICAqIEBwYXJhbVx0e09iamVjdH1cdFx0cHJvcHNcdC0gdGhlIFNlbGVjdCBjb21wb25lbnQncyBwcm9wcyAob3IgbmV4dFByb3BzKVxuICAgKi9cbiAgZXhwYW5kVmFsdWUgKHZhbHVlLCBwcm9wcykge1xuXHRpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyAmJiB0eXBlb2YgdmFsdWUgIT09ICdudW1iZXInKSByZXR1cm4gdmFsdWU7XG5cdGxldCB7IGxhYmVsS2V5LCB2YWx1ZUtleSwgcmVuZGVySW52YWxpZFZhbHVlcyB9ID0gdGhpcy5wcm9wcztcblx0bGV0IG9wdGlvbnMgPSB0aGlzLl9mbGF0T3B0aW9ucztcblx0aWYgKCFvcHRpb25zIHx8IHZhbHVlID09PSAnJykgcmV0dXJuO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcblx0ICBpZiAob3B0aW9uc1tpXVt2YWx1ZUtleV0gPT09IHZhbHVlKSByZXR1cm4gb3B0aW9uc1tpXTtcblx0fVxuXG5cdC8vIG5vIG1hdGNoaW5nIG9wdGlvbiwgcmV0dXJuIGFuIGludmFsaWQgb3B0aW9uIGlmIHJlbmRlckludmFsaWRWYWx1ZXMgaXMgZW5hYmxlZFxuXHRpZiAocmVuZGVySW52YWxpZFZhbHVlcykge1xuXHQgIHJldHVybiB7XG5cdFx0aW52YWxpZDogdHJ1ZSxcblx0XHRbbGFiZWxLZXldOiB2YWx1ZSxcblx0XHRbdmFsdWVLZXldOiB2YWx1ZVxuXHQgIH07XG5cdH1cbiAgfSxcblxuICBzZXRWYWx1ZSAodmFsdWUpIHtcblx0aWYgKHRoaXMucHJvcHMuYXV0b0JsdXIpe1xuXHQgIHRoaXMuYmx1cklucHV0KCk7XG5cdH1cblx0aWYgKCF0aGlzLnByb3BzLm9uQ2hhbmdlKSByZXR1cm47XG5cdGlmICh0aGlzLnByb3BzLnJlcXVpcmVkKSB7XG5cdCAgY29uc3QgcmVxdWlyZWQgPSB0aGlzLmhhbmRsZVJlcXVpcmVkKHZhbHVlLCB0aGlzLnByb3BzLm11bHRpKTtcblx0ICB0aGlzLnNldFN0YXRlKHsgcmVxdWlyZWQgfSk7XG5cdH1cblx0aWYgKHRoaXMucHJvcHMuc2ltcGxlVmFsdWUgJiYgdmFsdWUpIHtcblx0ICB2YWx1ZSA9IHRoaXMucHJvcHMubXVsdGkgPyB2YWx1ZS5tYXAoaSA9PiBpW3RoaXMucHJvcHMudmFsdWVLZXldKS5qb2luKHRoaXMucHJvcHMuZGVsaW1pdGVyKSA6IHZhbHVlW3RoaXMucHJvcHMudmFsdWVLZXldO1xuXHR9XG5cdHRoaXMucHJvcHMub25DaGFuZ2UodmFsdWUpO1xuICB9LFxuXG4gIHNlbGVjdFZhbHVlICh2YWx1ZSkge1xuXHQvL05PVEU6IHVwZGF0ZSB2YWx1ZSBpbiB0aGUgY2FsbGJhY2sgdG8gbWFrZSBzdXJlIHRoZSBpbnB1dCB2YWx1ZSBpcyBlbXB0eSBzbyB0aGF0IHRoZXJlIGFyZSBubyBzdHR5bGluZyBpc3N1ZXMgKENocm9tZSBoYWQgaXNzdWUgb3RoZXJ3aXNlKVxuXHR0aGlzLmhhc1Njcm9sbGVkVG9PcHRpb24gPSBmYWxzZTtcblx0aWYgKHRoaXMucHJvcHMubXVsdGkpIHtcblx0ICB0aGlzLnNldFN0YXRlKHtcblx0XHRpbnB1dFZhbHVlOiAnJyxcblx0XHRmb2N1c2VkSW5kZXg6IG51bGxcblx0ICB9LCAoKSA9PiB7XG5cdFx0aWYgKCF0aGlzLnByb3BzLnJlbW92ZU9wdGlvbnMpIHtcblx0XHRsZXQgdmFsdWVzID0gdGhpcy5nZXRWYWx1ZUFycmF5KHRoaXMucHJvcHMudmFsdWUpO1xuXHRcdGlmICh2YWx1ZXMuaW5kZXhPZih2YWx1ZSkgPiAtMSkge1xuXHRcdCAgdGhpcy5yZW1vdmVWYWx1ZSh2YWx1ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHQgIHRoaXMuYWRkVmFsdWUodmFsdWUpO1xuXHRcdH1cblx0ICB9IGVsc2Uge1xuXHRcdHRoaXMuYWRkVmFsdWUodmFsdWUpO1xuXHQgIH1cblx0fSk7XG5cdH0gZWxzZSB7XG5cdCAgdGhpcy5zZXRTdGF0ZSh7XG5cdFx0aXNPcGVuOiBmYWxzZSxcblx0XHRpbnB1dFZhbHVlOiAnJyxcblx0XHRpc1BzZXVkb0ZvY3VzZWQ6IHRoaXMuc3RhdGUuaXNGb2N1c2VkLFxuXHQgIH0sICgpID0+IHtcblx0XHR0aGlzLnNldFZhbHVlKHZhbHVlKTtcblx0fSk7XG5cdH1cbiAgfSxcblxuICBhZGRWYWx1ZSAodmFsdWUpIHtcblx0dmFyIHZhbHVlQXJyYXkgPSB0aGlzLmdldFZhbHVlQXJyYXkodGhpcy5wcm9wcy52YWx1ZSk7XG5cdHRoaXMuc2V0VmFsdWUodmFsdWVBcnJheS5jb25jYXQodmFsdWUpKTtcbiAgfSxcblxuICBwb3BWYWx1ZSAoKSB7XG5cdHZhciB2YWx1ZUFycmF5ID0gdGhpcy5nZXRWYWx1ZUFycmF5KHRoaXMucHJvcHMudmFsdWUpO1xuXHRpZiAoIXZhbHVlQXJyYXkubGVuZ3RoKSByZXR1cm47XG5cdGlmICh2YWx1ZUFycmF5W3ZhbHVlQXJyYXkubGVuZ3RoLTFdLmNsZWFyYWJsZVZhbHVlID09PSBmYWxzZSkgcmV0dXJuO1xuXHR0aGlzLnNldFZhbHVlKHZhbHVlQXJyYXkuc2xpY2UoMCwgdmFsdWVBcnJheS5sZW5ndGggLSAxKSk7XG4gIH0sXG5cbiAgcmVtb3ZlVmFsdWUgKHZhbHVlKSB7XG5cdHZhciB2YWx1ZUFycmF5ID0gdGhpcy5nZXRWYWx1ZUFycmF5KHRoaXMucHJvcHMudmFsdWUpO1xuXHR0aGlzLnNldFZhbHVlKHZhbHVlQXJyYXkuZmlsdGVyKGkgPT4gaSAhPT0gdmFsdWUpKTtcblx0dGhpcy5mb2N1cygpO1xuICB9LFxuXG4gIGNsZWFyVmFsdWUgKGV2ZW50KSB7XG5cdC8vIGlmIHRoZSBldmVudCB3YXMgdHJpZ2dlcmVkIGJ5IGEgbW91c2Vkb3duIGFuZCBub3QgdGhlIHByaW1hcnlcblx0Ly8gYnV0dG9uLCBpZ25vcmUgaXQuXG5cdGlmIChldmVudCAmJiBldmVudC50eXBlID09PSAnbW91c2Vkb3duJyAmJiBldmVudC5idXR0b24gIT09IDApIHtcblx0ICByZXR1cm47XG5cdH1cblx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdHRoaXMuc2V0VmFsdWUodGhpcy5wcm9wcy5yZXNldFZhbHVlKTtcblx0dGhpcy5zZXRTdGF0ZSh7XG5cdCAgaXNPcGVuOiBmYWxzZSxcblx0ICBpbnB1dFZhbHVlOiAnJyxcblx0fSwgdGhpcy5mb2N1cyk7XG4gIH0sXG5cbiAgZm9jdXNPcHRpb24gKG9wdGlvbikge1xuXHR0aGlzLnNldFN0YXRlKHtcblx0ICBmb2N1c2VkT3B0aW9uOiBvcHRpb25cblx0fSk7XG4gIH0sXG5cbiAgZm9jdXNOZXh0T3B0aW9uICgpIHtcblx0dGhpcy5mb2N1c0FkamFjZW50T3B0aW9uKCduZXh0Jyk7XG4gIH0sXG5cbiAgZm9jdXNQcmV2aW91c09wdGlvbiAoKSB7XG5cdHRoaXMuZm9jdXNBZGphY2VudE9wdGlvbigncHJldmlvdXMnKTtcbiAgfSxcblxuICBmb2N1c1BhZ2VVcE9wdGlvbiAoKSB7XG5cdHRoaXMuZm9jdXNBZGphY2VudE9wdGlvbigncGFnZV91cCcpO1xuICB9LFxuXG4gIGZvY3VzUGFnZURvd25PcHRpb24gKCkge1xuXHR0aGlzLmZvY3VzQWRqYWNlbnRPcHRpb24oJ3BhZ2VfZG93bicpO1xuICB9LFxuXG4gIGZvY3VzU3RhcnRPcHRpb24gKCkge1xuXHR0aGlzLmZvY3VzQWRqYWNlbnRPcHRpb24oJ3N0YXJ0Jyk7XG4gIH0sXG5cbiAgZm9jdXNFbmRPcHRpb24gKCkge1xuXHR0aGlzLmZvY3VzQWRqYWNlbnRPcHRpb24oJ2VuZCcpO1xuICB9LFxuXG4gIGZvY3VzQWRqYWNlbnRPcHRpb24gKGRpcikge1xuXHR2YXIgb3B0aW9ucyA9IHRoaXMuX3Zpc2libGVPcHRpb25zXG5cdFx0XHQubWFwKChvcHRpb24sIGluZGV4KSA9PiAoeyBvcHRpb24sIGluZGV4IH0pKVxuICAuZmlsdGVyKG9wdGlvbiA9PiAhb3B0aW9uLm9wdGlvbi5kaXNhYmxlZCk7XG5cdHRoaXMuX3Njcm9sbFRvRm9jdXNlZE9wdGlvbk9uVXBkYXRlID0gdHJ1ZTtcblx0aWYgKCF0aGlzLnN0YXRlLmlzT3Blbikge1xuXHQgIHRoaXMuc2V0U3RhdGUoe1xuXHRcdGlzT3BlbjogdHJ1ZSxcblx0XHRpbnB1dFZhbHVlOiAnJyxcblx0XHRmb2N1c2VkT3B0aW9uOiB0aGlzLl9mb2N1c2VkT3B0aW9uIHx8IG9wdGlvbnNbZGlyID09PSAnbmV4dCcgPyAwIDogb3B0aW9ucy5sZW5ndGggLSAxXS5vcHRpb25cblx0ICB9KTtcblx0ICByZXR1cm47XG5cdH1cblx0aWYgKCFvcHRpb25zLmxlbmd0aCkgcmV0dXJuO1xuXHR2YXIgZm9jdXNlZEluZGV4ID0gLTE7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuXHQgIGlmICh0aGlzLl9mb2N1c2VkT3B0aW9uID09PSBvcHRpb25zW2ldLm9wdGlvbikge1xuXHRcdGZvY3VzZWRJbmRleCA9IGk7XG5cdFx0YnJlYWs7XG5cdCAgfVxuXHR9XG5cdGlmIChkaXIgPT09ICduZXh0JyAmJiBmb2N1c2VkSW5kZXggIT09IC0xICkge1xuXHQgIGZvY3VzZWRJbmRleCA9IChmb2N1c2VkSW5kZXggKyAxKSAlIG9wdGlvbnMubGVuZ3RoO1xuXHR9IGVsc2UgaWYgKGRpciA9PT0gJ3ByZXZpb3VzJykge1xuXHQgIGlmIChmb2N1c2VkSW5kZXggPiAwKSB7XG5cdFx0Zm9jdXNlZEluZGV4ID0gZm9jdXNlZEluZGV4IC0gMTtcblx0ICB9IGVsc2Uge1xuXHRcdGZvY3VzZWRJbmRleCA9IG9wdGlvbnMubGVuZ3RoIC0gMTtcblx0ICB9XG5cdH0gZWxzZSBpZiAoZGlyID09PSAnc3RhcnQnKSB7XG5cdCAgZm9jdXNlZEluZGV4ID0gMDtcblx0fSBlbHNlIGlmIChkaXIgPT09ICdlbmQnKSB7XG5cdCAgZm9jdXNlZEluZGV4ID0gb3B0aW9ucy5sZW5ndGggLSAxO1xuXHR9IGVsc2UgaWYgKGRpciA9PT0gJ3BhZ2VfdXAnKSB7XG5cdCAgdmFyIHBvdGVudGlhbEluZGV4ID0gZm9jdXNlZEluZGV4IC0gdGhpcy5wcm9wcy5wYWdlU2l6ZTtcblx0ICBpZiAoIHBvdGVudGlhbEluZGV4IDwgMCApIHtcblx0XHRmb2N1c2VkSW5kZXggPSAwO1xuXHQgIH0gZWxzZSB7XG5cdFx0Zm9jdXNlZEluZGV4ID0gcG90ZW50aWFsSW5kZXg7XG5cdCAgfVxuXHR9IGVsc2UgaWYgKGRpciA9PT0gJ3BhZ2VfZG93bicpIHtcblx0ICB2YXIgcG90ZW50aWFsSW5kZXggPSBmb2N1c2VkSW5kZXggKyB0aGlzLnByb3BzLnBhZ2VTaXplO1xuXHQgIGlmICggcG90ZW50aWFsSW5kZXggPiBvcHRpb25zLmxlbmd0aCAtIDEgKSB7XG5cdFx0Zm9jdXNlZEluZGV4ID0gb3B0aW9ucy5sZW5ndGggLSAxO1xuXHQgIH0gZWxzZSB7XG5cdFx0Zm9jdXNlZEluZGV4ID0gcG90ZW50aWFsSW5kZXg7XG5cdCAgfVxuXHR9XG5cblx0aWYgKGZvY3VzZWRJbmRleCA9PT0gLTEpIHtcblx0ICBmb2N1c2VkSW5kZXggPSAwO1xuXHR9XG5cblx0dGhpcy5zZXRTdGF0ZSh7XG5cdCAgZm9jdXNlZEluZGV4OiBvcHRpb25zW2ZvY3VzZWRJbmRleF0uaW5kZXgsXG5cdCAgZm9jdXNlZE9wdGlvbjogb3B0aW9uc1tmb2N1c2VkSW5kZXhdLm9wdGlvblxuXHR9KTtcbiAgfSxcblxuICBzZWxlY3RGb2N1c2VkT3B0aW9uICgpIHtcblx0Ly8gaWYgKHRoaXMucHJvcHMuYWxsb3dDcmVhdGUgJiYgIXRoaXMuc3RhdGUuZm9jdXNlZE9wdGlvbikge1xuXHQvLyBcdHJldHVybiB0aGlzLnNlbGVjdFZhbHVlKHRoaXMuc3RhdGUuaW5wdXRWYWx1ZSk7XG5cdC8vIH1cblx0aWYgKHRoaXMuX2ZvY3VzZWRPcHRpb24pIHtcblx0ICByZXR1cm4gdGhpcy5zZWxlY3RWYWx1ZSh0aGlzLl9mb2N1c2VkT3B0aW9uKTtcblx0fVxuICB9LFxuXG4gIHJlbmRlckxvYWRpbmcgKCkge1xuXHRpZiAoIXRoaXMucHJvcHMuaXNMb2FkaW5nKSByZXR1cm47XG5cdHJldHVybiAoXG5cdFx0PHNwYW4gY2xhc3NOYW1lPVwiU2VsZWN0LWxvYWRpbmctem9uZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPlxuXHRcdDxzcGFuIGNsYXNzTmFtZT1cIlNlbGVjdC1sb2FkaW5nXCIgLz5cblx0XHQ8L3NwYW4+XG4gICk7XG4gIH0sXG5cbiAgcmVuZGVyVmFsdWUgKHZhbHVlQXJyYXksIGlzT3Blbikge1xuXHRsZXQgcmVuZGVyTGFiZWwgPSB0aGlzLnByb3BzLnZhbHVlUmVuZGVyZXIgfHwgdGhpcy5nZXRPcHRpb25MYWJlbDtcblx0bGV0IFZhbHVlQ29tcG9uZW50ID0gdGhpcy5wcm9wcy52YWx1ZUNvbXBvbmVudDtcblxuXHRpZiAoIXZhbHVlQXJyYXkubGVuZ3RoKSB7XG5cdCAgcmV0dXJuICF0aGlzLnN0YXRlLmlucHV0VmFsdWUgPyA8ZGl2IGNsYXNzTmFtZT1cIlNlbGVjdC1wbGFjZWhvbGRlclwiPnt0aGlzLnByb3BzLnBsYWNlaG9sZGVyfTwvZGl2PiA6IG51bGw7XG5cdH1cblx0bGV0IG9uQ2xpY2sgPSB0aGlzLnByb3BzLm9uVmFsdWVDbGljayA/IHRoaXMuaGFuZGxlVmFsdWVDbGljayA6IG51bGw7XG5cdGlmICh0aGlzLnByb3BzLm11bHRpKSB7XG5cdCAgaWYgKHRoaXMucHJvcHMubXVsdGlUZXh0KSB7XG5cdFx0bGV0IHZhbHVlID0gdmFsdWVBcnJheS5tYXAoaSA9PiBzdHJpbmdpZnlWYWx1ZShpW3RoaXMucHJvcHMudmFsdWVLZXldKSkuam9pbignLCAnKTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PHNwYW4gY2xhc3NOYW1lPXsnU2VsZWN0LXZhbHVlLXRleHQnfT57dmFsdWV9PC9zcGFuPlxuXHRcdCk7XG5cdCAgfSBlbHNlIHtcblx0XHQgIHJldHVybiB2YWx1ZUFycmF5Lm1hcCgodmFsdWUsIGkpID0+IHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDxWYWx1ZUNvbXBvbmVudFxuXHRcdFx0XHRcdGlkPXt0aGlzLl9pbnN0YW5jZVByZWZpeCArICctdmFsdWUtJyArIGl9XG5cdFx0XHRcdFx0aW5zdGFuY2VQcmVmaXg9e3RoaXMuX2luc3RhbmNlUHJlZml4fVxuXHRcdFx0XHRcdGRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVkIHx8IHZhbHVlLmNsZWFyYWJsZVZhbHVlID09PSBmYWxzZX1cblx0XHRcdFx0XHRrZXk9e2B2YWx1ZS0ke2l9LSR7dmFsdWVbdGhpcy5wcm9wcy52YWx1ZUtleV19YH1cblx0XHRcdFx0XHRvbkNsaWNrPXtvbkNsaWNrfVxuXHRcdFx0XHRcdG9uUmVtb3ZlPXt0aGlzLnJlbW92ZVZhbHVlfVxuXHRcdFx0XHRcdHZhbHVlPXt2YWx1ZX1cblx0XHRcdFx0PlxuXHRcdFx0XHQgIHtyZW5kZXJMYWJlbCh2YWx1ZSl9XG5cdFx0XHRcdCAgPHNwYW4gY2xhc3NOYW1lPVwiU2VsZWN0LWFyaWEtb25seVwiPiZuYnNwOzwvc3Bhbj5cblx0XHRcdFx0PC9WYWx1ZUNvbXBvbmVudD5cblx0XHRcdCk7XG5cdFx0ICB9KTtcblx0ICB9XG5cblx0fSBlbHNlIGlmICghdGhpcy5zdGF0ZS5pbnB1dFZhbHVlKSB7XG5cdCAgaWYgKGlzT3Blbikgb25DbGljayA9IG51bGw7XG5cdCAgcmV0dXJuIChcblx0XHQgIDxWYWx1ZUNvbXBvbmVudFxuXHQgIGlkPXt0aGlzLl9pbnN0YW5jZVByZWZpeCArICctdmFsdWUtaXRlbSd9XG5cdCAgZGlzYWJsZWQ9e3RoaXMucHJvcHMuZGlzYWJsZWR9XG5cdCAgaW5zdGFuY2VQcmVmaXg9e3RoaXMuX2luc3RhbmNlUHJlZml4fVxuXHQgIG9uQ2xpY2s9e29uQ2xpY2t9XG5cdCAgdmFsdWU9e3ZhbHVlQXJyYXlbMF19XG5cdFx0ICA+XG5cdFx0ICB7cmVuZGVyTGFiZWwodmFsdWVBcnJheVswXSl9XG5cdDwvVmFsdWVDb21wb25lbnQ+XG5cdCk7XG5cdH1cbiAgfSxcblxuICByZW5kZXJJbnB1dCAodmFsdWVBcnJheSwgZm9jdXNlZE9wdGlvbkluZGV4KSB7XG5cdGlmICh0aGlzLnByb3BzLmlucHV0UmVuZGVyZXIpIHtcblx0ICByZXR1cm4gdGhpcy5wcm9wcy5pbnB1dFJlbmRlcmVyKCk7XG5cdH0gZWxzZSB7XG5cdCAgdmFyIGNsYXNzTmFtZSA9IGNsYXNzTmFtZXMoJ1NlbGVjdC1pbnB1dCcsIHRoaXMucHJvcHMuaW5wdXRQcm9wcy5jbGFzc05hbWUpO1xuXHQgIGNvbnN0IGlzT3BlbiA9ICEhdGhpcy5zdGF0ZS5pc09wZW47XG5cblx0ICBjb25zdCBhcmlhT3ducyA9IGNsYXNzTmFtZXMoe1xuXHRcdFt0aGlzLl9pbnN0YW5jZVByZWZpeCArICctbGlzdCddOiBpc09wZW4sXG5cdFx0W3RoaXMuX2luc3RhbmNlUHJlZml4ICsgJy1iYWNrc3BhY2UtcmVtb3ZlLW1lc3NhZ2UnXTogdGhpcy5wcm9wcy5tdWx0aVxuXHRcdCYmICF0aGlzLnByb3BzLmRpc2FibGVkXG5cdFx0JiYgdGhpcy5zdGF0ZS5pc0ZvY3VzZWRcblx0XHQmJiAhdGhpcy5zdGF0ZS5pbnB1dFZhbHVlXG5cdCAgfSk7XG5cblx0ICAvLyBUT0RPOiBDaGVjayBob3cgdGhpcyBwcm9qZWN0IGluY2x1ZGVzIE9iamVjdC5hc3NpZ24oKVxuXHQgIGNvbnN0IGlucHV0UHJvcHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLnByb3BzLmlucHV0UHJvcHMsIHtcblx0XHRyb2xlOiAnY29tYm9ib3gnLFxuXHRcdCdhcmlhLWV4cGFuZGVkJzogJycgKyBpc09wZW4sXG5cdFx0J2FyaWEtb3ducyc6IGFyaWFPd25zLFxuXHRcdCdhcmlhLWhhc3BvcHVwJzogJycgKyBpc09wZW4sXG5cdFx0J2FyaWEtYWN0aXZlZGVzY2VuZGFudCc6IGlzT3BlbiA/IHRoaXMuX2luc3RhbmNlUHJlZml4ICsgJy1vcHRpb24tJyArIGZvY3VzZWRPcHRpb25JbmRleCA6IHRoaXMuX2luc3RhbmNlUHJlZml4ICsgJy12YWx1ZScsXG5cdFx0J2FyaWEtbGFiZWxsZWRieSc6IHRoaXMucHJvcHNbJ2FyaWEtbGFiZWxsZWRieSddLFxuXHRcdCdhcmlhLWxhYmVsJzogdGhpcy5wcm9wc1snYXJpYS1sYWJlbCddLFxuXHRcdGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuXHRcdHRhYkluZGV4OiB0aGlzLnByb3BzLnRhYkluZGV4LFxuXHRcdG9uQmx1cjogdGhpcy5oYW5kbGVJbnB1dEJsdXIsXG5cdFx0b25DaGFuZ2U6IHRoaXMuaGFuZGxlSW5wdXRDaGFuZ2UsXG5cdFx0b25Gb2N1czogdGhpcy5oYW5kbGVJbnB1dEZvY3VzLFxuXHRcdHJlZjogJ2lucHV0Jyxcblx0XHRyZXF1aXJlZDogdGhpcy5zdGF0ZS5yZXF1aXJlZCxcblx0XHR2YWx1ZTogdGhpcy5zdGF0ZS5pbnB1dFZhbHVlXG5cdCAgfSk7XG5cblx0ICBpZiAodGhpcy5wcm9wcy5kaXNhYmxlZCB8fCAhdGhpcy5wcm9wcy5zZWFyY2hhYmxlKSB7XG5cdFx0Y29uc3QgZGl2UHJvcHMgPSBibGFja2xpc3QodGhpcy5wcm9wcy5pbnB1dFByb3BzLCAnaW5wdXRDbGFzc05hbWUnKTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdlxuXHRcdHsuLi5kaXZQcm9wc31cblx0XHRyb2xlPVwiY29tYm9ib3hcIlxuXHRcdGFyaWEtZXhwYW5kZWQ9e2lzT3Blbn1cblx0XHRhcmlhLW93bnM9e2lzT3BlbiA/IHRoaXMuX2luc3RhbmNlUHJlZml4ICsgJy1saXN0JyA6IHRoaXMuX2luc3RhbmNlUHJlZml4ICsgJy12YWx1ZSd9XG5cdFx0YXJpYS1hY3RpdmVkZXNjZW5kYW50PXtpc09wZW4gPyB0aGlzLl9pbnN0YW5jZVByZWZpeCArICctb3B0aW9uLScgKyBmb2N1c2VkT3B0aW9uSW5kZXggOiB0aGlzLl9pbnN0YW5jZVByZWZpeCArICctdmFsdWUnfVxuXHRcdGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuXHRcdHRhYkluZGV4PXt0aGlzLnByb3BzLnRhYkluZGV4IHx8IDB9XG5cdFx0b25CbHVyPXt0aGlzLmhhbmRsZUlucHV0Qmx1cn1cblx0XHRvbkZvY3VzPXt0aGlzLmhhbmRsZUlucHV0Rm9jdXN9XG5cdFx0cmVmPVwiaW5wdXRcIlxuXHRcdGFyaWEtcmVhZG9ubHk9eycnICsgISF0aGlzLnByb3BzLmRpc2FibGVkfVxuXHRcdHN0eWxlPXt7IGJvcmRlcjogMCwgd2lkdGg6IDAsIG1hcmdpbkxlZnQ6IDAsIGRpc3BsYXk6J2lubGluZS1ibG9jaycgfX0vPlxuXHQgICk7XG5cdCAgfVxuXG5cdCAgaWYgKHRoaXMucHJvcHMuYXV0b3NpemUpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PElucHV0IHsuLi5pbnB1dFByb3BzfSBtaW5XaWR0aD1cIjVweFwiIC8+XG5cdCAgKTtcblx0ICB9XG5cdCAgcmV0dXJuIChcblx0XHQgIDxkaXYgY2xhc3NOYW1lPXsgY2xhc3NOYW1lIH0+XG5cdFx0ICA8aW5wdXQgey4uLmlucHV0UHJvcHN9IC8+XG5cdDwvZGl2PlxuXHQpO1xuXHR9XG4gIH0sXG5cbiAgcmVuZGVyQ2xlYXIgKCkge1xuXHRpZiAoIXRoaXMucHJvcHMuY2xlYXJhYmxlIHx8ICF0aGlzLnByb3BzLnZhbHVlIHx8ICh0aGlzLnByb3BzLm11bHRpICYmICF0aGlzLnByb3BzLnZhbHVlLmxlbmd0aCkgfHwgdGhpcy5wcm9wcy5kaXNhYmxlZCB8fCB0aGlzLnByb3BzLmlzTG9hZGluZykgcmV0dXJuO1xuXHRyZXR1cm4gKFxuXHRcdDxzcGFuIGNsYXNzTmFtZT1cIlNlbGVjdC1jbGVhci16b25lXCIgdGl0bGU9e3RoaXMucHJvcHMubXVsdGkgPyB0aGlzLnByb3BzLmNsZWFyQWxsVGV4dCA6IHRoaXMucHJvcHMuY2xlYXJWYWx1ZVRleHR9XG5cdGFyaWEtbGFiZWw9e3RoaXMucHJvcHMubXVsdGkgPyB0aGlzLnByb3BzLmNsZWFyQWxsVGV4dCA6IHRoaXMucHJvcHMuY2xlYXJWYWx1ZVRleHR9XG5cdG9uTW91c2VEb3duPXt0aGlzLmNsZWFyVmFsdWV9XG5cdG9uVG91Y2hTdGFydD17dGhpcy5oYW5kbGVUb3VjaFN0YXJ0fVxuXHRvblRvdWNoTW92ZT17dGhpcy5oYW5kbGVUb3VjaE1vdmV9XG5cdG9uVG91Y2hFbmQ9e3RoaXMuaGFuZGxlVG91Y2hFbmRDbGVhclZhbHVlfVxuICA+XG4gIDxzcGFuIGNsYXNzTmFtZT1cIlNlbGVjdC1jbGVhclwiIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7IF9faHRtbDogJyZ0aW1lczsnIH19IC8+XG4gIDwvc3Bhbj5cbiAgKTtcbiAgfSxcblxuICByZW5kZXJBcnJvdyAoKSB7XG5cdHJldHVybiAoXG5cdFx0PHNwYW4gY2xhc3NOYW1lPVwiU2VsZWN0LWFycm93LXpvbmVcIiBvbk1vdXNlRG93bj17dGhpcy5oYW5kbGVNb3VzZURvd25PbkFycm93fT5cbiAgPHNwYW4gY2xhc3NOYW1lPVwiU2VsZWN0LWFycm93XCIgb25Nb3VzZURvd249e3RoaXMuaGFuZGxlTW91c2VEb3duT25BcnJvd30gLz5cbiAgPC9zcGFuPlxuICApO1xuICB9LFxuXG4gIGZpbHRlck9wdGlvbnMgKG9wdGlvbnMsIGV4Y2x1ZGVPcHRpb25zKSB7XG5cdGxldCBleGNsdWRlT3B0aW9uVmFsdWVzID0gbnVsbDtcblx0dmFyIGZpbHRlclZhbHVlID0gdGhpcy5zdGF0ZS5pbnB1dFZhbHVlO1xuXHRpZiAodHlwZW9mIHRoaXMucHJvcHMuZmlsdGVyT3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgIHJldHVybiB0aGlzLnByb3BzLmZpbHRlck9wdGlvbnMuY2FsbCh0aGlzLCBvcHRpb25zLCBmaWx0ZXJWYWx1ZSwgZXhjbHVkZU9wdGlvbnMpO1xuXHR9IGVsc2UgaWYgKHRoaXMucHJvcHMuZmlsdGVyT3B0aW9ucykge1xuXHQgIGlmICh0aGlzLnByb3BzLmlnbm9yZUFjY2VudHMpIHtcblx0XHRmaWx0ZXJWYWx1ZSA9IHN0cmlwRGlhY3JpdGljcyhmaWx0ZXJWYWx1ZSk7XG5cdCAgfVxuXHQgIGlmICh0aGlzLnByb3BzLmlnbm9yZUNhc2UpIHtcblx0XHRmaWx0ZXJWYWx1ZSA9IGZpbHRlclZhbHVlLnRvTG93ZXJDYXNlKCk7XG5cdCAgfVxuXHQgIGlmIChleGNsdWRlT3B0aW9ucykgZXhjbHVkZU9wdGlvblZhbHVlcyA9IGV4Y2x1ZGVPcHRpb25zLm1hcChpID0+IGlbdGhpcy5wcm9wcy52YWx1ZUtleV0pO1xuXHQgIGNvbnN0IGluY2x1ZGVPcHRpb24gPSAob3B0aW9uKSA9PiB7XG5cdFx0aWYgKGV4Y2x1ZGVPcHRpb25WYWx1ZXMgJiYgZXhjbHVkZU9wdGlvblZhbHVlcy5pbmRleE9mKG9wdGlvblt0aGlzLnByb3BzLnZhbHVlS2V5XSkgPiAtMSkgcmV0dXJuIGZhbHNlO1xuXHRcdGlmICh0aGlzLnByb3BzLmZpbHRlck9wdGlvbikgcmV0dXJuIHRoaXMucHJvcHMuZmlsdGVyT3B0aW9uLmNhbGwodGhpcywgb3B0aW9uLCBmaWx0ZXJWYWx1ZSk7XG5cdFx0aWYgKCFmaWx0ZXJWYWx1ZSkgcmV0dXJuIHRydWU7XG5cdFx0dmFyIHZhbHVlVGVzdCA9IFN0cmluZyhvcHRpb25bdGhpcy5wcm9wcy52YWx1ZUtleV0pO1xuXHRcdHZhciBsYWJlbFRlc3QgPSBTdHJpbmcob3B0aW9uW3RoaXMucHJvcHMubGFiZWxLZXldKTtcblx0XHRpZiAodGhpcy5wcm9wcy5pZ25vcmVBY2NlbnRzKSB7XG5cdFx0ICBpZiAodGhpcy5wcm9wcy5tYXRjaFByb3AgIT09ICdsYWJlbCcpIHZhbHVlVGVzdCA9IHN0cmlwRGlhY3JpdGljcyh2YWx1ZVRlc3QpO1xuXHRcdCAgaWYgKHRoaXMucHJvcHMubWF0Y2hQcm9wICE9PSAndmFsdWUnKSBsYWJlbFRlc3QgPSBzdHJpcERpYWNyaXRpY3MobGFiZWxUZXN0KTtcblx0XHR9XG5cdFx0aWYgKHRoaXMucHJvcHMuaWdub3JlQ2FzZSkge1xuXHRcdCAgaWYgKHRoaXMucHJvcHMubWF0Y2hQcm9wICE9PSAnbGFiZWwnKSB2YWx1ZVRlc3QgPSB2YWx1ZVRlc3QudG9Mb3dlckNhc2UoKTtcblx0XHQgIGlmICh0aGlzLnByb3BzLm1hdGNoUHJvcCAhPT0gJ3ZhbHVlJykgbGFiZWxUZXN0ID0gbGFiZWxUZXN0LnRvTG93ZXJDYXNlKCk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnByb3BzLm1hdGNoUG9zID09PSAnc3RhcnQnID8gKFxuXHRcdFx0KHRoaXMucHJvcHMubWF0Y2hQcm9wICE9PSAnbGFiZWwnICYmIHZhbHVlVGVzdC5zdWJzdHIoMCwgZmlsdGVyVmFsdWUubGVuZ3RoKSA9PT0gZmlsdGVyVmFsdWUpIHx8XG5cdFx0XHQodGhpcy5wcm9wcy5tYXRjaFByb3AgIT09ICd2YWx1ZScgJiYgbGFiZWxUZXN0LnN1YnN0cigwLCBmaWx0ZXJWYWx1ZS5sZW5ndGgpID09PSBmaWx0ZXJWYWx1ZSlcblx0XHQpIDogKFxuXHRcdFx0KHRoaXMucHJvcHMubWF0Y2hQcm9wICE9PSAnbGFiZWwnICYmIHZhbHVlVGVzdC5pbmRleE9mKGZpbHRlclZhbHVlKSA+PSAwKSB8fFxuXHRcdFx0KHRoaXMucHJvcHMubWF0Y2hQcm9wICE9PSAndmFsdWUnICYmIGxhYmVsVGVzdC5pbmRleE9mKGZpbHRlclZhbHVlKSA+PSAwKVxuXHRcdCk7XG5cdCAgfTtcblx0ICBsZXQgZmlsdGVyZWRPcHRpb25zID0gW107XG5cdCAgb3B0aW9ucy5mb3JFYWNoKChvcHRpb24pID0+IHtcblx0XHRpZiAodGhpcy5pc0dyb3VwKG9wdGlvbikpIHtcblx0XHRjb25zdCBmaWx0ZXJlZEdyb3VwID0gY2xvbmUob3B0aW9uKTtcblx0XHRmaWx0ZXJlZEdyb3VwLm9wdGlvbnMgPSB0aGlzLmZpbHRlck9wdGlvbnMob3B0aW9uLm9wdGlvbnMsIGV4Y2x1ZGVPcHRpb25zKTtcblx0XHRpZiAoZmlsdGVyZWRHcm91cC5vcHRpb25zLmxlbmd0aCkge1xuXHRcdCAgZmlsdGVyZWRPcHRpb25zLnB1c2goZmlsdGVyZWRHcm91cCk7XG5cdFx0fTtcblx0ICB9IGVsc2UgaWYgKGluY2x1ZGVPcHRpb24ob3B0aW9uKSkge1xuXHRcdGZpbHRlcmVkT3B0aW9ucy5wdXNoKG9wdGlvbik7XG5cdCAgfTtcblx0fSk7XG5cdCAgcmV0dXJuIGZpbHRlcmVkT3B0aW9ucztcblx0fSBlbHNlIHtcblx0ICByZXR1cm4gb3B0aW9ucztcblx0fVxuICB9LFxuXG4gIGlzR3JvdXAgKG9wdGlvbikge1xuXHRyZXR1cm4gb3B0aW9uICYmIEFycmF5LmlzQXJyYXkob3B0aW9uLm9wdGlvbnMpO1xuICB9LFxuXG4gIGZsYXR0ZW5PcHRpb25zIChvcHRpb25zKSB7XG5cdGlmICghb3B0aW9ucykgcmV0dXJuO1xuXHRsZXQgZmxhdE9wdGlvbnMgPSBbXTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBvcHRpb25zLmxlbmd0aDsgaSArKykge1xuXHQgIGlmICh0aGlzLmlzR3JvdXAob3B0aW9uc1tpXSkpIHtcblx0XHRmbGF0T3B0aW9ucyA9IGZsYXRPcHRpb25zLmNvbmNhdCh0aGlzLmZsYXR0ZW5PcHRpb25zKG9wdGlvbnNbaV0ub3B0aW9ucykpO1xuXHQgIH0gZWxzZSB7XG5cdFx0ZmxhdE9wdGlvbnMucHVzaChvcHRpb25zW2ldKTtcblx0ICB9XG5cdH1cblx0cmV0dXJuIGZsYXRPcHRpb25zO1xuICB9LFxuXG4gIHJlbmRlck1lbnUgKG9wdGlvbnMsIHZhbHVlQXJyYXksIGZvY3VzZWRPcHRpb24pIHtcblx0aWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5sZW5ndGgpIHtcblx0ICBpZiAodGhpcy5wcm9wcy5tZW51UmVuZGVyZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5wcm9wcy5tZW51UmVuZGVyZXIoe1xuXHRcdCAgZm9jdXNlZE9wdGlvbixcblx0XHQgIGZvY3VzT3B0aW9uOiB0aGlzLmZvY3VzT3B0aW9uLFxuXHRcdCAgbGFiZWxLZXk6IHRoaXMucHJvcHMubGFiZWxLZXksXG5cdFx0ICBvcHRpb25zLFxuXHRcdCAgc2VsZWN0VmFsdWU6IHRoaXMuc2VsZWN0VmFsdWUsXG5cdFx0ICB2YWx1ZUFycmF5LFxuXHRcdH0pO1xuXHQgIH0gZWxzZSB7XG5cdFx0bGV0IE9wdGlvbkdyb3VwID0gdGhpcy5wcm9wcy5vcHRpb25Hcm91cENvbXBvbmVudDtcblx0XHRsZXQgT3B0aW9uID0gdGhpcy5wcm9wcy5vcHRpb25Db21wb25lbnQ7XG5cdFx0bGV0IHJlbmRlckxhYmVsID0gdGhpcy5wcm9wcy5vcHRpb25SZW5kZXJlciB8fCB0aGlzLmdldE9wdGlvbkxhYmVsO1xuXG5cdFx0cmV0dXJuIG9wdGlvbnMubWFwKChvcHRpb24sIGkpID0+IHtcblx0XHRcdCAgaWYgKHRoaXMuaXNHcm91cChvcHRpb24pKSB7XG5cdFx0ICBsZXQgb3B0aW9uR3JvdXBDbGFzcyA9IGNsYXNzTmFtZXMoe1xuXHRcdFx0J1NlbGVjdC1vcHRpb24tZ3JvdXAnOiB0cnVlLFxuXHRcdCAgfSk7XG5cblx0XHQgIHJldHVybiAoXG5cdFx0XHQgIDxPcHRpb25Hcm91cFxuXHRcdCAgY2xhc3NOYW1lPXtvcHRpb25Hcm91cENsYXNzfVxuXHRcdCAga2V5PXtgb3B0aW9uLWdyb3VwLSR7aX1gfVxuXHRcdCAgbGFiZWw9e3JlbmRlckxhYmVsKG9wdGlvbil9XG5cdFx0ICBvcHRpb249e29wdGlvbn1cblx0XHRcdCAgPlxuXHRcdFx0ICB7dGhpcy5yZW5kZXJNZW51KG9wdGlvbi5vcHRpb25zLCB2YWx1ZUFycmF5LCBmb2N1c2VkT3B0aW9uKX1cblx0XHQ8L09wdGlvbkdyb3VwPlxuXHRcdCk7XG5cdFx0fSBlbHNlIHtcblx0XHQgIGxldCBpc1NlbGVjdGVkID0gdmFsdWVBcnJheSAmJiB2YWx1ZUFycmF5LmluZGV4T2Yob3B0aW9uKSA+IC0xO1xuXHRcdCAgbGV0IGlzRm9jdXNlZCA9IG9wdGlvbiA9PT0gZm9jdXNlZE9wdGlvbjtcblx0XHQgIGxldCBvcHRpb25SZWYgPSBpc0ZvY3VzZWQgPyAnZm9jdXNlZCcgOiBudWxsO1xuXHRcdCAgbGV0IG9wdGlvbkNsYXNzID0gY2xhc3NOYW1lcyh0aGlzLnByb3BzLm9wdGlvbkNsYXNzTmFtZSwge1xuXHRcdFx0J1NlbGVjdC1vcHRpb24nOiB0cnVlLFxuXHRcdFx0J2lzLXNlbGVjdGVkJzogaXNTZWxlY3RlZCxcblx0XHRcdCdpcy1mb2N1c2VkJzogaXNGb2N1c2VkLFxuXHRcdFx0J2lzLWRpc2FibGVkJzogb3B0aW9uLmRpc2FibGVkLFxuXHRcdCAgfSk7XG5cblx0XHQgIHJldHVybiAoXG5cdFx0XHQgIDxPcHRpb25cblx0XHQgIGluc3RhbmNlUHJlZml4PXt0aGlzLl9pbnN0YW5jZVByZWZpeH1cblx0XHQgIG9wdGlvbkluZGV4PXtpfVxuXHRcdCAgY2xhc3NOYW1lPXtvcHRpb25DbGFzc31cblx0XHQgIGlzRGlzYWJsZWQ9e29wdGlvbi5kaXNhYmxlZH1cblx0XHQgIGlzRm9jdXNlZD17aXNGb2N1c2VkfVxuXHRcdCAga2V5PXtgb3B0aW9uLSR7aX0tJHtvcHRpb25bdGhpcy5wcm9wcy52YWx1ZUtleV19YH1cblx0XHQgIG9uU2VsZWN0PXt0aGlzLnNlbGVjdFZhbHVlfVxuXHRcdCAgb25Gb2N1cz17dGhpcy5mb2N1c09wdGlvbn1cblx0XHQgIG9wdGlvbj17b3B0aW9ufVxuXHRcdCAgaXNTZWxlY3RlZD17aXNTZWxlY3RlZH1cblx0XHQgIHJlZj17b3B0aW9uUmVmfVxuXHRcdCAgc2hvd0NoZWNrZWRJY29uPXt0aGlzLnByb3BzLm11bHRpICYmICF0aGlzLnByb3BzLnJlbW92ZU9wdGlvbnN9XG5cdFx0PlxuXHRcdCAge3JlbmRlckxhYmVsKG9wdGlvbil9XG5cdFx0PC9PcHRpb24+XG5cdFx0KTtcblx0XHR9XG5cdCAgfSk7XG5cdCAgfVxuXHR9IGVsc2UgaWYgKHRoaXMucHJvcHMubm9SZXN1bHRzVGV4dCkge1xuXHQgIHJldHVybiAoXG5cdFx0ICA8ZGl2IGNsYXNzTmFtZT1cIlNlbGVjdC1ub3Jlc3VsdHNcIj5cblx0XHQgIHt0aGlzLnByb3BzLm5vUmVzdWx0c1RleHR9XG5cdDwvZGl2PlxuXHQpO1xuXHR9IGVsc2Uge1xuXHQgIHJldHVybiBudWxsO1xuXHR9XG4gIH0sXG5cbiAgcmVuZGVySGlkZGVuRmllbGQgKHZhbHVlQXJyYXkpIHtcblx0aWYgKCF0aGlzLnByb3BzLm5hbWUpIHJldHVybjtcblx0aWYgKHRoaXMucHJvcHMuam9pblZhbHVlcykge1xuXHQgIGxldCB2YWx1ZSA9IHZhbHVlQXJyYXkubWFwKGkgPT4gc3RyaW5naWZ5VmFsdWUoaVt0aGlzLnByb3BzLnZhbHVlS2V5XSkpLmpvaW4odGhpcy5wcm9wcy5kZWxpbWl0ZXIpO1xuXHQgIHJldHVybiAoXG5cdFx0ICA8aW5wdXRcblx0ICB0eXBlPVwiaGlkZGVuXCJcblx0ICByZWY9XCJ2YWx1ZVwiXG5cdCAgbmFtZT17dGhpcy5wcm9wcy5uYW1lfVxuXHQgIHZhbHVlPXt2YWx1ZX1cblx0ICBkaXNhYmxlZD17dGhpcy5wcm9wcy5kaXNhYmxlZH0gLz5cblx0KTtcblx0fVxuXHRyZXR1cm4gdmFsdWVBcnJheS5tYXAoKGl0ZW0sIGluZGV4KSA9PiAoXG5cdFx0PGlucHV0IGtleT17J2hpZGRlbi4nICsgaW5kZXh9XG5cdHR5cGU9XCJoaWRkZW5cIlxuXHRyZWY9eyd2YWx1ZScgKyBpbmRleH1cblx0bmFtZT17dGhpcy5wcm9wcy5uYW1lfVxuXHR2YWx1ZT17c3RyaW5naWZ5VmFsdWUoaXRlbVt0aGlzLnByb3BzLnZhbHVlS2V5XSl9XG5cdGRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVkfSAvPlxuICApKTtcbiAgfSxcblxuICBnZXRGb2N1c2FibGVPcHRpb25JbmRleCAoc2VsZWN0ZWRPcHRpb24pIHtcblx0dmFyIG9wdGlvbnMgPSB0aGlzLl92aXNpYmxlT3B0aW9ucztcblx0aWYgKCFvcHRpb25zLmxlbmd0aCkgcmV0dXJuIG51bGw7XG5cblx0bGV0IGZvY3VzZWRPcHRpb24gPSB0aGlzLnN0YXRlLmZvY3VzZWRPcHRpb24gfHwgc2VsZWN0ZWRPcHRpb247XG5cdGlmIChmb2N1c2VkT3B0aW9uICYmICFmb2N1c2VkT3B0aW9uLmRpc2FibGVkKSB7XG5cdCAgY29uc3QgZm9jdXNlZE9wdGlvbkluZGV4ID0gb3B0aW9ucy5pbmRleE9mKGZvY3VzZWRPcHRpb24pO1xuXHQgIGlmIChmb2N1c2VkT3B0aW9uSW5kZXggIT09IC0xKSB7XG5cdFx0cmV0dXJuIGZvY3VzZWRPcHRpb25JbmRleDtcblx0ICB9XG5cdH1cblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMubGVuZ3RoOyBpKyspIHtcblx0ICBpZiAoIW9wdGlvbnNbaV0uZGlzYWJsZWQpIHJldHVybiBpO1xuXHR9XG5cdHJldHVybiBudWxsO1xuICB9LFxuXG4gIHJlbmRlck91dGVyIChvcHRpb25zLCB2YWx1ZUFycmF5LCBmb2N1c2VkT3B0aW9uKSB7XG5cdGxldCBEcm9wZG93biA9IHRoaXMucHJvcHMuZHJvcGRvd25Db21wb25lbnQ7XG5cdGxldCBtZW51ID0gdGhpcy5yZW5kZXJNZW51KG9wdGlvbnMsIHZhbHVlQXJyYXksIGZvY3VzZWRPcHRpb24pO1xuXHRpZiAoIW1lbnUpIHtcblx0ICByZXR1cm4gbnVsbDtcblx0fVxuXG5cdHJldHVybiAoXG5cdFx0PERyb3Bkb3duPlxuXHRcdDxkaXYgcmVmPVwibWVudUNvbnRhaW5lclwiIGNsYXNzTmFtZT1cIlNlbGVjdC1tZW51LW91dGVyIGJhbFwiIHN0eWxlPXt0aGlzLnByb3BzLm1lbnVDb250YWluZXJTdHlsZX0+XG4gIDxkaXYgcmVmPVwibWVudVwiIHJvbGU9XCJsaXN0Ym94XCIgY2xhc3NOYW1lPVwiU2VsZWN0LW1lbnVcIiBpZD17dGhpcy5faW5zdGFuY2VQcmVmaXggKyAnLWxpc3QnfVxuXHRzdHlsZT17dGhpcy5wcm9wcy5tZW51U3R5bGV9XG5cdG9uU2Nyb2xsPXt0aGlzLmhhbmRsZU1lbnVTY3JvbGx9XG5cdG9uTW91c2VEb3duPXt0aGlzLmhhbmRsZU1vdXNlRG93bk9uTWVudX0+XG5cdHttZW51fVxuICA8L2Rpdj5cblx0PC9kaXY+XG5cdDwvRHJvcGRvd24+XG4gICk7XG4gIH0sXG5cbiAgcmVuZGVyICgpIHtcblx0bGV0IHZhbHVlQXJyYXkgPSB0aGlzLmdldFZhbHVlQXJyYXkodGhpcy5wcm9wcy52YWx1ZSk7XG5cdGxldCBleGNsdWRlT3B0aW9ucyA9IHRoaXMucHJvcHMubXVsdGkgPyB2YWx1ZUFycmF5IDogbnVsbDtcblx0aWYgKHRoaXMucHJvcHMubXVsdGkgJiYgIXRoaXMucHJvcHMucmVtb3ZlT3B0aW9ucykge1xuXHQgIGV4Y2x1ZGVPcHRpb25zID0gbnVsbDtcblx0fVxuXHRsZXQgb3B0aW9ucyA9IHRoaXMuZmlsdGVyT3B0aW9ucyh0aGlzLnByb3BzLm9wdGlvbnMgfHwgW10sIGV4Y2x1ZGVPcHRpb25zKTtcblx0dGhpcy5fdmlzaWJsZU9wdGlvbnMgPSB0aGlzLmZsYXR0ZW5PcHRpb25zKG9wdGlvbnMpO1xuXHRsZXQgaXNPcGVuID0gdHlwZW9mIHRoaXMucHJvcHMuaXNPcGVuID09PSAnYm9vbGVhbicgPyB0aGlzLnByb3BzLmlzT3BlbiA6IHRoaXMuc3RhdGUuaXNPcGVuO1xuXHRpZiAodGhpcy5wcm9wcy5tdWx0aSAmJiAhb3B0aW9ucy5sZW5ndGggJiYgdmFsdWVBcnJheS5sZW5ndGggJiYgIXRoaXMuc3RhdGUuaW5wdXRWYWx1ZSkgaXNPcGVuID0gZmFsc2U7XG5cdGNvbnN0IGZvY3VzZWRPcHRpb25JbmRleCA9IHRoaXMuZ2V0Rm9jdXNhYmxlT3B0aW9uSW5kZXgodmFsdWVBcnJheVswXSk7XG5cblx0bGV0IGZvY3VzZWRPcHRpb24gPSBudWxsO1xuXHRpZiAoZm9jdXNlZE9wdGlvbkluZGV4ICE9PSBudWxsKSB7XG5cdCAgZm9jdXNlZE9wdGlvbiA9IHRoaXMuX2ZvY3VzZWRPcHRpb24gPSB0aGlzLl92aXNpYmxlT3B0aW9uc1tmb2N1c2VkT3B0aW9uSW5kZXhdO1xuXHR9IGVsc2Uge1xuXHQgIGZvY3VzZWRPcHRpb24gPSB0aGlzLl9mb2N1c2VkT3B0aW9uID0gbnVsbDtcblx0fVxuXHRsZXQgY2xhc3NOYW1lID0gY2xhc3NOYW1lcygnU2VsZWN0JywgdGhpcy5wcm9wcy5jbGFzc05hbWUsIHtcblx0ICAnU2VsZWN0LS1tdWx0aSc6IHRoaXMucHJvcHMubXVsdGksXG5cdCAgJ1NlbGVjdC0tbXVsdGlUZXh0JzogdGhpcy5wcm9wcy5tdWx0aVRleHQsXG5cdCAgJ1NlbGVjdC0tc2luZ2xlJzogIXRoaXMucHJvcHMubXVsdGksXG5cdCAgJ2lzLWRpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZCxcblx0ICAnaXMtZm9jdXNlZCc6IHRoaXMuc3RhdGUuaXNGb2N1c2VkLFxuXHQgICdpcy1sb2FkaW5nJzogdGhpcy5wcm9wcy5pc0xvYWRpbmcsXG5cdCAgJ2lzLW9wZW4nOiBpc09wZW4sXG5cdCAgJ2lzLXBzZXVkby1mb2N1c2VkJzogdGhpcy5zdGF0ZS5pc1BzZXVkb0ZvY3VzZWQsXG5cdCAgJ2lzLXNlYXJjaGFibGUnOiB0aGlzLnByb3BzLnNlYXJjaGFibGUsXG5cdCAgJ2hhcy12YWx1ZSc6IHZhbHVlQXJyYXkubGVuZ3RoLFxuXHR9KTtcblxuXHRsZXQgcmVtb3ZlTWVzc2FnZSA9IG51bGw7XG5cdGxldCBvdXRlclZhbHVlQXJyYXkgPSAhdGhpcy5wcm9wcy5tdWx0aSA/IHZhbHVlQXJyYXkgOiBudWxsO1xuXHRpZiAodGhpcy5wcm9wcy5tdWx0aSAmJiAhdGhpcy5wcm9wcy5yZW1vdmVPcHRpb25zKSB7XG5cdCAgb3V0ZXJWYWx1ZUFycmF5ID0gdmFsdWVBcnJheTtcblx0fVxuXHRpZiAodGhpcy5wcm9wcy5tdWx0aSAmJlxuXHRcdCF0aGlzLnByb3BzLmRpc2FibGVkICYmXG5cdFx0dmFsdWVBcnJheS5sZW5ndGggJiZcblx0XHQhdGhpcy5zdGF0ZS5pbnB1dFZhbHVlICYmXG5cdFx0dGhpcy5zdGF0ZS5pc0ZvY3VzZWQgJiZcblx0XHR0aGlzLnByb3BzLmJhY2tzcGFjZVJlbW92ZXMpIHtcblx0ICByZW1vdmVNZXNzYWdlID0gKFxuXHRcdCAgPHNwYW4gaWQ9e3RoaXMuX2luc3RhbmNlUHJlZml4ICsgJy1iYWNrc3BhY2UtcmVtb3ZlLW1lc3NhZ2UnfSBjbGFzc05hbWU9XCJTZWxlY3QtYXJpYS1vbmx5XCIgYXJpYS1saXZlPVwiYXNzZXJ0aXZlXCI+XG5cdFx0ICB7dGhpcy5wcm9wcy5iYWNrc3BhY2VUb1JlbW92ZU1lc3NhZ2UucmVwbGFjZSgne2xhYmVsfScsIHZhbHVlQXJyYXlbdmFsdWVBcnJheS5sZW5ndGggLSAxXVt0aGlzLnByb3BzLmxhYmVsS2V5XSl9XG5cdDwvc3Bhbj5cblx0KTtcblx0fVxuXG5cdHJldHVybiAoXG5cdFx0PGRpdiByZWY9XCJ3cmFwcGVyXCJcblx0Y2xhc3NOYW1lPXtjbGFzc05hbWV9XG5cdHN0eWxlPXt0aGlzLnByb3BzLndyYXBwZXJTdHlsZX0+XG5cdHt0aGlzLnJlbmRlckhpZGRlbkZpZWxkKHZhbHVlQXJyYXkpfVxuICA8ZGl2IHJlZj1cImNvbnRyb2xcIlxuXHRjbGFzc05hbWU9XCJTZWxlY3QtY29udHJvbFwiXG5cdHN0eWxlPXt0aGlzLnByb3BzLnN0eWxlfVxuXHRvbktleURvd249e3RoaXMuaGFuZGxlS2V5RG93bn1cblx0b25Nb3VzZURvd249e3RoaXMuaGFuZGxlTW91c2VEb3dufVxuXHRvblRvdWNoRW5kPXt0aGlzLmhhbmRsZVRvdWNoRW5kfVxuXHRvblRvdWNoU3RhcnQ9e3RoaXMuaGFuZGxlVG91Y2hTdGFydH1cblx0b25Ub3VjaE1vdmU9e3RoaXMuaGFuZGxlVG91Y2hNb3ZlfVxuICA+XG4gIDxzcGFuIGNsYXNzTmFtZT1cIlNlbGVjdC1tdWx0aS12YWx1ZS13cmFwcGVyXCIgaWQ9e3RoaXMuX2luc3RhbmNlUHJlZml4ICsgJy12YWx1ZSd9PlxuXHR7dGhpcy5yZW5kZXJWYWx1ZSh2YWx1ZUFycmF5LCBpc09wZW4pfVxuXHR7dGhpcy5yZW5kZXJJbnB1dCh2YWx1ZUFycmF5LCBmb2N1c2VkT3B0aW9uSW5kZXgpfVxuICA8L3NwYW4+XG5cdHtyZW1vdmVNZXNzYWdlfVxuXHR7dGhpcy5yZW5kZXJMb2FkaW5nKCl9XG5cdHt0aGlzLnJlbmRlckNsZWFyKCl9XG5cdHt0aGlzLnJlbmRlckFycm93KCl9XG4gIDwvZGl2PlxuXHR7aXNPcGVuID8gdGhpcy5yZW5kZXJPdXRlcihvcHRpb25zLCBvdXRlclZhbHVlQXJyYXksIGZvY3VzZWRPcHRpb24pIDogbnVsbH1cblx0XHQ8L2Rpdj5cbiAgKTtcbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgU2VsZWN0O1xuIl19
