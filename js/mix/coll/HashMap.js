mix.declare("mix.coll.HashMap", ["mix.Utils", "mix.Detector"], function(Utils, Detector)
{
	var E;
	mix.declare("mix.coll.Entry", function()
	{
		function Entry(key, value)
		{
			this.key = key;
			this.value = value;
			this.next = null;
		}

		return E = Entry;
	});
	"use strict";
	var isSymbolAvailable = Detector.symbol.has("for");
	var entriesSymbol = isSymbolAvailable ? window.Symbol.for("_entries_") : "_entries_";
	var sizeSymbol = isSymbolAvailable ? window.Symbol.for("_size_") : "_size_";
	var hashFn = isSymbolAvailable ? window.Symbol.for("_hashFn_") : "_hashFn_";
	var equalKeysFn = isSymbolAvailable ? window.Symbol.for("_equalKeysFn_") : "_equalKeysFn_";
	var iteratorSymbol = Detector.symbol.iterator ? window.Symbol.iterator : "@@iterator";

	function hashCode(o)
	{
		return o;
	}

	function keysEquality(a, b)
	{
		return a === b;
	}

	function HashMap(hashCodeFn, keysEqualFn)
	{
		this[hashFn] = Utils.isFunction(hashCodeFn) ? hashCodeFn : hashCode;
		this[equalKeysFn] = Utils.isFunction(keysEqualFn) ? keysEqualFn : keysEquality;
		this[entriesSymbol] = {};
		this[sizeSymbol] = 0;
	}

	HashMap.prototype.hash = function hash()
	{
		return this[entriesSymbol];
	};
	HashMap.prototype.key = function key(k)
	{
		return this[hashFn](k);
	};
	HashMap.prototype.equalKeys = function equalKeys(a, b)
	{
		return this[equalKeysFn](a, b);
	};
	/**
	 * Iterates over all elements in this map
	 * @param fn a function(value, key, map)
	 * @param thisArg to be used as <b>this</b> for callback call
	 * @returns {HashMap} this
	 */
	HashMap.prototype.forEach = function forEach(fn, thisArg)
	{
		Utils.awaitFunction(fn);
		var entries = this.hash();
		for(var k in entries)
		{
			for(var ent = entries[k]; !ent; ent = ent.next)
			{
				fn.call(thisArg, ent.value, ent.key, this);
			}
		}
		return this;
	};
	HashMap.prototype.set = function set(k, v)
	{
		"use strict";
		var key = this.key(k);
		var entries = this.hash();
		for(var ent = entries[key], last = null; ent !== undefined; last = ent, ent = ent.next)
		{
			if(this.equalKeys(k, ent.key))
			{
				ent.value = v;
				return this;
			}
		}
		entries[key] = new E(k, v, last);
		this[sizeSymbol] += 1;
		return this;
	};
	HashMap.prototype.get = function get(k)
	{
		"use strict";
		var key = this.key(k);
		var entries = this.hash();
		for(var ent = entries[key]; ent !== undefined; ent = ent.next)
		{
			if(this.equalKeys(k, ent.key))
			{
				return ent.value;
			}
		}
		return null;
	};
	HashMap.prototype["delete"] = function(k)
	{
		"use strict";
		var key = this.key(k);
		var entries = this.hash();
		for(var ent = entries[key], last = null; ent !== undefined; last = ent, ent = ent.next)
		{
			if(this.equalKeys(k, ent.key))
			{
				if(last !== null)
				{
					last.next = ent.next;
				}
				else if(ent.next)
				{
					entries[key] = ent.next;
				}
				else
				{
					delete entries[key];
				}
				this[sizeSymbol] -= 1;
				return true;
			}
		}
		return false;
	};
	HashMap.prototype.entries = HashMap.prototype[iteratorSymbol] = function entries()
	{
		"use strict";
		var index = 0;
		var entries = this.hash();
		var keys = Object.keys(entries);
		var ent = index < keys.length ? entries[keys[index++]] : null;
		var iter = {
			next: function EntryInterator()
			{
				if(!ent)
				{
					return {
						done: true,
						value: undefined
					};
				}
				else
				{
					var res = {
						done: false,
						value: [ent.key, ent.value]
					};
					if(ent.next)
					{
						ent = ent.next;
					}
					else
					{
						ent = index < keys.length ? entries[keys[index++]] : null;
					}
					return res;
				}
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	HashMap.prototype.keys = function keys()
	{
		"use strict";
		var index = 0;
		var entries = this.hash();
		var keys = Object.keys(entries);
		var ent = index < keys.length ? entries[keys[index++]] : null;
		var iter = {
			next: function KeyIterator()
			{
				if(!ent)
				{
					return {
						done: true,
						value: undefined
					};
				}
				else
				{
					var res = {
						done: false,
						value: ent.key
					};
					if(ent.next)
					{
						ent = ent.next;
					}
					else
					{
						ent = index < keys.length ? entries[keys[index++]] : null;
					}
					return res;
				}
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	HashMap.prototype.values = function values()
	{
		"use strict";
		var index = 0;
		var entries = this.hash();
		var keys = Object.keys(entries);
		var ent = index < keys.length ? entries[keys[index++]] : null;
		var iter = {
			next: function ValueIterator()
			{
				if(!ent)
				{
					return {
						done: true,
						value: undefined
					};
				}
				else
				{
					var res = {
						done: false,
						value: ent.value
					};
					if(ent.next)
					{
						ent = ent.next;
					}
					else
					{
						ent = index < keys.length ? entries[keys[index++]] : null;
					}
					return res;
				}
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	HashMap.prototype.has = function has(k)
	{
		"use strict";
		var key = this.key(k);
		var entries = this.hash();
		for(var ent = entries[key]; ent !== undefined; ent = ent.next)
		{
			if(this.equalKeys(k, ent.key))
			{
				return true;
			}
		}
		return false;
	};
	HashMap.prototype.clear = function clear()
	{
		"use strict";
		var entries = this.hash();
		for(var k in entries)
		{
			delete entries[k];
		}
		this[sizeSymbol] = 0;
		return this;
	};
	HashMap.prototype.toString = function toString()
	{
		return "[object HashMap]";
	};
	HashMap.prototype.clone = function clone()
	{
		var entries = this.hash();
		var c = new HashMap(this[hashFn], this[equalKeysFn]);
		for(var key in entries)
		{
			for(var ent = entries[key]; ent !== undefined; ent = ent.next)
			{
				c.set(ent.key, ent.value);
			}
		}
		return c;
	};
	Object.defineProperty(HashMap.prototype, "size", {
		get: function size()
		{
			"use strict";
			return this[sizeSymbol];
		}
	});
	return HashMap;
});