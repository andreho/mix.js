mix.declare("mix.coll.SimpleMap", ["mix.Utils", "mix.Detector"], function(Utils, Detector)
{
	"use strict";
	var isSymbolAvailable = Detector.symbol.has("for");
	var hashSymbol = isSymbolAvailable ? window.Symbol.for("_hash_") : "_hash_";
	var sizeSymbol = isSymbolAvailable ? window.Symbol.for("_size_") : "_size_";
	var hashFn = isSymbolAvailable ? window.Symbol.for("_hashFn_") : "_hashFn_";
	var iteratorSymbol = Detector.symbol.iterator ? window.Symbol.iterator : "@@iterator";

	function hashCode(o)
	{
		return o;
	}

	function SimpleMap(hashCodeFn)
	{
		this[hashFn] = Utils.isFunction(hashCodeFn) ? hashCodeFn : hashCode;
		this[hashSymbol] = {};
		this[sizeSymbol] = 0;
	}

	SimpleMap.prototype.hash = function hash()
	{
		return this[hashSymbol];
	};
	SimpleMap.prototype.key = function key(k)
	{
		return this[hashFn](k);
	};
	/**
	 * Iterates over all elements in this map
	 * @param fn a function(value, key, map)
	 * @param thisArg to be used as <b>this</b> for callback call
	 * @returns {SimpleMap} this
	 */
	SimpleMap.prototype.forEach = function forEach(fn, thisArg)
	{
		Utils.awaitFunction(fn);
		var hash = this.hash();
		for(var k in hash)
		{
			fn.call(thisArg, hash[k], k, this);
		}
		return this;
	};
	SimpleMap.prototype.set = function set(k, v)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		if(!(key in hash))
		{
			this[sizeSymbol] += 1;
		}
		hash[key] = v;
		return this;
	};
	SimpleMap.prototype.get = function get(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		return hash[key] || null;
	};
	SimpleMap.prototype["delete"] = function(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		if(key in hash)
		{
			delete hash[key];
			this[sizeSymbol] -= 1;
			return true;
		}
		return false;
	};
	SimpleMap.prototype.entries = SimpleMap.prototype[iteratorSymbol] = function entries()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function EntryInterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : [keys[index], hash[keys[index++]]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SimpleMap.prototype.keys = function keys()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
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
	SimpleMap.prototype.values = function values()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function ValueIterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : hash[keys[index++]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SimpleMap.prototype.has = function has(k)
	{
		"use strict";
		return this.key(k) in this.hash();
	};
	SimpleMap.prototype.clear = function clear()
	{
		"use strict";
		var hash = this.hash();
		for(var k in hash)
		{
			delete hash[k];
		}
		this[sizeSymbol] = 0;
		return this;
	};
	SimpleMap.prototype.toString = function toString()
	{
		return "[object SimpleMap]";
	};
	SimpleMap.prototype.clone = function clone()
	{
		var hash = this.hash();
		var c = new SimpleMap(this[hashFn]);
		for(var k in hash)
		{
			c.set(k, hash[k]);
		}
		return c;
	};
	Object.defineProperty(SimpleMap.prototype, "size", {
		get: function size()
		{
			"use strict";
			return this[sizeSymbol];
		}
	});
	return SimpleMap;
});