/**
 * Created by Big on 06.03.2015.
 */
mix.declare("mix.event.Dispatcher", ["mix.Utils", "mix.Detector", "mix.Constants", "mix.event.Config"], function(Utils, Detector, Constants, DispatcherConfig)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function getHost(dispatcher)
	{
		return dispatcher[DispatcherConfig.hostSymbol];
	}

	function getListeners(dispatcher)
	{
		return dispatcher[DispatcherConfig.listenersSymbol];
	}

	//-----------------------------------------------------------------------------------------------------------------------
	function Dispatcher(host)
	{
		DispatcherConfig.hostSetup(this, host || this); //this.host = host || this
		DispatcherConfig.listenersSetup(this, {}); //this.listeners = {};
	}

	//-----------------------------------------------------------------------------------------------------------------------
	Dispatcher.prototype.fire = function fire(event)
	{
		Utils.awaitString(event.type, 1);
		event.target = getHost(this);
		var listeners = getListeners(this)[event.type] || Constants.EMPTY_ARRAY;
		for(var i = 0; i < listeners.length; i++)
		{
			try
			{
				var listener = listeners[i];
				if(listener.call(event.target, event) === Constants.STOP)
				{
					break;
				}
			}
			catch(e)
			{
				console.error(e);
			}
		}
		return i;
	};
	Dispatcher.prototype.has = function has(event, listener)
	{
		var listeners = getListeners(this);
		return (event in listeners) && listeners[event].lastIndexOf(listener) > -1;
	};
	Dispatcher.prototype.list = function list(event)
	{
		var listeners = getListeners(this);
		return (event in  listeners) ? listeners[event] : listeners[event] = [];
	};
	Dispatcher.prototype.on = function on(event, listener)
	{
		Utils.awaitString(event, 1);
		Utils.awaitFunction(listener, 2);
		if(!this.has(event, listener))
		{
			this.list(event).push(listener);
		}
		return this;
	};
	Dispatcher.prototype.once = function once(event, listener)
	{
		Utils.awaitString(event, 1);
		Utils.awaitFunction(listener, 2);
		var self = this;

		function onceFn(e)
		{
			self.off(event, onceFn);
			listener.call(this, e);
		};
		return this.on(event, onceFn);
	};
	Dispatcher.prototype.times = function times(event, times, listener)
	{
		Utils.awaitString(event, 1);
		Utils.awaitNumber(times, 2);
		Utils.awaitFunction(listener, 3);
		if((times |= 0) < 1)
		{
			return this;
		}
		var self = this;

		function timesFn(e)
		{
			listener.call(this, e);
			if(times-- === 1)
			{
				self.off(event, timesFn);
			}
		};
		return this.on(event, timesFn);
	};
	Dispatcher.prototype.off = function off(event, listener)
	{
		Utils.awaitString(event, 1);
		Utils.awaitFunction(listener, 2);
		var listeners = getListeners(this);
		if(event in  listeners)
		{
			var list = listeners[event];
			var idx = list.lastIndexOf(listener);
			if(idx > -1)
			{
				list.splice(idx, 1);
			}
			if(!list.length)
			{
				delete listeners[event];
			}
		}
		return this;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	Dispatcher.isDispatcher = function isDispatcher(o)
	{
		return o instanceof Dispatcher;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Dispatcher;
});