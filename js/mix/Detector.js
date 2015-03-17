/**
 * Created by Big on 04.03.2015.
 */
mix.declare("mix.Detector", ["mix.Utils"], function(Utils)
{
	"use strict";
	var ua = window.navigator.userAgent, ie = /(MSIE )|(Trident\/7\.\d+)|(Edge\/\d+\.\d+)/.test(ua) || /*@cc_on!@*/false || !!window.document.documentMode, firefox = !ie && /Firefox\/\d+(\.\d+)?/.test(ua) || typeof window.InstallTrigger !== 'undefined', opera = !ie && !firefox && /(Opera[\/ ])|( OPR\/)|(Presto)/gm.test(ua) || !!window.opera || (window.chrome && window.chrome.webstore === undefined), chrome = !ie && !firefox && !opera && !!window.chrome, safari = !ie && !chrome && !firefox && !opera && Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0, mobile = ua.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i);

	function has(feature)
	{
		return this[feature] === true;
	}

	var detected = {
		browser: {
			has: has,
			mobile: mobile,
			ie: ie,
			chrome: chrome,
			firefox: firefox,
			opera: opera,
			safari: safari,
			name: (function()
			{
				if(ie)
				{
					return "IE";
				}
				if(firefox)
				{
					return "FIREFOX";
				}
				if(opera)
				{
					return "OPERA";
				}
				if(chrome)
				{
					return "CHROME";
				}
				if(safari)
				{
					return "SAFARI";
				}
				return "UNDEFINED";
			})(),
			version: (function()
			{
				if(ie)
				{
					if(ua.indexOf("MSIE ") > -1)
					{
						return ua.replace(/MSIE (\d+(\.\d+)?)/, "$1");
					}
					else if(ua.indexOf("Edge/") > -1)
					{
						return ua.replace(/Edge\/(\d+\.\d+)/, "$1");
					}
					return ua.replace(/Trident\/.*rv:\s*(\d+\.d+)/, "$1");
				}
				else if(firefox)
				{
					return ua.replace(/Firefox\/(\d+(\.\d+)?)/, "$1");
				}
				else if(opera)
				{
					return ua.indexOf("Opera") > -1 ? ua.replace(/Opera[\/ ](\d+(\.\d+)?)/, "$1") : ua.replace(/(OPR)\/(\d+(\.\d+)?)/, "$1");
				}
				else if(chrome)
				{
					return ua.replace(/Chrome\/(\d+(\.\d+)?)/, "$1");
				}
				else if(safari)
				{
					return ua.replace(/Safari\/(\d+(\.\d+)?)/, "$1");
				}
				return "";
			})()
		},
		array: {
			has: has,
			observe: Utils.isFunction(Array.observe)
		},
		object: {
			has: has,
			is: Utils.isFunction(Object.is),
			assign: Utils.isFunction(Object.assign),
			create: Utils.isFunction(Object.create),
			keys: Utils.isFunction(Object.keys),
			seal: Utils.isFunction(Object.seal),
			freeze: Utils.isFunction(Object.freeze),
			defineProperty: Utils.isFunction(Object.defineProperty),
			defineProperties: Utils.isFunction(Object.defineProperties),
			preventExtensions: Utils.isFunction(Object.preventExtensions),
			observe: Utils.isFunction(Object.observe)
		},
		symbol: (function(Utils)
		{
			if(Utils.isFunction(window.Symbol))
			{
				return {
					has: has,
					for: Utils.isFunction(window.Symbol.for),
					keyFor: Utils.isFunction(window.Symbol.keyFor),
					iterator: Utils.isSymbol(window.Symbol.iterator)
				};
			}
			return {
				has: has
			};
		})(Utils),
		types: {
			has: has,
			Promise: Utils.isFunction(window.Promise),
			Map: Utils.isFunction(window.Map),
			WeakMap: Utils.isFunction(window.WeakMap),
			Set: Utils.isFunction(window.Set),
			WeakSet: Utils.isFunction(window.WeakSet),
			Symbol: Utils.isFunction(window.Symbol)
		}
	};
	return detected;
});