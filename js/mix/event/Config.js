/**
 * Created by Big on 16.03.2015.
 */
mix.declare("mix.event.Config", ["mix.Utils", "mix.Constants", "mix.Symbols"], function(Utils, Constants, Symbols)
{
	"use strict";
	var hostKey = Symbols.define("_host_");

	function applyHost(instance, host)
	{
		if(hostKey.get(instance) === undefined)
		{
			hostKey.set(instance, host);
		}
	};
	var listenersKey = Symbols.define("_listeners_");

	function applyListeners(instance, listeners)
	{
		if(listenersKey.get(instance) === undefined)
		{
			listenersKey.set(instance, listeners);
		}
	};
	return {
		hostKey: hostKey,
		hostSymbol: hostKey.symbol,
		hostSetup: applyHost,
		listenersKey: listenersKey,
		listenersSymbol: listenersKey.symbol,
		listenersSetup: applyListeners
	}
});