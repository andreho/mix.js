/**
 * Created by A.Hofmann on 23.02.2015.
 */
mix.declare("mix.Utils", ["mix.Constants"], function(Constants)
{
	"use strict";
	var iterableSymbol = (window.Symbol && (typeof window.Symbol.iterator) === "symbol") ? window.Symbol.iterator : "@@iterator";
	var objectToString = Object.prototype.toString;
	var Utils = {
		noop: function noop()
		{
			return undefined;
		},
		read: function read(src, path)
		{
			if(!Utils.isValid(src))
			{
				return undefined;
			}
			if(arguments.length == 2)
			{
				if(Utils.isString(path))
				{
					path = path.split(".");
				}
			}
			else if(arguments.length > 2)
			{
				path = Utils.wrapArguments(arguments, 1);
			}
			var name, current = src;
			for(var i = 0, len = path.length; i < len; i++)
			{
				name = path[i];
				if(Utils.isInvalid(current))
				{
					return undefined;
				}
				current = current[name];
			}
			return current;
		},
		binarySearch: function binarySearch(arr, from, to, key, comparator)
		{
			var low = from, high = to - 1, mid, midVal, cmp;
			if(comparator)
			{
				while(low <= high)
				{
					mid = (low + high) >>> 1;
					midVal = arr[mid];
					cmp = comparator(midVal, key);
					if(cmp < 0)
					{
						low = mid + 1;
					}
					else if(cmp > 0)
					{
						high = mid - 1;
					}
					else
					{
						return mid;
					} // key found
				}
			}
			else
			{
				while(low <= high)
				{
					mid = (low + high) >>> 1;
					midVal = arr[mid];
					if(midVal < key)
					{
						low = mid + 1;
					}
					else if(midVal > key)
					{
						high = mid - 1;
					}
					else
					{
						return mid;
					} // key found
				}
			}
			return -(low + 1);  // key not found.
		},
		exception: function exception(message, throwable, args)
		{
			if(Utils.isFunction(throwable))
			{
				throw new throwable(message);
			}
			else if(Utils.isString(throwable))
			{
				throw throwable;
			}
			throw new Error(message);
		},
		assertTrue: function assertTrue(condition, message, errorType)
		{
			if(condition !== true)
			{
				Utils.exception(message, errorType || Error);
			}
		},
		assertFalse: function assertFalse(condition, message, errorType)
		{
			if(condition !== false)
			{
				Utils.exception(message, errorType || Error);
			}
		},
		asInteger: function asInteger(v)
		{
			return v | 0;
		},
		isValid: function isValid(o)
		{
			return o !== undefined && o !== null;
		},
		isInvalid: function isInvalid(o)
		{
			return o === undefined || o === null;
		},
		isSimple: function isSimple(o)
		{
			return o === undefined || o === null || typeof o === "string" || typeof o === "number" || typeof o === "boolean" || o instanceof Date;
		},
		isBoolean: function isBoolean(o)
		{
			return typeof o === "boolean";
		},
		isNumber: function isNumber(o)
		{
			return typeof o === "number";
		},
		isInteger: function isInteger(o)
		{
			return typeof o === "number" && isFinite(o) && Math.floor(o) === o;
		},
		isOdd: function isOdd(i)
		{
			return (i & 1) === 1;
		},
		isEven: function isEvent(i)
		{
			return (i & 1) === 0;
		},
		isString: function isString(o)
		{
			return typeof o === "string";
		},
		isDate: function isDate(o)
		{
			return o instanceof Date;
		},
		isRegExp: function isRegExp(o)
		{
			return o instanceof RegExp;
		},
		isObject: function isObject(o)
		{
			return typeof o === "object";
		},
		isFunction: function isFunction(o)
		{
			return typeof o === "function";
		},
		isArray: function isArray(o)
		{
			return o instanceof Array;
		},
		isSymbol: function isSymbol(o)
		{
			return typeof o === "symbol";
		},
		isArguments: function isArguments(o)
		{
			return o.constructor === Constants.ARGS_CONSTRUCTOR;
		},
		isInstanceOf: function isInstanceOf(o, type)
		{
			return o instanceof type;
		},
		isThenable: function isThenable(o)
		{
			return o && Utils.isFunction(o.then);
		},
		awaitValid: function awaitValid(o, at)
		{
			if(!Utils.isValid(o))
			{
				Utils.exception("Awaited a valid value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitSimple: function awaitSimple(o, at)
		{
			if(!Utils.isSimple(o))
			{
				Utils.exception("Awaited any simple value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitNotSimple: function awaitNotSimple(o, at)
		{
			if(Utils.isSimple(o))
			{
				Utils.exception("Awaited any not simple value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitMatch: function awaitMatch(s, rx, at)
		{
			Utils.awaitString(s);
			Utils.awaitRegExp(rx);
			if(!rx.test(s))
			{
				Utils.exception("Awaited a string matching the regexp: " + rx + "" + (at !== undefined ? (" at " + at) : "") + ", but got: " + s);
			}
			return s;
		},
		awaitBoolean: function awaitBoolean(o, at)
		{
			if(!Utils.isBoolean(o))
			{
				Utils.exception("Awaited a boolean value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitNumber: function awaitNumber(o, at)
		{
			if(!Utils.isNumber(o))
			{
				Utils.exception("Awaited a numeric value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitInteger: function awaitInteger(o, at)
		{
			if(!Utils.isInteger(o))
			{
				Utils.exception("Awaited an integer value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitString: function awaitString(o, at)
		{
			if(!Utils.isString(o))
			{
				Utils.exception("Awaited a string value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitObject: function awaitObject(o, at)
		{
			if(!Utils.isObject(o))
			{
				Utils.exception("Awaited an object value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitFunction: function awaitFunction(o, at)
		{
			if(!Utils.isFunction(o))
			{
				Utils.exception("Awaited a function value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitDate: function awaitDate(o, at)
		{
			if(!Utils.isDate(o))
			{
				Utils.exception("Awaited a date value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitRegExp: function awaitRegExp(o, at)
		{
			if(!Utils.isRegExp(o))
			{
				Utils.exception("Awaited a regexp value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitArray: function awaitArray(o, at)
		{
			if(!Utils.isArray(o))
			{
				Utils.exception("Awaited an array value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitArguments: function awaitArguments(o, at)
		{
			if(!Utils.isArguments(o))
			{
				Utils.exception("Awaited an arguments value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitIterable: function awaitIterable(o, at)
		{
			if(!Utils.isIterable(o))
			{
				Utils.exception("Awaited an iterable value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitThenable: function awaitThenable(o, at)
		{
			if(!Utils.isThenable(o))
			{
				Utils.exception("Awaited a thenable value (instance with a property 'then' that points to a function(onFulfilled, onRejected){...})" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitInstanceOf: function awaitInstanceOf(o, type, at)
		{
			if(!Utils.isInstanceOf(o, type))
			{
				Utils.exception("Awaited a value of type '" + type.name + "'" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitCompatibility: function awaitCompatibility(o, keys, at)
		{
			if(!Utils.isCompatibleWith(o, keys))
			{
				Utils.exception("Awaited a value that has these properties '" + keys + "'" + (at !== undefined ? (" at " + at) : ""), TypeError);
			}
			return o;
		},
		awaitConstructionOf: function(self, type)
		{
			if(!(self instanceof type))
			{
				Utils.exception("Please use the 'new' operator, this object constructor cannot be called as a function: '" + (type.name) + "'", TypeError);
			}
			return self;
		},
		iterator: function iterator(src, offset, len)
		{
			if(src)
			{
				var iter;
				if(Utils.isFunction(src[iterableSymbol]))
				{
					return src[iterableSymbol].call(src);
				}
				else if(Utils.isArray(src) || Utils.isArguments(src))
				{
					offset = Math.max(0, offset || 0);
					len = Math.min(src.length, len || 0x7FFFFFFF);
					iter = {
						next: function()
						{
							return {
								done: (offset + 1) >= len,
								value: src[offset++]
							};
						}
					};
				}
			}
			iter = iter || {
				next: function()
				{
					return Constants.EMPTY_OBJECT;
				}
			};
			iter[iterableSymbol] = function()
			{
				return iter;
			};
			return iter;
		},
		isIterable: function isIterable(o)
		{
			if(Utils.isArray(o) || Utils.isArguments(o))
			{
				return true;
			}
			var iterator;
			if(o && (iterator = o[iterableSymbol]))
			{
				return Utils.isFunction(iterator.next);
			}
			return false;
		},
		extend: function extend(type, parent, opt)
		{
			Utils.awaitFunction(type, 1);
			Utils.awaitFunction(type, 2);
			type.prototype = Object.create(parent.prototype, Utils.isObject(opt) ? opt : Constants.EMPTY_OBJECT);
			type.prototype.constructor = type;
			return type;
		},
		randomString: function randomString(l, cs)
		{
			l = l || 6;
			var out = '';
			if(Utils.isArray(cs))
			{
				while(l--)
				{
					out += cs[0 | (Math.random() * cs.length)];
				}
			}
			else if(Utils.isString(cs) || cs === undefined)
			{
				cs = cs || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				while(l--)
				{
					out += cs.charAt(0 | (Math.random() * cs.length));
				}
			}
			return out;
		},
		deepCloneMarker: undefined, //deferred set
		deepCloneHelper: undefined, //deferred set
		deepClone: function deepClone(o, key, v, d)
		{
			if(Utils.isSimple(o))
			{
				return o;
			}
			d = (d || 0);
			v = v || [];
			key = key || Utils.deepCloneMarker;
			if(o[key] !== undefined)
			{
				return o[key];
			}
			v[v.length] = o;
			if(Utils.isFunction(o["clone"]))
			{
				return o[key] = o["clone"].clone();
			}
			else if(Utils.isArray(o))
			{
				var c = Utils.deepCloneHelper(o, []);
				o[key] = c;
				for(var i = 0, l = o.length; i < l; i++)
				{
					c[i] = Utils.deepClone(o[i], key, v, d + 1);
				}
			}
			else
			{
				var c = Utils.deepCloneHelper(o, o.constructor());
				o[key] = c;
				for(var k in o)
				{
					c[k] = Utils.deepClone(o[k], key, v, d + 1);
				}
			}
			if(!d)
			{
				for(var i = 0, l = v.length; i < l; i++)
				{
					v[i][key] = undefined;
				}
			}
			return c;
		},
		clone: function clone(o, c)
		{
			return Utils.merge(o, c || Utils.instantiate(o.constructor));
		},
		deepEqual: function deepEqual(a, b, stack)
		{
			if(a === b)
			{
				return true;
			}
			else if(Utils.isDate(a))
			{
				return Utils.isDate(b) && a.getTime() === b.getTime();
			}
			stack = stack || [];
			if(Utils.isArray(a))
			{
				if(Utils.isArray(b) && a.length === b.length)
				{
					if(stack.lastIndexOf(a) === -1)
					{
						stack[stack.length] = a;
						for(var i = 0, l = a.length; i < l; i++)
						{
							if(!Utils.deepEqual(a[i], b[i], stack))
							{
								return false;
							}
						}
						stack.length--;
					}
					return true;
				}
			}
			else if(Utils.isObject(a))
			{
				if(Utils.isObject(b) && a.constructor === b.constructor)
				{
					if(stack.lastIndexOf(a) === -1)
					{
						stack[stack.length] = a;
						for(var k in a)
						{
							if(k in b && !Utils.deepEqual(a[k], b[k], stack))
							{
								return false;
							}
						}
						stack.length--;
					}
					return true;
				}
			}
			return false;
		},
		wrapArguments: function wrapArguments(args, from, to, out)
		{
			Utils.awaitArguments(args, 1);
			from = 0 | Math.min(args.length, from || 0);
			to = 0 | Math.max(args.length, to || 0);
			var len = to - from;
			switch(out === undefined ? len : 10)
			{
				case 0:
					return Constants.EMPTY_ARRAY;
				case 1:
					return [args[from + 0]];
				case 2:
					return [args[from + 0], args[from + 1]];
				case 3:
					return [args[from + 0], args[from + 1], args[from + 2]];
				case 4:
					return [args[from + 0], args[from + 1], args[from + 2], args[from + 3]];
				case 5:
					return [args[from + 0], args[from + 1], args[from + 2], args[from + 3], args[from + 4]];
			}
			out = out || new Array(len >= 0 ? len : 0);
			for(var i = 0; i < len; i++)
			{
				out[i] = args[from + i];
			}
			return out;
		},
		instantiate: function instantiate(c, args)
		{
			Utils.awaitFunction(c, 1);
			if(Utils.isArray(args) && args.length)
			{
				switch(args.length)
				{
					case 1:
						return new c(args[0]);
					case 2:
						return new c(args[0], args[1]);
					case 3:
						return new c(args[0], args[1], args[2]);
					case 4:
						return new c(args[0], args[1], args[2], args[3]);
					case 5:
						return new c(args[0], args[1], args[2], args[3], args[4]);
				}
			}
			return new c();
		},
		merge: function merge(s, d)
		{
			for(var k in s)
			{
				s[k] = d[k];
			}
			return d;
		},
		isVariadic: function isVariadic(f)
		{
			/** a probabilistic version, because it doesn't match all cases (comments, literals etc.) */
			Utils.awaitFunction(f, 1);
			return f.toString().search(/[^\w\d_$\"']arguments[^\w\d_$\"']/m) > -1;
		},
		bindThis: function bindThis(h, f)
		{
			Utils.awaitFunction(f, 2);
			if(!Utils.isVariadic(f))
			{
				switch(f.length)
				{
					case 0:
						return function()
						{
							return f.call(h);
						};
					case 1:
						return function(a)
						{
							return f.call(h, a);
						};
					case 2:
						return function(a, b)
						{
							return f.call(h, a, b);
						};
					case 3:
						return function(a, b, c)
						{
							return f.call(h, a, b, c);
						};
					case 4:
						return function(a, b, c, d)
						{
							return f.call(h, a, b, c, d);
						};
					case 5:
						return function(a, b, c, d, e)
						{
							return f.call(h, a, b, c, d, e);
						};
				}
			}
			return function()
			{
				return f.apply(h, Utils.wrapArguments(arguments));
			};
		},
		bindArgs: function bindArgs(h, f, args)
		{
			Utils.awaitFunction(f, 2);
			args = Utils.isArguments(args) ? Utils.wrapArguments(args) : Utils.isArray(args) ? args : Utils.wrapArguments(arguments, 2);
			return function()
			{
				return f.apply(h, args);
			};
		},
		isCompatibleWith: function isCompatibleWith(h, keys)
		{
			Utils.awaitNotSimple(h, 1);
			if(!Utils.isArray(keys))
			{
				keys = Utils.wrapArguments(arguments, 1);
			}
			for(var i = 0, l = keys.length; i < l; i++)
			{
				if(!h.hasOwnProperty(keys[i]))
				{
					return false;
				}
			}
			return true;
		},
		remap: function remap(s, d, m)
		{
			Utils.awaitValid(s);
			Utils.awaitValid(d);
			Utils.awaitObject(m);
			for(var k in m)
			{
				d[m[k]] = s[k];
			}
			return d;
		},
		defineIfAbsent: function defineIfAbsent(h, k, v, o)
		{
			if(!h.hasOwnProperty(k))
			{
				Utils.define(h, k, v, o);
			}
			return h;
		},
		define: function define(h, k, v, o)
		{
			Utils.awaitValid(h, 1);
			Utils.awaitString(k, 2);
			o = o || {value: v};
			Object.defineProperty(h, k, o);
			return h;
		},
		defineGetter: function defineGetter(h, k, f, o)
		{
			Utils.awaitValid(h, 1);
			Utils.awaitString(k, 2);
			Utils.awaitFunction(f, 3);
			o = Utils.defineIfAbsent(o || {}, "get", f);
			Object.defineProperty(h, k, o);
			return h;
		},
		defineSetter: function defineSetter(h, k, f, o)
		{
			Utils.awaitValid(h, 1);
			Utils.awaitString(k, 2);
			Utils.awaitFunction(f, 3);
			o = Utils.defineIfAbsent(o || {}, "set", f);
			Object.defineProperty(h, k, o);
			return h;
		},
		compare: function compare(a, b)
		{
			return (a === b) ? 0 : a < b ? -1 : 1;
		},
		comparator: function comparator(fields, order, compare)
		{
			if(Utils.isFunction(order))
			{
				compare = order;
				order = Utils.ASC;
			}
			order = (order === "desc" || order === Constants.DESC) ? Constants.DESC : Constants.ASC;
			compare = compare || Utils.compare;
			if(Utils.isString(fields))
			{
				return order ? function(a, b)
				{ //desc
					return 0 - compare(a[fields], b[fields]);
				} : function(a, b)
				{ //asc
					return compare(a[fields], b[fields]);
				}
			}
			Utils.awaitArray(fields, 0);
			return function(a, b)
			{
				var c = 0, f;
				for(var i = 0, l = fields.length; i < l; i++)
				{
					f = fields[i];
					c = (order === Constants.ASC) ? compare(a[f], b[f]) : 0 - compare(a[f], b[f]);
					if(c)
					{
						return c;
					}
				}
				return c;
			};
		}
	};
	Utils.deepCloneHelper = (function()
	{
		var clonedMark = "";
		var clone = undefined;
		if(Utils.isFunction(window.Symbol))
		{
			clonedMark = Symbol.for("_" + Utils.randomString(12) + "_");
			clone = function(o, v)
			{
				o[clonedMark] = v;
				return v;
			};
		}
		else
		{
			var desc = {value: undefined, configurable: true};
			clonedMark = ("_" + Utils.randomString(12) + "_");
			clone = function(o, v)
			{
				desc.value = v;
				Object.defineProperty(o, clonedMark, desc);
				return v;
			};
		}
		Utils.deepCloneMarker = clonedMark;
		return clone;
	})();
	return Utils;
});