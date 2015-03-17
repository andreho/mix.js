mix.declare("mix.coll.SortedMap", ["mix.Utils", "mix.Detector"], function(Utils, Detector)
{
	"use strict";
	var isSymbolAvailable = Detector.symbol.has("for");
	var keySymbol = isSymbolAvailable ? window.Symbol.for("_keys_") : "_keys_";
	var valueSymbol = isSymbolAvailable ? window.Symbol.for("_values_") : "_values_";
	var comparatorSymbol = isSymbolAvailable ? window.Symbol.for("_comparator_") : "_comparator_";
	var iteratorSymbol = Detector.symbol.iterator ? window.Symbol.iterator : "@@iterator";

	function SortedMap(comparator, keys, values)
	{
		this[comparatorSymbol] = Utils.isFunction(comparator) ? comparator : Utils.compare;
		if(Utils.isArray(keys))
		{
			if(Utils.isArray(values))
			{
				this[keySymbol] = keys;
				this[valueSymbol] = values;
				for(var i = 0, l = 0 | Math.min(keys.length, values.length); i < l; i++)
				{
					this.set(keys[i], values[i]);
				}
			}
			else if(Utils.isEven(keys.length))
			{
				for(var i = 0, l = 0 | Math.min(keys.length, values.length); i < l; i += 2)
				{
					this.set(keys[i], values[i + 1]);
				}
			}
		}
		else
		{
			this[keySymbol] = [];
			this[valueSymbol] = [];
		}
	}

	SortedMap.prototype.at = function at(idx)
	{
		"use strict";
		var keys = this[keySymbol];
		var values = this[valueSymbol];
		return [keys[idx], values[idx]];
	};
	SortedMap.prototype.min = function min()
	{
		"use strict";
		var keys = this[keySymbol];
		return keys.length > 0 ? keys[0] : undefined;
	};
	SortedMap.prototype.max = function max()
	{
		"use strict";
		var keys = this[keySymbol];
		return keys.length > 0 ? keys[keys.length - 1] : undefined;
	};
	SortedMap.prototype.index = function index(k)
	{
		"use strict";
		var keys = this[keySymbol];
		var comparator = this[comparatorSymbol];
		return Utils.binarySearch(keys, 0, keys.length, k, comparator);
	};
	SortedMap.prototype.set = function set(k, v)
	{
		"use strict";
		var idx = this.index(k);
		if(idx > -1)
		{
			this[valueSymbol][idx] = v;
		}
		else
		{
			idx = 0 - (idx + 1);
			this[keySymbol].splice(idx, 0, k);
			this[valueSymbol].splice(idx, 0, v);
		}
		return this;
	};
	SortedMap.prototype.get = function get(k)
	{
		"use strict";
		var idx = this.index(k);
		if(idx > -1)
		{
			return this[valueSymbol][idx];
		}
		return null;
	};
	SortedMap.prototype["delete"] = function(k)
	{
		"use strict";
		var idx = this.index(k);
		if(idx > -1)
		{
			this[keySymbol].splice(idx, 1);
			this[valueSymbol].splice(idx, 1);
			return true;
		}
		return false;
	};
	SortedMap.prototype.entries = SortedMap.prototype[iteratorSymbol] = function entries()
	{
		"use strict";
		var index = 0;
		var keys = this[keySymbol];
		var values = this[valueSymbol];
		var iter = {
			next: function EntryInterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : [keys[index], values[index++]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SortedMap.prototype.keys = function keys()
	{
		"use strict";
		var index = 0;
		var keys = this[keySymbol];
		var iter = {
			next: function KeyIterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : keys[index++]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SortedMap.prototype.values = function values()
	{
		"use strict";
		var index = 0;
		var values = this[valueSymbol];
		var iter = {
			next: function ValueIterator()
			{
				var done = index >= values.length;
				return {
					done: done,
					value: done ? undefined : values[index++]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	/**
	 * Iterates over all elements in this map
	 * @param fn a function(value, key, map)
	 * @param thisArg to be used as <b>this</b> for callback call
	 * @returns {SortedMap} this
	 */
	SortedMap.prototype.forEach = function forEach(fn, thisArg)
	{
		Utils.awaitFunction(fn);
		var keys = this[keySymbol];
		var values = this[valueSymbol];
		for(var i = 0, l = keys.length; i < l; i++)
		{
			fn.call(thisArg, values[i], keys[i], this);
		}
		return this;
	};
	SortedMap.prototype.has = function has(k)
	{
		"use strict";
		return this.index(k) > -1;
	};
	SortedMap.prototype.clear = function clear()
	{
		"use strict";
		this[keySymbol].length = this[valueSymbol].length = 0;
		return this;
	};
	SortedMap.prototype.clone = function clone()
	{
		var c = new SortedMap(this[comparatorSymbol]);
		Array.prototype.push(c[keySymbol], this[keySymbol]);
		Array.prototype.push(c[valueSymbol], this[valueSymbol]);
		return c;
	};
	SortedMap.prototype.toString = function toString()
	{
		return "[object SortedMap]";
	};
	Object.defineProperty(SortedMap.prototype, "size", {
		get: function size()
		{
			"use strict";
			return this[keySymbol].length;
		}
	});
	return SortedMap;
});