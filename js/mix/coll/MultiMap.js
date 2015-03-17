mix.declare("mix.coll.MultiMap", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	var isSymbolAvailable = Detector.symbol.has("for");
	var hashSymbol = isSymbolAvailable ? window.Symbol.for("_hash_") : "_hash_";
	var hashFn = isSymbolAvailable ? window.Symbol.for("_hashFn_") : "_hashFn_";
	var bucketsCount = isSymbolAvailable ? window.Symbol.for("_bucketsCount_") : "_bucketsCount_";
	var valuesCount = isSymbolAvailable ? window.Symbol.for("_valuesCount_") : "_valuesCount_";
	var iteratorSymbol = Detector.symbol.iterator ? window.Symbol.iterator : "@@iterator";

	function hashCode(o)
	{
		return o;
	}

	function MultiMap(hashCodeFn)
	{
		this[hashFn] = Utils.isFunction(hashCodeFn) ? hashCodeFn : hashCode;
		this[hashSymbol] = {};
		this[bucketsCount] = 0;
		this[valuesCount] = 0;
	}

	MultiMap.prototype.hash = function hash()
	{
		return this[hashSymbol];
	};
	MultiMap.prototype.key = function key(k)
	{
		return this[hashFn](k);
	};
	MultiMap.prototype.add = function add(k, v)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		if(bucket === undefined)
		{
			hash[key] = bucket = [];
			this[bucketsCount] += 1;
		}
		if(arguments.length > 2)
		{
			for(var i = 0, o = bucket.length, l = arguments.length; i < l; i++)
			{
				bucket[i + o] = arguments[1 + i];
			}
			this[valuesCount] += (l - 1);
		}
		else
		{
			bucket[bucket.length] = v;
			this[valuesCount] += 1;
		}
		return this;
	};
	/**
	 * Iterates over all elements in this map
	 * @param fn a function(value, key, map)
	 * @param thisArg to be used as <b>this</b> for callback call
	 * @returns {MultiMap} this
	 */
	MultiMap.prototype.forEach = function forEach(fn, thisArg)
	{
		Utils.awaitFunction(fn);
		var hash = this.hash();
		for(var k in hash)
		{
			fn.call(thisArg, hash[k], k, this);
		}
		return this;
	};
	MultiMap.prototype.set = function set(k, v)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		v = Utils.isArray(v) ? v : [v];
		var diff = v.length;
		if(bucket !== undefined)
		{
			diff -= bucket.length;
		}
		else
		{
			this[bucketsCount] += 1;
		}
		hash[key] = v;
		this[valuesCount] += diff;
		return this;
	};
	MultiMap.prototype.get = function get(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		return bucket || Constants.EMPTY_ARRAY;
	};
	MultiMap.prototype["delete"] = function(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		if(bucket !== undefined)
		{
			delete hash[key];
			this[valuesCount] -= bucket.length;
			this[bucketsCount] -= 1;
			return true;
		}
		return false;
	};
	MultiMap.prototype.entries = MultiMap.prototype[iteratorSymbol] = function entries()
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
	MultiMap.prototype.keys = function keys()
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
	MultiMap.prototype.values = function values()
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
	MultiMap.prototype.has = function has(k)
	{
		"use strict";
		return this.key(k) in this.hash();
	};
	MultiMap.prototype.clear = function clear()
	{
		"use strict";
		var hash = this.hash();
		for(var k in hash)
		{
			delete hash[k];
		}
		this[valuesCount] = this[bucketsCount] = 0;
		return this;
	};
	MultiMap.prototype.toString = function toString()
	{
		return "[object MultiMap]";
	};
	MultiMap.prototype.clone = function clone()
	{
		var hash = this.hash();
		var c = new MultiMap(this[hashFn]);
		for(var k in hash)
		{
			c.set(k, hash[k].concat());
		}
		return c;
	};
	Object.defineProperty(MultiMap.prototype, "size", {
		get: function size()
		{
			"use strict";
			return this[bucketsCount];
		}
	});
	Object.defineProperty(MultiMap.prototype, "count", {
		get: function count()
		{
			"use strict";
			return this[valuesCount];
		}
	});
	return MultiMap;
});