/**
 * Created by A.Hofmann on 10.03.2015.
 */
mix.declare("mix.Promise", ["mix.Utils", "mix.Detector"], function(Utils, Detector)
{
	"use strict";
	mix.declare("mix.PromiseState", function()
	{
		var PromiseState = {
			/**
			 * initial state, not fulfilled or rejected.
			 */
			PENDING: "pending",
			/**
			 * successful operation.
			 */
			FULFILLED: "fulfilled",
			/**
			 * failed operation.
			 */
			REJECTED: "rejected",
			/**
			 * the Promise is either fulfilled or rejected, but not pending.
			 */
			SETTLED: "settled"
		};
		Object.freeze(PromiseState);
		return PromiseState;
	});
	if(Detector.types.Promise)
	{
		return window.Promise;
	}
	var definition = {
		status: {
			writable: true,
			value: "pending"
		},
		value: {
			writable: true,
			value: undefined
		},
		_thenFn_: {
			writable: true,
			value: undefined
		},
		_catchFn_: {
			writable: true,
			value: undefined
		}
	};

	/**
	 * Function object with two arguments resolve and reject. The first argument fulfills the promise,
	 * the second argument rejects it. We can call these functions, once our operation is completed.
	 * @param executor a function(resolve, reject) { ... }
	 * @constructor
	 */
	function Promise(executor)
	{
		Utils.awaitFunction(executor, 1);
		Utils.awaitConstructionOf(this, Promise);
		Object.defineProperties(this, definition);
		var self = this;

		function rejectFn(val)
		{
			if(self.status === "pending")
			{
				self.status = "rejected";
				try
				{
					if(self._catchFn_)
					{
						self.value = self._catchFn_(val);
					}
					else
					{
						self.value = val;
					}
				}
				catch(e)
				{
					self.value = e;
					console.error("Unhandled promise rejection ", self, e);
				}
			}
		};
		function fulfillFn(val)
		{
			if(self.status === "pending")
			{
				try
				{
					if(self._thenFn_)
					{
						self.value = self._thenFn_(val);
					}
					else
					{
						self.value = val;
					}
					self.status = "fulfilled";
				}
				catch(e)
				{
					rejectFn(e);
				}
			}
		};
		try
		{
			executor(fulfillFn, rejectFn);
		}
		catch(e)
		{
			rejectFn(e);
		}
	};
	/**
	 * The then() method returns a Promise. It takes two arguments, both are callback functions for the success and failure cases of the Promise.
	 * @param onFulfilled a function called when the Promise is fulfilled. This function has one argument, the fulfillment value.
	 * @param onRejected a function called when the Promise is rejected. This function has one argument, the rejection reason.
	 * @return Promise new promise with pre-configured executor function
	 */
	Promise.prototype.then = function then(onFulfilled, onRejected)
	{
		var parent = this;
		return new Promise(function thenExecutor(resolve, reject)
		{
			switch(parent.status)
			{
				case "pending":
				{
					parent._thenFn_ = function pendingThen(value)
					{
						var result = value;
						if(Utils.isFunction(onFulfilled))
						{
							result = onFulfilled(result);
						}
						resolve(result);
						return value;
					};
					parent._catchFn_ = function pendingCatch(reason)
					{
						var result = reason;
						if(Utils.isFunction(onRejected))
						{
							result = onRejected(result);
						}
						reject(result);
						return reason;
					};
				}
					break;
				case "fulfilled":
				{
					var result = parent.value;
					if(Utils.isFunction(onFulfilled))
					{
						try
						{
							result = onFulfilled(result);
						}
						catch(e)
						{
							reject(e);
							return;
						}
					}
					resolve(result);
				}
					break;
				case "rejected":
				{
					var result = parent.value;
					if(Utils.isFunction(onRejected))
					{
						try
						{
							result = onRejected(result);
						}
						catch(e)
						{
							result = e;
						}
					}
					reject(result);
				}
					break;
			}
		});
	};
	/**
	 * The catch() method returns a Promise and deals with rejected cases only. It behaves the same as calling Promise.prototype.then(undefined, onRejected).
	 * @param onRejected a function called when the Promise is rejected. This function has one argument, the rejection reason.
	 * @return Promise new promise with pre-configured executor function
	 */
	Promise.prototype["catch"] = function(onRejected)
	{
		return this.then(undefined, onRejected);
	};
	/**
	 * The Promise.all(iterable) method returns a promise that resolves when all of the promises in the iterable argument have resolved.
	 * @param iterable an iterable object, such as an Array. See iterable.
	 * @return Promise promise - that reacts when all given values/promises were resolved or any given promise were rejected.
	 */
	Promise.all = function all(iterable)
	{
		var list = [], iterator = Utils.iterator(Utils.awaitIterable(iterable, 1));
		for(var entry = iterator.next(); !entry.done; entry = iterator.next())
		{
			list.push(entry.value);
		}
		return new Promise(function allPromise(resolve, reject)
		{
			var pending = list.length;

			function createInnerPromise(result, idx, resolve, reject)
			{
				return Promise.resolve(result[idx]).then(function(value)
				{
					result[idx] = value;
					if(--pending <= 0)
					{
						resolve(result);
					}
					return value;
				}, function(reason)
				{
					reject(reason);
					return reason;
				});
			}

			for(var i = 0; i < list.length; i++)
			{
				var value = list[i];
				if(Utils.isThenable(value))
				{
					createInnerPromise(list, i, resolve, reject);
				}
				else
				{
					pending--;
				}
			}
			if(pending <= 0)
			{
				resolve(list);
			}
		});
	};
	/**
	 * The Promise.race(iterable) method returns a promise that resolves or rejects as soon as one of the promises in the iterable resolves or rejects,
	 * with the value or reason from that promise.
	 * @param iterable an iterable object, such as an Array. See iterable.
	 * @return Promise promise - that reacts when any one of the given promises was resolved
	 */
	Promise.race = function race(iterable)
	{
		var list = [], iterator = Utils.iterator(Utils.awaitIterable(iterable, 1));
		for(var entry = iterator.next(); !entry.done; entry = iterator.next())
		{
			list.push(entry.value);
		}
		return new Promise(function racePromise(resolve, reject)
		{
			for(var i = 0; i < list.length; i++)
			{
				var result = list[i];
				if(Utils.isThenable(result))
				{
					result.then(resolve, reject);
				}
				else
				{
					resolve(result);
				}
			}
		});
	};
	/**
	 * The Promise.resolve(value) method returns a Promise object that is resolved with the given value.
	 * If the value is a thenable (i.e. has a then method), the returned promise will "follow" that thenable,
	 * adopting its eventual state; otherwise the returned promise will be fulfilled with the value.
	 * @param value argument to be resolved by this Promise. Can also be a Promise or a thenable to resolve.
	 * @return Promise promise - that resolves with the given value or follows the given thenable.
	 */
	Promise.resolve = function resolve(value)
	{
		if(Utils.isThenable(value))
		{
			return new Promise(function thenable(resolve, reject)
			{
				value.then(resolve, reject);
			});
		}
		return new Promise(function resolved(resolve, reject)
		{
			resolve(value);
		});
	};
	/**
	 * The Promise.reject(reason) method returns a Promise object that is rejected with the given reason.
	 * @param reason why this Promise rejected.
	 * @return Promise promise - that rejects always with given reason.
	 */
	Promise.reject = function reject(reason)
	{
		return new Promise(function rejected(resolve, reject)
		{
			reject(reason);
		});
	};
	return Promise;
});