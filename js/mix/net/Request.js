/**
 * Created by Big on 13.03.2015.
 */
mix.declare("mix.net.Request", ["mix.Utils", "mix.Detector", "mix.Promise"], function(Utils, Detector, Promise)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Request(config)
	{
	}

	//-----------------------------------------------------------------------------------------------------------------------
	var definition = Request.prototype;
	definition.send = function send()
	{
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Request;
});