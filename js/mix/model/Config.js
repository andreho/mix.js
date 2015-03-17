/**
 * Created by Big on 15.03.2015.
 */
/**
 * Created by Big on 06.03.2015.
 */
mix.declare("mix.model.Config", ["mix.Utils", "mix.Constants", "mix.Symbols"], function(Utils, Constants, Symbols)
{
	"use strict";
	var dispatcherKey = Symbols.define("_dispatcher_");

	function applyDispatcher(instance, dispatcher)
	{
		if(dispatcherKey.get(instance) === undefined)
		{
			dispatcherKey.set(instance, dispatcher);
		}
	};
	var dataKey = Symbols.define("_data_");

	function applyData(instance, data)
	{
		if(dataKey.get(instance) === undefined)
		{
			dataKey.set(instance, data);
		}
	};
	return {
		dataKey: dataKey,
		dataSymbol: dataKey.symbol,
		dataSetup: applyData,
		dispatcherKey: dispatcherKey,
		dispatcherSymbol: dispatcherKey.symbol,
		dispatcherSetup: applyDispatcher
	}
});