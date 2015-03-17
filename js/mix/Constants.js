/**
 * Created by Big on 04.03.2015.
 */
mix.declare("mix.Constants", function()
{
	"use strict";
	var ARGS_CONSTRUCTOR = arguments.constructor;
	var EMPTY_ARRAY = new Array();
	var EMPTY_OBJECT = new Object();
	var STOP = new Object();
	if(Object.freeze)
	{
		Object.freeze(EMPTY_ARRAY);
		Object.freeze(EMPTY_OBJECT);
		Object.freeze(STOP);
	}
	return {
		ASC: false,
		DESC: true,
		MAX_SAFE_INTEGER: 9007199254740991,
		MIN_SAFE_INTEGER: -9007199254740991,
		ARGS_CONSTRUCTOR: ARGS_CONSTRUCTOR,
		EMPTY_ARRAY: EMPTY_ARRAY,
		EMPTY_OBJECT: EMPTY_OBJECT,
		STOP: STOP
	};
});