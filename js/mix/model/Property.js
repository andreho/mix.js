/**
 * Created by A.Hofmann on 15.03.2015.
 */
mix.declare("mix.model.Property", ["mix.Symbols", "mix.Utils", "mix.Constants", "mix.event.PropertyChangeEvent"], function(Symbols, Utils, Constants, PropertyChangeEvent)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Property()
	{
		this.owner = undefined;
		this._symbol = undefined;
		this._name = "";
		this._safe = false;
		this._type = undefined;
		this._event = undefined;
		this._before = undefined;
		this._after = undefined;
		this._setter = undefined;
		this._getter = undefined;
		this._value = undefined;
		this._factory = undefined;
		this._bindable = false;
		this._writable = true;
		this._enumerable = true;
		this._configurable = false;
		this._dependsOn = Constants.EMPTY_ARRAY;
		this._meta = {};
	};
	function createGetter(prop)
	{
		if(prop.getter())
		{
			return function computedRead()
			{
				return prop._getter.call(this, prop);
			};
		}
		return function directRead()
		{
			return prop.get(prop.data(this));
		};
	};
	function createSetter(prop)
	{
		var needsOldValue = !!prop._before || !!prop._after;
		if(prop.setter())
		{
			return function computedWrite(newValue)
			{
				if(prop._safe && !(newValue instanceof prop._type))
				{
					throw new TypeError("Incompatible value, expected: " + prop._type.name);
				}
				var oldValue = prop.get(prop.data(this));
				if(prop._before)
				{ //function (host, property, oldValue, newValue):*
					newValue = prop._before(this, prop, oldValue, newValue);
				}
				//Call setter
				prop.set(prop.data(this), newValue = prop._setter.call(this, prop, newValue, oldValue));
				if(prop._after)
				{ //function (host, property, oldValue, newValue):*
					prop._after(this, prop, oldValue, newValue);
				}
			};
		}
		else
		{
			return function directWrite(newValue)
			{
				if(prop._safe && !(newValue instanceof prop._type))
				{
					throw new TypeError("Incompatible value, expected: " + prop._type.name);
				}
				if(needsOldValue)
				{
					var oldValue = prop.get(prop.data(this));
					if(prop._before)
					{ //function (host, property, oldValue, newValue):*
						newValue = prop._before(this, prop, oldValue, newValue);
					}
					prop.set(prop.data(this), newValue);
					if(prop._after)
					{ //function (host, property, oldValue, newValue):*
						prop._after(this, prop, oldValue, newValue);
					}
				}
				else
				{
					prop.set(prop.data(this), newValue);
				}
			};
		}
	};
	function createBindableSetter(prop)
	{
		if(prop.setter())
		{
			return function computedBindableWrite(newValue)
			{
				if(prop._safe && !(newValue instanceof prop._type))
				{
					throw new TypeError("Incompatible value, expected: " + prop._type.name);
				}
				var oldValue = prop.data(this)[prop._name];
				//Call setter
				prop.data(this)[prop._name] = newValue = prop._setter.call(this, prop, newValue, oldValue);
				if(oldValue !== newValue)
				{
					var dispatcher = prop.dispatcher(this);
					dispatcher.fire(new PropertyChangeEvent(prop._event, this, prop._name, oldValue, newValue));
				}
			};
		}
		else
		{
			return function directBindableWrite(newValue)
			{
				if(prop._safe && !(newValue instanceof prop._type))
				{
					throw new TypeError("Incompatible value, expected: " + prop._type.name);
				}
				var oldValue = prop.get(prop.data(this));
				if(oldValue !== newValue)
				{
					prop.set(prop.data(this), newValue);
					var dispatcher = prop.dispatcher(this);
					dispatcher.fire(new PropertyChangeEvent(prop._event, this, prop._name, oldValue, newValue));
				}
			};
		}
	};
	/**
	 * Retrieves the value of this property from the given host
	 * @param host of this properties value
	 * @returns {*} a value of this property
	 */
	Property.prototype.get = function get(host)
	{
		return host[this._symbol];
	};
	/**
	 * Defines the value of this property in the given host
	 * @param host of this properties value
	 * @param value of this property in the given host object
	 */
	Property.prototype.set = function set(host, value)
	{
		host[this._symbol] = value;
	};
	/**
	 * Makes any further changes of this property not possible
	 * @param owner model of this property
	 * @returns {Property}
	 */
	Property.prototype.freeze = function freeze(owner)
	{
		this.owner = owner;
		this._symbol = Symbols(this._name);
		Object.freeze(this);
		return this;
	};
	/**
	 *
	 * @returns {Object}
	 */
	Property.prototype.build = function build()
	{
		var desc = {
			enumerable: this._enumerable,
			configurable: this._configurable,
			get: createGetter(this)
		};
		desc.get = createGetter(this);
		if(this._bindable) //Setter and getter must be defined
		{
			desc.set = createBindableSetter(this);
		}
		else if(this._writable)
		{
			desc.set = createSetter(this);
		}
		return desc;
	};
	/**
	 * Retrieves data that holds internal state of the given model
	 * @param val a model instance
	 * @return {Object} internal data storage
	 */
	Property.prototype.data = function data(val)
	{
		return this.owner.data(val);
	};
	/**
	 * Retrieves dispatcher of the given model instance
	 * @param val a model instance
	 * @return {mix.event.Dispatcher} internal dispatcher
	 */
	Property.prototype.dispatcher = function dispatcher(val)
	{
		return this.owner.dispatcher(val);
	};
	/**
	 * Makes a cloned editable version of this property.
	 */
	Property.prototype.clone = function clone()
	{
		var c = new Property();
		c._name = this._name;
		c._safe = this._safe;
		c._type = this._type;
		c._event = this._event;
		c._before = this._before;
		c._after = this._after;
		c._setter = this._setter;
		c._getter = this._getter;
		c._writable = this._writable;
		c._bindable = this._bindable;
		c._enumerable = this._enumerable;
		c._configurable = this._configurable;
		c._value = this._value;
		c._dependsOn = this._dependsOn.clone();
		c._meta = Utils.deepClone(this._meta);
		return c;
	};
	/**
	 * Checks whether this property has a meta marker with the given value or not
	 * @param k is the alias of the marker
	 * @param v is the value of the marker (optional defaults to true)
	 * @returns {boolean} <b>true</b> if the marker is present and set to the given value, <b>false</b> otherwise
	 */
	Property.prototype.is = function is(k, v)
	{
		v = Utils.isInvalid(v) ? true : v;
		return this._meta[k] == v;
	};
	/**
	 * Defines the optional name of this property, can be omitted
	 * @param name of this property
	 * @returns {Property|String} this or name value itself
	 */
	Property.prototype.name = function name(name)
	{
		if(Utils.isString(name))
		{
			this._name = name;
			return this;
		}
		return this._name;
	};
	/**
	 * Defines that this property must be checked for type compatibility
	 * @param isSafe a value
	 * @returns {Property|Boolean} this by providing a boolean value or safe value itself
	 */
	Property.prototype.safe = function safe(isSafe)
	{
		if(Utils.isBoolean(isSafe))
		{
			this._safe = isSafe;
			return this;
		}
		return this._safe;
	};
	/**
	 * Defines the optional type of this property to perform type safety checks before the corresponding value is changed
	 * @param type of the property
	 * @returns {Property|Function} this by setting property type or current property type itself
	 */
	Property.prototype.type = function type(type)
	{
		if(Utils.isFunction(type))
		{
			this._type = type;
			return this;
		}
		this._type;
	};
	/**
	 * Defines event type that used to notify about outstanding changes
	 * @param type event type as string
	 * @returns {Property|String} this by setting event type or current event type itself
	 */
	Property.prototype.event = function event(type)
	{
		if(Utils.isString(type))
		{
			this._event = type;
			return this;
		}
		return this._event;
	};
	/**
	 * Defines a callback that is called every time before marked property is going to be changed (property itself wasn't changed yet).
	 * Not available if this property is bindable.
	 * @param callback is a function (host, property, oldValue, newValue):*
	 * @returns {Property|Function} this by providing a function or before callback itself
	 */
	Property.prototype.before = function before(callback)
	{
		if(Utils.isFunction(callback))
		{
			if(!this._bindable)
			{
				this._before = callback;
			}
			return this;
		}
		return this._before;
	};
	/**
	 * Defines a callback that is called every time after marked property was changed.
	 * Not available if this property is bindable.
	 * @param callback is a function (host, property, oldValue, newValue):*
	 * @returns {Property|Function} this by providing a function or after callback itself
	 */
	Property.prototype.after = function after(callback)
	{
		if(Utils.isFunction(callback))
		{
			if(!this._bindable)
			{
				this._after = callback;
			}
			return this;
		}
		return this._after;
	};
	/**
	 * Defines a getter function that is only necessary for a computed property and so declaring this property as a computed
	 * @param callback is a function():* representing getter code
	 * @returns {Property|Function} this by providing a function or getter function itself
	 */
	Property.prototype.getter = function getter(callback)
	{
		if(Utils.isFunction(callback))
		{
			this._getter = callback;
			return this;
		}
		return this._getter;
	};
	/**
	 * Defines a setter function and so declaring this property as a computed
	 * @param callback is a function(value):* representing setter code
	 * @returns {Property|Function} this by providing a function or setter function itself
	 */
	Property.prototype.setter = function setter(callback)
	{
		if(Utils.isFunction(callback))
		{
			this._setter = callback;
			return this;
		}
		return this._setter;
	};
	/**
	 * Defines a initial value of this property
	 * @param val is the initial value of this property
	 * @returns {Property} this (value of this initial is not accessible use factory().call() instead)
	 */
	Property.prototype.initial = function initial(val)
	{
		if(arguments.length > 0)
		{
			if(val !== undefined)
			{
				this._factory = function propertyValue(host)
				{
					var value = val;
					this.set(host, value);
					return value;
				};
			}
			else
			{
				this._factory = undefined;
			}
		}
		return this;
	};
	/**
	 * Defines the factory of the initial value of this property
	 * @param val a factory of the initial value of this property (may be a factory object or a function that is called automatically every time when corresponding object is instantiated)
	 * @returns {Property|*} this by providing an factory value or factory value itself
	 */
	Property.prototype.factory = function factory(val)
	{
		if(Utils.isObject(val) && Utils.isFunction(val.create))
		{
			this._factory = function propertyFactory(host)
			{
				var value = val.create();
				this.set(host, value);
				return value;
			};
			return this;
		}
		else if(Utils.isFunction(val))
		{
			this._factory = function propertyConstructor(host)
			{
				var value = val();
				this.set(host, value);
				return value;
			};
			return this;
		}
		return this._factory;
	};
	/**
	 * Defines whether this property is visible for a key iteration or not
	 * @param val a boolean value
	 * @returns {Property|Boolean} this by providing a boolean or enumerable value
	 */
	Property.prototype.enumerable = function enumerable(val)
	{
		if(Utils.isBoolean(val))
		{
			this._enumerable = val;
			return this;
		}
		return this._enumerable;
	};
	/**
	 * Defines for not computed properties whether this property writable or not
	 * @param val a boolean value (always true if this property is bindable)
	 * @returns {Property|Boolean} this by providing a boolean or writable value
	 */
	Property.prototype.writable = function writable(val)
	{
		if(Utils.isBoolean(val))
		{
			if(this._bindable)
			{
				val = true;
			}
			this._writable = val;
			return this;
		}
		return this._writable;
	};
	/**
	 * Defines this property as bindable (this is necessary to be able to observe the changes of this property)
	 * @param val a boolean value
	 * @returns {Property|Boolean} this by providing a boolean or bindable value
	 */
	Property.prototype.bindable = function bindable(val)
	{
		if(Utils.isBoolean(val))
		{
			this._bindable = val;
			if(val)
			{
				this._writable = true;
				this._configurable = false;
				this._before = this._after = undefined;
			}
			return this;
		}
		return this._bindable;
	};
	/**
	 * Defines whether this property may be reconfigured later or not
	 * @param val a boolean value (always false if this property is bindable)
	 * @returns {Property|Boolean} this by providing a boolean or configurable value
	 */
	Property.prototype.configurable = function configurable(val)
	{
		if(Utils.isBoolean(val))
		{
			if(this._bindable)
			{
				val = false;
			}
			this._configurable = val;
			return this;
		}
		return this._writable;
	};
	/**
	 * Defines a meta-marker on this property that can be retrieved later
	 * @param k is alias of meta-marker or an hash with values to merge into internal meta-storage
	 * @param v is value of meta-marker or undefined to retrieve a meta-markers value
	 * @returns {Property|*} this or meta-markers value
	 */
	Property.prototype.meta = function meta(k, v)
	{
		if(Utils.isObject(k) && v === undefined)
		{
			Utils.merge(k, this._meta);
		}
		else if(Utils.isString(k))
		{
			if(v === undefined)
			{
				return this._meta[k];
			}
			else
			{
				this._meta[k] = v;
			}
		}
		return this;
	};
	/**
	 * Defines observable properties to dispatch, in case when they were changed, an event to signal possible change of this value
	 * @param list with properties as strings (e.g.: 'a.b.c')
	 * @returns {Property|Array}
	 */
	Property.prototype.dependsOn = function dependsOn(list)
	{
		if(arguments.length > 1)
		{
			list = Utils.wrapArguments(arguments);
		}
		else if(arguments.length == 1 && Utils.isString(list))
		{
			list = [list];
		}
		if(Utils.isArray(list))
		{
			this._dependsOn = list;
			return this;
		}
		return this._dependsOn;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Property;
});