/**
 * [augmented-keccak256]{@link https://github.com/CoinFabrik/augmented-keccak256}
 * Based on [js-sha3]{@link https://github.com/emn178/js-sha3}
 *
 * @version 1.0.0
 * @author Hernán Di Pietro and Mauro Leggieri
 * @copyright CoinFabrik, 2018
 * @license MIT
 */
const keccak256 = require('js-sha3').keccak256;
const BN = require('bn.js');
var utf8 = require('utf8');

(function () {
	'use strict';

	function Keccak256() {
		var hash = keccak256.create();
		var _that = this;

		//public methods
		this.update = function (value, _type) {
			if (typeof _type !== 'undefined') {
				//the user provided an object/string of type(s) that defines data types
				if (typeof _type === 'object') {
					if (Object.prototype.toString.call(value) === '[object Array]') {
						if (Object.prototype.toString.call(_type) !== '[object Array]' || value.length != _type.length) {
							throw new Error("Invalid or mismatch types array");
						}
						for (var i = 0; i < value.length; i++) {
							_that.update(value[i], _type[i]);
						}
					}
					else if (is_bn(value)) {
						_doUpdate(value, _type);
					}
					else {
						for (var prop in value) {
							_that.update(value[prop], _type[prop]);
						}
					}
				}
				else {
					if ((!_type) || _type === 'auto') {
						_that.update(value);
					}
					else if (typeof _type === 'string') {
						if (_type == 'string') {
							_doUpdate(value, 'string');
						}
						else if (_type == 'hex') {
							if (value.substr(0, 2).toLocaleLowerCase() == '0x') {
								value = value.substr(2);
							}
							_doUpdate(reverse_hexstr(value), 'hex');
						}
						else {
							_doUpdate(value, _type);
						}
					}
					else {
						throw new Error("Unsupported type");
					}
				}
			}
			else {
				if (typeof value === 'object') {
					if (Object.prototype.toString.call(value) === '[object Array]') {
						for (var i = 0; i < value.length; i++) {
							_that.update(value[i]);
						}
					}
					else if (is_bn(value)) {
						_doUpdate(value, 'int256');
					}
					else if (typeof value.type === 'string' && typeof value.data !== 'undefined') {
						_doUpdate(value.data, value.type);
					}
					else {
						for (var prop in value) {
							_that.update(value[prop]);
						}
					}
				}
				else if (typeof value === 'string') {
					if (value.substr(0, 2).toLocaleLowerCase() == '0x') {
						value = reverse_hexstr(value.substr(2));
						_doUpdate(value, 'hex');
					}
					else {
						_doUpdate(value, 'string');
					}
				}
				else if (typeof value === 'number') {
					_doUpdate(value, 'number');
				}
				else if (typeof value === 'boolean') {
					_doUpdate(value ? 1 : 0, 'uint8');
				}
				else {
					throw new Error("Unsupported type");
				}
			}
		};

		this.digest = function() {
			return hash.hex();
		};

		this.digestAsArray = function() {
			return hexstr_to_array(hash.hex());
		};

		//private methods
		var _doUpdate = function(value, _type) {
			if (_type == 'string') {
				//do some convenient type conversion first
				if (is_bn(value)) {
					value = a.toString(base);
				}
				else if (typeof value !== 'string') {
					value = value.toString();
				}
				//convert string to UTF-8 and then to hex
				if (value.length > 0) {
					hash.update(utf8str_to_array(value));
				}
			}
			else if (_type == 'hex') {
				//do some convenient type conversion first
				if (typeof value !== 'string') {
					value = value.toString();
				}
				//NOTE: hex value is in little-endian format
				if (value.length > 0) {
					hash.update(hexstr_to_array(value));
				}
			}
			else if (_type == 'number') {
				//do some convenient type conversion first
				if (typeof value === 'boolean') {
					value = (value) ? 1 : 0;
				}
				else if (typeof value === 'string') {
					value = parseFloat(value);
				}
				//convert number to Big Number if needed
				if (typeof value === 'number') {
					value = new BN(value);
				}
				else if (!is_bn(value)) {
					throw new Error("Not a BigNumber");
				}
				//update
				_doUpdate(value, 'int256');
			}
			else if (_type.substr(0, 4) == 'uint') {
				//get target size
				var size = get_uint_int_size(_type.substr(4));
				//do some convenient type conversion first
				if (typeof value === 'boolean') {
					value = (value) ? 1 : 0;
				}
				else if (typeof value === 'string') {
					value = parseFloat(value);
				}
				//convert number to Big Number if needed
				if (typeof value === 'number') {
					value = new BN(value);
				}
				else if (!is_bn(value)) {
					throw new Error("Not a BigNumber");
				}
				if (value.isNeg()) {
					throw new Error("Type 'uint' cannot be negative");
				}
				//convert to hex
				value = value.toString(16);
				if (value.length & 1) {
					value = "0" + value;
				}
				value = reverse_hexstr(value);
				//truncate trailing zeros
				value = value.replace(/0+$/, '');
				//check if the hexa number fits into destination size
				if (value.length > size / 4) {
					throw new Error("Overflow");
				}
				//complete the string with zeros at the right
				value += string_repeat("0", size / 4 - value.length);
				//update
				_doUpdate(value, 'hex');
			}
			else if (_type.substr(0, 3) == 'int') {
				var isNeg;

				//get target size
				var size = get_uint_int_size(_type.substr(3));
				//do some convenient type conversion first
				if (typeof value === 'boolean') {
					value = (value) ? 1 : 0;
				}
				else if (typeof value === 'string') {
					value = parseFloat(value);
				}
				//convert number to Big Number if needed
				if (typeof value === 'number') {
					value = new BN(value);
				}
				else if (!is_bn(value)) {
					throw new Error("Not a BigNumber");
				}
				isNeg = value.isNeg();
				if (isNeg) {
					value = value.toTwos(256);
				}
				//convert to hex
				value = value.toString(16);
				if (value.length & 1) {
					if (!isNeg) {
						value = "0" + value;
					}
					else {
						value = "F" + value;
					}
				}
				value = reverse_hexstr(value).toLocaleLowerCase();
				//process depending on sign
				if (!isNeg) {
					//truncate trailing zeros
					value = value.replace(/0+$/, '');
					//check if the hexa number fits into destination size
					if (value.length > size / 4) {
						throw new Error("Overflow");
					}
					//complete the string with zeros at the right
					value += string_repeat("0", size / 4 - value.length);
				}
				else {
					//truncate trailing "F"s
					value = value.replace(/f+$/, '');
					//check if the hexa number fits into destination size
					if (value.length > size / 4) {
						throw new Error("Overflow");
					}
					//complete the string with "F"s at the right
					value += string_repeat("f", size / 4 - value.length);
				}
				//update
				_doUpdate(value, 'hex');
			}
			else {
				throw new Error("Unsupported type");
			}
		};
	}

	//check if the object is a bn.js' BigNumber
	var is_bn = function (object) {
		return object instanceof BN || (object && object.constructor && object.constructor.name === 'BN');
	}

	//convert a string to an array of bytes containing the UTF-8 representation of it
	var utf8str_to_array = function (str) {
		str = utf8.encode(str);
		str = str.replace(/^(?:\u0000)*/,'');
		str = str.split("").reverse().join("");
		str = str.replace(/^(?:\u0000)*/,'');
		str = str.split("").reverse().join("");

		var result = [];
		for (var i = 0; i < str.length; i++) {
			result.push(str.charCodeAt(i));
		}
		return result;
	}

	//calculate the target size of an uint/int variable
	var get_uint_int_size = function (str) {
		var _size;

		if (str.length == 0)
			return 256;

		if (/^\d+$/.test(str) == false) {
			throw new Error("Unsupported type"); 
		}

		try {
			_size = parseInt(str);
		}
		catch (e) {
			throw new Error("Unsupported type"); 
		}
		if (_size < 8 || _size > 256 || (_size % 8) != 0)
			throw new Error("Unsupported type"); 
		return _size;
	}

	//return the "pattern" string repeated "count" times
	var string_repeat = function (pattern, count) {
		if (count < 1)
			return '';
		var result = '';
		while (count > 1) {
			if (count & 1) {
				result += pattern;
			}
			count >>>= 1;
			pattern += pattern;
		}
		return result + pattern;
	}

	//convert a string containing hexadecimal numbers to an array of bytes
	var hexstr_to_array = function (str) { 
		var result = [];

		if (str.length & 1) {
			throw new Error("Invalid hexadecimal string"); 
		}
		if (!(/^[0-9A-F]*$/i.test(str))) {
			throw new Error("Invalid hexadecimal string"); 
		}
		for (var i = 0; i < str.length; i += 2) { 
			result.push(parseInt(str.substr(i, 2), 16));
		}
		return result;
	}

	//reverses the endianness of an hexadecimal string
	var reverse_hexstr = function (str) { 
		if (str.length & 1) {
			throw new Error("Invalid hexadecimal string"); 
		}
		if (!(/^[0-9A-F]*$/i.test(str))) {
			throw new Error("Invalid hexadecimal string"); 
		}
		var result = [];
		for (var i = 0; i < str.length; i += 2) { 
			result.push(str.substr(str.length - i - 2, 2));
		}
		return result.join('');
	}

	//----------------

	var methods = {
		create: function () {
			return new Keccak256();
		}
	};

	if (typeof module === 'object' && module.exports) {
		module.exports = methods;
	}
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return methods;
		});
	}
})();
