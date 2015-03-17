/**
 * Created by A.Hofmann on 16.03.2015.
 */
mix.declare("mix.Symbols", ["mix.Utils", "mix.Detector"], function(Utils, Detector)
{
	"use strict";
	var Key, SymbolsConfig = {
		prepareKey: function prepareKey(key)
		{
			Utils.awaitString(key, 1);
			return "$" + key;
		}
	}, Config = {
		symbols: SymbolsConfig
	}, cache = {};
	//-----------------------------------------------------------------------------------------------------------------------
	mix.config("mix", Config);
	//-----------------------------------------------------------------------------------------------------------------------
	if(Detector.symbol.has("for"))
	{
		mix.declare("mix.Key", function()
		{
			Key = function SymbolKey(key)
			{
				this.symbol = Symbol.for(SymbolsConfig.prepareKey(key));
				Object.freeze(this);
			}
			return Key;
		});
	}
	else
	{
		mix.declare("mix.Key", function()
		{
			Key = function StringKey(key)
			{
				this.symbol = SymbolsConfig.prepareKey(key);
				Object.freeze(this);
			}
			return Key;
		});
	}
	//-----------------------------------------------------------------------------------------------------------------------
	Key.prototype.get = function get(host)
	{
		return host[this.symbol];
	};
	Key.prototype.set = function set(host, value)
	{
		host[this.symbol] = value;
	};
	Key.prototype.toString = function toString()
	{
		return this.symbol;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	function Symbols(key)
	{
		if(!(this instanceof Symbols))
		{
			throw new Error("Can't be instantiated.")
		}
		return Symbols.define(key);
	}

	//-----------------------------------------------------------------------------------------------------------------------
	Symbols.define = function define(key)
	{
		if(key in cache)
		{
			return cache[key];
		}
		return cache[key] = new Key(key);
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Symbols;
});