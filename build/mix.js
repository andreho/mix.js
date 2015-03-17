/**
 * Prepare default namespace location
 */

window._mix_ = (window._mix_ || "_mix_");
/**
 * Initializing module
 */
(function(target, mixCoreKey, mixNsKey)
{
	"use strict";
	//-Little Polyfill from MDN-------------------------------------------------------------------------------
	if(RegExp.prototype.flags === undefined)
	{
		Object.defineProperty(RegExp.prototype, 'flags', {
			configurable: true,
			get: function()
			{
				return this.toString().match(/[gimuy]*$/)[0];
			}
		});
	}
	//-UTILS--------------------------------------------------------------------------------------------------
	function isBoolean(o)
	{
		return typeof o === "boolean";
	}

	function isString(o)
	{
		return typeof o === "string";
	}

	function isObject(o)
	{
		return typeof o === "object";
	}

	function isFunction(o)
	{
		return typeof o === "function";
	}

	function isArray(o)
	{
		return o instanceof Array;
	}

	function propagate(src, dst)
	{
		if(isArray(dst))
		{
			if(isArray(src))
			{
				for(var i = 0, l = Math.min(dst.length, src.length); i < l; i++)
				{
					propagate(src[i], dst[i]);
				}
				if(src.length < dst.length)
				{
					dst.length = src.length;
				}
				else
				{
					Array.prototype.push.apply(dst, src.slice(dst.length));
				}
			}
		}
		else
		{
			for(var k in src)
			{
				var v = src[k];
				if(k in dst)
				{
					var c = dst[k];
					if((isArray(v) && isArray(c)) || (isObject(v) && isObject(c)))
					{
						propagate(v, c);
						continue;
					}
				}
				dst[k] = v;
			}
		}
	};
	function read(src, path)
	{
		path = isString(path) ? path.split("\.") : isArray(path) ? path : [path];
		var name, current = src;
		for(var i = 0, len = path.length; i < len; i++)
		{
			name = path[i];
			if(!current || !current.hasOwnProperty(name))
			{
				return undefined;
			}
			current = current[name];
		}
		return current;
	}

	//------------------------------------------------------------------------------------------------------
	var context = {
		loaded: "LOADED"
	};
	//------------------------------------------------------------------------------------------------------
	function Schema(arg)
	{
		if(!(this instanceof Schema))
		{
			return new Schema(arg);
		}
		this.url = Schema.defaultURLProvider; //String, Object or function (d:Dependency):String
		this.external = Schema.defaultExternal; //Boolean or function (d:Dependency):Boolean
		this.alias = ""; //Object or function (d:Dependency):String
		this.prefix = ""; //String or function (d:Dependency):String
		this.suffix = ""; //String or function (d:Dependency):String
		this.path = "/"; //String or function (d:Dependency):String
		this.mime = "*/*"; //or function (d:Dependency):String
		this.preprocessor = Schema.defaultPreprocessor; //function (d:Dependency, rawData:String):String
		this.injector = Schema.defaultInjector; //function (d:Dependency, rawData:String):String
		this.loader = Schema.defaultLoader; //function (d:Dependency):void
		if(isObject(arg))
		{
			for(var key in arg)
			{
				var val = arg[key];
				if(val === "setup")
				{
					continue;
				}
				else if(key in this)
				{
					this[key] = val;
				}
			}
		}
		else
		{
			throw new TypeError("Invalid argument, expected Object, but got: " + arg);
		}
	}

	//------------------------------------------------------------------------------------------------------
	Schema.defaultExternal = function defaultExternal(dep)
	{
		var location = window.location;
		var host = location.protocol + "//" + location.host;
		return dep.url ? dep.url.search(host) !== 0 : false;
	};
	Schema.defaultPreprocessor = undefined;
	Schema.defaultURLProvider = function(dep)
	{
		var location = window.location;
		var base = location.href.substring(0, location.href.length - (location.port ? location.port.length + 1 : 0) - location.pathname.length - (location.search ? location.search.length : 0));
		var url = base + (location.port ? ":" + location.port : "") + "/" + cfg.baseUrl;
		url += ("/" + (isFunction(this.path) ? this.path.call(this, dep) : this.path));
		var alias;
		if(isFunction(this.alias))
		{
			alias = this.alias.call(this, dep);
		}
		else if(isObject(this.alias))
		{
			alias = this.alias[dep.alias];
		}
		else
		{
			alias = dep.alias;
		}
		alias = (isFunction(this.prefix) ? this.prefix.call(this, dep) : this.prefix) + alias + (isFunction(this.suffix) ? this.suffix.call(this, dep) : this.suffix);
		url += ("/" + alias);
		url = url.replace(/([^:])\/+/g, "$1/");
		return url;
	};
	Schema.defaultLoader = function(dep)
	{
		if(!dep.url)
		{
			throw new Error("Please provide an URL for the definition: " + dep + ", type: " + dep.type);
		}
		if(dep.external)
		{
			var script = window.document.createElement("script");
			script.type = dep.mime;
			script.src = dep.url;
			script.setAttribute("data-alias", dep.key);
			script.onload = Dependency.prototype.handleResult.bind(dep);
			script.onerror = Dependency.prototype.handleFailure.bind(dep);
			window.document.head.appendChild(script);
		}
		else
		{
			var request = new XMLHttpRequest();
			request.onload = Dependency.prototype.handleResult.bind(dep);
			request.onerror = Dependency.prototype.handleFailure.bind(dep);
			request.open("GET", dep.url, true);
			request.send();
		}
	};
	Schema.defaultInjector = function(dep, raw)
	{
		dep.resolve();
	};
	//------------------------------------------------------------------------------------------------------
	Schema.prototype.setup = function(dep)
	{
		dep.url = isFunction(this.url) ? this.url.call(this, dep) : isObject(this.url) ? this.url[dep] : this.url;
		dep.mime = isFunction(this.mime) ? this.mime.call(this, dep) : isObject(this.mime) ? this.mime[dep] || this.mime["default"] : this.mime;
		dep.external = isFunction(this.external) ? this.external.call(this, dep) : isObject(this.external) ? this.external[dep] : this.external;
		return this;
	};
	//------------------------------------------------------------------------------------------------------
	var cfg = {
		debug: true,
		logStyle: "color: COLOR; font-style: bold;",
		console: window.console,
		baseUrl: "/app",
		schemas: {},
		internal: {}
	};
	//-----------------------------------------------------------------------------------------------------
	var config = {
		mix: {
			core: cfg
		}
	};
	//-----------------------------------------------------------------------------------------------------
	var registry = {};
	var namespaces = {};
	var requiredMap = {};
	var requiredList = [];
	var nsRegExp = /[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*/;
	//------------------------------------------------------------------------------------------------------
	function Core()
	{
		Object.defineProperty(this, "_config_", {value: config });
		Object.defineProperty(this, "_context_", {value: context});
		Object.defineProperty(this, "_registry_", {value: registry});
		Object.defineProperty(this, "_pending_", {value: requiredList});
	}

	Core.prototype.namespace = function(ns)
	{
		if(ns instanceof Core || ns instanceof Namespace)
		{
			return ns;
		}
		if(!isString(ns) || !nsRegExp.test(ns))
		{
			throw new Error("Invalid namespace alias: '" + ns + "'");
		}
		var i = 0;
		var subNs;
		var split = ns.split(/\./g);
		var current = this;
		for(; i < split.length; i++)
		{
			subNs = split[i];
			if(!current.has(subNs))
			{
				current = new Namespace(subNs, current);
			}
			else
			{
				current = current[subNs];
			}
		}
		return current;
	};
	Core.prototype.config = function(a, b)
	{
		switch((a !== undefined ? 1 : 0) + (b !== undefined ? 1 : 0))
		{
			case 0:
				return this._config_;
			case 1:
			{
				if(isObject(a))
				{
					propagate(a, this._config_);
				}
				else if(isString(a) || isArray(a))
				{
					return read(this._config_, a);
				}
			}
				break;
			case 2:
			{
				if((isString(a) || isArray(a)) && isObject(b))
				{
					propagate(b, read(this._config_, a));
				}
			}
				break;
		}
		return this;
	};
	Core.prototype.context = function(context)
	{
		if(isObject(context))
		{
			this._context_ = context;
		}
		else if(context === undefined)
		{
			return this._context_;
		}
		return this;
	};
	Core.prototype.has = function(alias)
	{
		return alias in this;
	};
	Core.prototype.set = function(key, value, opts)
	{
		if(key in this)
		{
			throw new Error("Given definition with key '" + key + "' exists in namespace '" + this + "' already.");
		}
		if(isObject(opts))
		{
			Object.defineProperty(this, key, opts);
		}
		else
		{
			this[key] = value;
		}
		return this;
	};
	Core.prototype.provide = function(key, dependencies, builder)
	{
		return this.declare(key, "provided", dependencies, builder);
	};
	Core.prototype.declare = function(key, type, dependencies, builder)
	{
		var assignable = "extend" !== type;
		if(assignable && (key in registry))
		{
			throw new Error("Given definition with key '" + key + "' was already defined.");
		}
		if(builder === undefined)
		{
			if(isFunction(type))
			{
				builder = type;
				dependencies = [];
				type = "declaration";
			}
			else if(isArray(type))
			{
				builder = dependencies;
				dependencies = type;
				type = "declaration";
			}
			else if(type === "provided")
			{
				var provided = dependencies;
				builder = function providedValue()
				{
					return provided;
				}
				dependencies = [];
			}
			else if(isFunction(dependencies))
			{
				builder = dependencies;
				dependencies = [];
			}
		}
		var dotIdx = key.lastIndexOf(".");
		var ns = dotIdx > -1 ? key.substr(0, dotIdx) : key;
		key = key.substr(dotIdx + 1);
		return this.resource(ns).alias(key).assignable(assignable).type(type).dependencies(dependencies).build(builder);
	};
	Core.prototype.extend = function(key, dependencies, builder)
	{
		if(isArray(dependencies))
		{
			if(dependencies.indexOf(key) === -1)
			{
				dependencies.unshift(key);
			}
		}
		else if(isFunction(dependencies))
		{
			builder = dependencies;
			dependencies = [key];
		}
		return this.declare(key, "extend", dependencies, builder);
	};
	Core.prototype.plugin = function(key, dependencies, builder)
	{
		return this.declare(key, "plugin", dependencies, builder);
	};
	Core.prototype.resource = function(o)
	{
		if(!arguments.length)
		{
			return new Resource(this);
		}
		else if(isString(o))
		{
			return new Resource(this.namespace(o));
		}
		else if(isObject(o))
		{
			var resource = new Resource(this.namespace(o.ns || o.namespace || this)).alias(o.alias).type(o.type).assignable(isBoolean(o.assignable) ? o.assignable : true).dependencies((o.dependencies || o.requires || []));
			if(isFunction(o.builder))
			{
				return resource.build(o.builder);
			}
			return resource;
		}
		throw new Error("Unsupported parameter type: '" + o + "', please provide either a string or a hash.");
	};
	Core.prototype.inject = function(dependencies)
	{
		var i = 0, j = 0, l = dependencies.length, args = new Array(l);
		while(i < l)
		{
			var d = dependencies[i++];
			if(this.isInjectable(d))
			{
				var ed = this.escapeDependency(d);
				if(ed === d)
				{
					args[j++] = registry[ed];
				}
			}
		}
		return args;
	};
	Core.prototype.isInjectable = function(d)
	{
		return d.length && d.charAt(0) !== "-";
	};
	Core.prototype.isDependency = function(d)
	{
		return d.length && d.charAt(0) !== "!";
	};
	Core.prototype.escapeDependency = function(d)
	{
		return d.length && (d.charAt(0) === "!" || d.charAt(0) === "-") ? d.substr(1) : d;
	};
	Core.prototype.toString = function()
	{
		return "";
	};
	//------------------------------------------------------------------------------------------------------
	function Namespace(alias, parent)
	{
		var key = parent && parent.alias ? parent + "." + alias : alias;
		if(key in namespaces)
		{
			throw new Error("Namespace is already defined: " + alias + ", parent: " + parent);
		}
		namespaces[key] = this;
		Object.defineProperty(this, "alias", {value: alias});
		if(parent)
		{
			Object.defineProperty(this, "parent", {value: parent});
			Object.defineProperty(parent, alias, {value: this});
		}
	};
	Namespace.prototype.has = Core.prototype.has;
	Namespace.prototype.namespace = Core.prototype.namespace;
	Namespace.prototype.set = Core.prototype.set;
	Namespace.prototype.resource = Core.prototype.resource;
	Namespace.prototype.plugin = Core.prototype.plugin;
	Namespace.prototype.config = function(a, b)
	{
		return core.config(a, b);
	};
	Namespace.prototype.context = function(context)
	{
		core.context(context);
		return this;
	};
	Namespace.prototype.provide = function(key, dependencies, builder)
	{
		core.provide(key, dependencies, builder);
		return this;
	};
	Namespace.prototype.declare = function(key, type, dependencies, builder)
	{
		core.declare(key, type, dependencies, builder);
		return this;
	};
	Namespace.prototype.extend = function(key, dependencies, builder)
	{
		core.extend(key, dependencies, builder);
		return this;
	};
	Namespace.prototype.toString = function toString()
	{
		var arr = [];
		var current = this;
		while(current.parent)
		{
			if(current.alias)
			{
				arr[arr.length] = current.alias;
			}
			current = current.parent;
		}
		return arr.reverse().join(".");
	};
	//------------------------------------------------------------------------------------------------------
	function Resource(ns)
	{
		this._ns_ = ns;
		this._type_ = undefined;
		this._alias_ = undefined;
		this._builder_ = undefined;
		this._assignable_ = true;
		this._dependencies_ = undefined;
	}

	Resource.prototype.alias = function(alias)
	{
		this._alias_ = alias;
		return this;
	};
	Resource.prototype.assignable = function(assignable)
	{
		this._assignable_ = !!assignable;
		return this;
	};
	Resource.prototype.type = function(type)
	{
		this._type_ = type;
		return this;
	};
	Resource.prototype.dependencies = Resource.prototype.requires = function()
	{
		var dependencies = null;
		if(arguments.length === 1)
		{
			dependencies = arguments[0];
			if(isString(dependencies))
			{
				dependencies = [dependencies];
			}
			else if(!isArray(dependencies))
			{
				throw new TypeError("Awaited either a string or an array.");
			}
		}
		else
		{
			dependencies = [];
			for(var i = 0, l = arguments.length; i < l; i++)
			{
				dependencies[i] = arguments[i];
			}
		}
		this._dependencies_ = dependencies;
		return this;
	};
	Resource.prototype.build = function(builder)
	{
		this._builder_ = builder;
		var dep = new Dependency(this._ns_, this._alias_, this._dependencies_, this._builder_, this._type_, this._assignable_);
		if(!dep.alias || !isString(dep.alias))
		{
			throw new Error("Invalid alias: '" + dep.alias + "'");
		}
		if(isArray(dep.dependencies))
		{
			var found = 0;
			for(var i = 0, l = dep.dependencies.length; i < l; i++)
			{
				var d = dep.dependencies[i];
				var fqn = core.escapeDependency(d);
				if(fqn in registry || !core.isDependency(d))
				{
					found += 1;
				}
				else
				{
					dep.matrix[fqn] = true;
					requiredMap[fqn] = 1 + (requiredMap[fqn] || 0);
				}
			}
			if(found < l)
			{
				requiredList.push(dep);
				return dep.ns;
			}
		}
		else if(isFunction(dep.dependencies))
		{
			dep.builder = dep.dependencies;
		}
		if(isFunction(dep.builder))
		{
			dep.load();
		}
		else
		{
			throw new Error("Builder parameter must be a function.");
		}
		return dep.ns;
	};
	//------------------------------------------------------------------------------------------------------
	function Dependency(ns, alias, dependencies, builder, type, assignable)
	{
		this.ns = ns;
		this.matrix = {};
		this.assignable = assignable;
		this.key = (ns.alias) ? ns + "." + alias : alias;
		this.type = type;
		this.alias = alias;
		this.builder = builder;
		this.dependencies = dependencies;
		this.value = undefined;
		this.url = null;
		this.loaded = false;
		this.resolved = false;
		this.processed = false;
		this.loadable = (type in cfg.schemas);
		this.external = false;
		this.mime = "*/*";
		if(this.loadable)
		{
			this.schema = cfg.schemas[type];
			this.schema.setup(this);
		}
	};
	Dependency.prototype.toString = function()
	{
		return this.key;
	};
	Dependency.prototype.resolve = function()
	{
		var fqn = this.key;
		if(!this.loadable || this.loaded)
		{
			if(!this.resolved)
			{
				this.complete();
				if(delete requiredMap[fqn])
				{
					var readyList = [], dep;
					for(var i = requiredList.length - 1; i >= 0; i--)
					{
						dep = requiredList[i];
						if(delete dep.matrix[fqn] && !Object.keys(dep.matrix).length)
						{
							readyList.push(dep);
							requiredList.splice(i, 1);
						}
					}
					for(i = 0; i < readyList.length; i++)
					{
						(dep = readyList[i]).load();
					}
				}
			}
		}
		return this;
	};
	var counter = 0;
	Dependency.prototype.complete = function()
	{
		if(this.resolved)
		{
			return;
		}
		this.resolved = true;
		var fqn = this.key;
		var args = core.inject(this.dependencies);
		try
		{
			var result = this.builder.apply(null, args);
			counter++;
			if(this.assignable)
			{
				registry[fqn] = result;
				this.ns.set(this.alias, result);
				if(cfg.debug)
				{
					cfg.console.log("%c" + ("      ".substr(0, 6 - counter.toString().length) + counter) + ": %c" + fqn, cfg.logStyle.replace("COLOR", "red"), cfg.logStyle.replace("COLOR", "green"));
				}
			}
			this.value = null;
		}
		catch(e)
		{
			cfg.console.error("Unable to resolve definition: " + fqn + ", because of: ");
			cfg.console.log("%c" + (e.stack ? e.stack : e), cfg.logStyle.replace("COLOR", "red"));
		}
	};
	Dependency.prototype.handleFailure = function(res)
	{
		if(res && (res.srcElement || res.target))
		{
			var src = (res.srcElement || res.target);
			if(src.onload || src.onerror)
			{
				src.onload = null;
				src.onerror = null;
			}
		}
		cfg.console.error("Unable to load following dependency: '" + this + "' from: '" + this.url + "'", this, res);
	};
	/**
	 * Called only for loadable dependencies
	 * @param res
	 */
	Dependency.prototype.handleResult = function(res)
	{
		this.loaded = true;
		if(res && (res.srcElement || res.target))
		{
			var src = (res.srcElement || res.target);
			if(src.onload || src.onerror)
			{
				src.onload = null;
				src.onerror = null;
			}
			//Internal source ...
			if(src instanceof XMLHttpRequest)
			{
				if(!(src.status == 200 || src.status == 304))
				{
					throw new Error("Unable to load following dependency: '" + this.alias + "' at: '" + this.ns + "' from: '" + this.url + "'");
				}
				this.schema.injector.call(this.schema, this, this.value = src.responseText);
			}
			this.resolve();
		}
	};
	Dependency.prototype.load = function()
	{
		//Is this dependency loadable?
		if(!this.loadable || this.loaded)
		{
			this.resolve();
			return;
		}
		this.schema.loader.call(this.schema, this);
	};
	//------------------------------------------------------------------------------------------------------
	var monitoredTimes = 0;
	//------------------------------------------------------------------------------------------------------
	setTimeout(function monitorRequirements()
	{
		if(monitoredTimes++ < 5 && requiredList.length > 0)
		{
			cfg.console.log("%cAwaiting dependencies: " + requiredList.join(","), "background-color: red; color: white; font-style: bold;");
			setTimeout(monitorRequirements, 3000);
		}
	}, 3000);
	//------------------------------------------------------------------------------------------------------
	var oldMixCore = target[mixCoreKey], oldMixNs = target[mixNsKey];
	var core = target[mixCoreKey] = new Core();
	var mix = target[mixNsKey] = core.namespace("mix");
	mix.provide("mix.Schema", Schema);
	//------------------------------------------------------------------------------------------------------
})(window, _mix_, "mix");
//-----------------------------------------------------------------------------------------------------------------------
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */
mix.declare("mix.Arrays", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	var Arrays = {

	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Arrays;
});
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */
mix.declare("mix.Assert", ["mix.Utils", "mix.Constants"], function(Utils, Constants)
{
	"use strict";
	return null;
});
//######################################################################################
/**
 * Created by A.Hofmann on 06.03.2015.
 */
mix.declare("mix.Console", ["mix.Utils", "mix.Constants"], function(Utils, Constants)
{
	"use strict";
	return window.console;
});
//######################################################################################
/**
 * Created by A.Hofmann on 04.03.2015.
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
//######################################################################################
/**
 * Created by A.Hofmann on 04.03.2015.
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
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */
mix.declare("mix.Objects", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	var Objects = {

	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Objects;
});
//######################################################################################
/**
 * Created by A.Hofmann on 11.03.2015.
 */
mix.declare("mix.Polyfill", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	return null;
});
//######################################################################################
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
//######################################################################################
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
//######################################################################################
/**
 * Created by A.Hofmann on 23.02.2015.
 */
mix.declare("mix.Utils", ["mix.Constants"], function(Constants)
{
	"use strict";
	var iterableSymbol = (window.Symbol && (typeof window.Symbol.iterator) === "symbol") ? window.Symbol.iterator : "@@iterator";
	var objectToString = Object.prototype.toString;
	var Utils = {
		noop: function noop()
		{
			return undefined;
		},
		read: function read(src, path)
		{
			if(!Utils.isValid(src))
			{
				return undefined;
			}
			if(arguments.length == 2)
			{
				if(Utils.isString(path))
				{
					path = path.split(".");
				}
			}
			else if(arguments.length > 2)
			{
				path = Utils.wrapArguments(arguments, 1);
			}
			var name, current = src;
			for(var i = 0, len = path.length; i < len; i++)
			{
				name = path[i];
				if(Utils.isInvalid(current))
				{
					return undefined;
				}
				current = current[name];
			}
			return current;
		},
		binarySearch: function binarySearch(arr, from, to, key, comparator)
		{
			var low = from, high = to - 1, mid, midVal, cmp;
			if(comparator)
			{
				while(low <= high)
				{
					mid = (low + high) >>> 1;
					midVal = arr[mid];
					cmp = comparator(midVal, key);
					if(cmp < 0)
					{
						low = mid + 1;
					}
					else if(cmp > 0)
					{
						high = mid - 1;
					}
					else
					{
						return mid;
					} // key found
				}
			}
			else
			{
				while(low <= high)
				{
					mid = (low + high) >>> 1;
					midVal = arr[mid];
					if(midVal < key)
					{
						low = mid + 1;
					}
					else if(midVal > key)
					{
						high = mid - 1;
					}
					else
					{
						return mid;
					} // key found
				}
			}
			return -(low + 1);  // key not found.
		},
		exception: function exception(message, throwable, args)
		{
			if(Utils.isFunction(throwable))
			{
				throw new throwable(message);
			}
			else if(Utils.isString(throwable))
			{
				throw throwable;
			}
			throw new Error(message);
		},
		assertTrue: function assertTrue(condition, message, errorType)
		{
			if(condition !== true)
			{
				Utils.exception(message, errorType || Error);
			}
		},
		assertFalse: function assertFalse(condition, message, errorType)
		{
			if(condition !== false)
			{
				Utils.exception(message, errorType || Error);
			}
		},
		asInteger: function asInteger(v)
		{
			return v | 0;
		},
		isValid: function isValid(o)
		{
			return o !== undefined && o !== null;
		},
		isInvalid: function isInvalid(o)
		{
			return o === undefined || o === null;
		},
		isSimple: function isSimple(o)
		{
			return o === undefined || o === null || typeof o === "string" || typeof o === "number" || typeof o === "boolean" || o instanceof Date;
		},
		isBoolean: function isBoolean(o)
		{
			return typeof o === "boolean";
		},
		isNumber: function isNumber(o)
		{
			return typeof o === "number";
		},
		isInteger: function isInteger(o)
		{
			return typeof o === "number" && isFinite(o) && Math.floor(o) === o;
		},
		isOdd: function isOdd(i)
		{
			return (i & 1) === 1;
		},
		isEven: function isEvent(i)
		{
			return (i & 1) === 0;
		},
		isString: function isString(o)
		{
			return typeof o === "string";
		},
		isDate: function isDate(o)
		{
			return o instanceof Date;
		},
		isRegExp: function isRegExp(o)
		{
			return o instanceof RegExp;
		},
		isObject: function isObject(o)
		{
			return typeof o === "object";
		},
		isFunction: function isFunction(o)
		{
			return typeof o === "function";
		},
		isArray: function isArray(o)
		{
			return o instanceof Array;
		},
		isSymbol: function isSymbol(o)
		{
			return typeof o === "symbol";
		},
		isArguments: function isArguments(o)
		{
			return o.constructor === Constants.ARGS_CONSTRUCTOR;
		},
		isInstanceOf: function isInstanceOf(o, type)
		{
			return o instanceof type;
		},
		isThenable: function isThenable(o)
		{
			return o && Utils.isFunction(o.then);
		},
		awaitValid: function awaitValid(o, at)
		{
			if(!Utils.isValid(o))
			{
				Utils.exception("Awaited a valid value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitSimple: function awaitSimple(o, at)
		{
			if(!Utils.isSimple(o))
			{
				Utils.exception("Awaited any simple value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitNotSimple: function awaitNotSimple(o, at)
		{
			if(Utils.isSimple(o))
			{
				Utils.exception("Awaited any not simple value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitMatch: function awaitMatch(s, rx, at)
		{
			Utils.awaitString(s);
			Utils.awaitRegExp(rx);
			if(!rx.test(s))
			{
				Utils.exception("Awaited a string matching the regexp: " + rx + "" + (at !== undefined ? (" at " + at) : "") + ", but got: " + s);
			}
			return s;
		},
		awaitBoolean: function awaitBoolean(o, at)
		{
			if(!Utils.isBoolean(o))
			{
				Utils.exception("Awaited a boolean value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitNumber: function awaitNumber(o, at)
		{
			if(!Utils.isNumber(o))
			{
				Utils.exception("Awaited a numeric value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitInteger: function awaitInteger(o, at)
		{
			if(!Utils.isInteger(o))
			{
				Utils.exception("Awaited an integer value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitString: function awaitString(o, at)
		{
			if(!Utils.isString(o))
			{
				Utils.exception("Awaited a string value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitObject: function awaitObject(o, at)
		{
			if(!Utils.isObject(o))
			{
				Utils.exception("Awaited an object value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitFunction: function awaitFunction(o, at)
		{
			if(!Utils.isFunction(o))
			{
				Utils.exception("Awaited a function value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitDate: function awaitDate(o, at)
		{
			if(!Utils.isDate(o))
			{
				Utils.exception("Awaited a date value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitRegExp: function awaitRegExp(o, at)
		{
			if(!Utils.isRegExp(o))
			{
				Utils.exception("Awaited a regexp value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitArray: function awaitArray(o, at)
		{
			if(!Utils.isArray(o))
			{
				Utils.exception("Awaited an array value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitArguments: function awaitArguments(o, at)
		{
			if(!Utils.isArguments(o))
			{
				Utils.exception("Awaited an arguments value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitIterable: function awaitIterable(o, at)
		{
			if(!Utils.isIterable(o))
			{
				Utils.exception("Awaited an iterable value" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitThenable: function awaitThenable(o, at)
		{
			if(!Utils.isThenable(o))
			{
				Utils.exception("Awaited a thenable value (instance with a property 'then' that points to a function(onFulfilled, onRejected){...})" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitInstanceOf: function awaitInstanceOf(o, type, at)
		{
			if(!Utils.isInstanceOf(o, type))
			{
				Utils.exception("Awaited a value of type '" + type.name + "'" + (at !== undefined ? (" at " + at) : "") + ", but got: " + objectToString.call(o), TypeError);
			}
			return o;
		},
		awaitCompatibility: function awaitCompatibility(o, keys, at)
		{
			if(!Utils.isCompatibleWith(o, keys))
			{
				Utils.exception("Awaited a value that has these properties '" + keys + "'" + (at !== undefined ? (" at " + at) : ""), TypeError);
			}
			return o;
		},
		awaitConstructionOf: function(self, type)
		{
			if(!(self instanceof type))
			{
				Utils.exception("Please use the 'new' operator, this object constructor cannot be called as a function: '" + (type.name) + "'", TypeError);
			}
			return self;
		},
		iterator: function iterator(src, offset, len)
		{
			if(src)
			{
				var iter;
				if(Utils.isFunction(src[iterableSymbol]))
				{
					return src[iterableSymbol].call(src);
				}
				else if(Utils.isArray(src) || Utils.isArguments(src))
				{
					offset = Math.max(0, offset || 0);
					len = Math.min(src.length, len || 0x7FFFFFFF);
					iter = {
						next: function()
						{
							return {
								done: (offset + 1) >= len,
								value: src[offset++]
							};
						}
					};
				}
			}
			iter = iter || {
				next: function()
				{
					return Constants.EMPTY_OBJECT;
				}
			};
			iter[iterableSymbol] = function()
			{
				return iter;
			};
			return iter;
		},
		isIterable: function isIterable(o)
		{
			if(Utils.isArray(o) || Utils.isArguments(o))
			{
				return true;
			}
			var iterator;
			if(o && (iterator = o[iterableSymbol]))
			{
				return Utils.isFunction(iterator.next);
			}
			return false;
		},
		extend: function extend(type, parent, opt)
		{
			Utils.awaitFunction(type, 1);
			Utils.awaitFunction(type, 2);
			type.prototype = Object.create(parent.prototype, Utils.isObject(opt) ? opt : Constants.EMPTY_OBJECT);
			type.prototype.constructor = type;
			return type;
		},
		randomString: function randomString(l, cs)
		{
			l = l || 6;
			var out = '';
			if(Utils.isArray(cs))
			{
				while(l--)
				{
					out += cs[0 | (Math.random() * cs.length)];
				}
			}
			else if(Utils.isString(cs) || cs === undefined)
			{
				cs = cs || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				while(l--)
				{
					out += cs.charAt(0 | (Math.random() * cs.length));
				}
			}
			return out;
		},
		deepCloneMarker: undefined, //deferred set
		deepCloneHelper: undefined, //deferred set
		deepClone: function deepClone(o, key, v, d)
		{
			if(Utils.isSimple(o))
			{
				return o;
			}
			d = (d || 0);
			v = v || [];
			key = key || Utils.deepCloneMarker;
			if(o[key] !== undefined)
			{
				return o[key];
			}
			v[v.length] = o;
			if(Utils.isFunction(o["clone"]))
			{
				return o[key] = o["clone"].clone();
			}
			else if(Utils.isArray(o))
			{
				var c = Utils.deepCloneHelper(o, []);
				o[key] = c;
				for(var i = 0, l = o.length; i < l; i++)
				{
					c[i] = Utils.deepClone(o[i], key, v, d + 1);
				}
			}
			else
			{
				var c = Utils.deepCloneHelper(o, o.constructor());
				o[key] = c;
				for(var k in o)
				{
					c[k] = Utils.deepClone(o[k], key, v, d + 1);
				}
			}
			if(!d)
			{
				for(var i = 0, l = v.length; i < l; i++)
				{
					v[i][key] = undefined;
				}
			}
			return c;
		},
		clone: function clone(o, c)
		{
			return Utils.merge(o, c || Utils.instantiate(o.constructor));
		},
		deepEqual: function deepEqual(a, b, stack)
		{
			if(a === b)
			{
				return true;
			}
			else if(Utils.isDate(a))
			{
				return Utils.isDate(b) && a.getTime() === b.getTime();
			}
			stack = stack || [];
			if(Utils.isArray(a))
			{
				if(Utils.isArray(b) && a.length === b.length)
				{
					if(stack.lastIndexOf(a) === -1)
					{
						stack[stack.length] = a;
						for(var i = 0, l = a.length; i < l; i++)
						{
							if(!Utils.deepEqual(a[i], b[i], stack))
							{
								return false;
							}
						}
						stack.length--;
					}
					return true;
				}
			}
			else if(Utils.isObject(a))
			{
				if(Utils.isObject(b) && a.constructor === b.constructor)
				{
					if(stack.lastIndexOf(a) === -1)
					{
						stack[stack.length] = a;
						for(var k in a)
						{
							if(k in b && !Utils.deepEqual(a[k], b[k], stack))
							{
								return false;
							}
						}
						stack.length--;
					}
					return true;
				}
			}
			return false;
		},
		wrapArguments: function wrapArguments(args, from, to, out)
		{
			Utils.awaitArguments(args, 1);
			from = 0 | Math.min(args.length, from || 0);
			to = 0 | Math.max(args.length, to || 0);
			var len = to - from;
			switch(out === undefined ? len : 10)
			{
				case 0:
					return Constants.EMPTY_ARRAY;
				case 1:
					return [args[from + 0]];
				case 2:
					return [args[from + 0], args[from + 1]];
				case 3:
					return [args[from + 0], args[from + 1], args[from + 2]];
				case 4:
					return [args[from + 0], args[from + 1], args[from + 2], args[from + 3]];
				case 5:
					return [args[from + 0], args[from + 1], args[from + 2], args[from + 3], args[from + 4]];
			}
			out = out || new Array(len >= 0 ? len : 0);
			for(var i = 0; i < len; i++)
			{
				out[i] = args[from + i];
			}
			return out;
		},
		instantiate: function instantiate(c, args)
		{
			Utils.awaitFunction(c, 1);
			if(Utils.isArray(args) && args.length)
			{
				switch(args.length)
				{
					case 1:
						return new c(args[0]);
					case 2:
						return new c(args[0], args[1]);
					case 3:
						return new c(args[0], args[1], args[2]);
					case 4:
						return new c(args[0], args[1], args[2], args[3]);
					case 5:
						return new c(args[0], args[1], args[2], args[3], args[4]);
				}
			}
			return new c();
		},
		merge: function merge(s, d)
		{
			for(var k in s)
			{
				s[k] = d[k];
			}
			return d;
		},
		isVariadic: function isVariadic(f)
		{
			/** a probabilistic version, because it doesn't match all cases (comments, literals etc.) */
			Utils.awaitFunction(f, 1);
			return f.toString().search(/[^\w\d_$\"']arguments[^\w\d_$\"']/m) > -1;
		},
		bindThis: function bindThis(h, f)
		{
			Utils.awaitFunction(f, 2);
			if(!Utils.isVariadic(f))
			{
				switch(f.length)
				{
					case 0:
						return function()
						{
							return f.call(h);
						};
					case 1:
						return function(a)
						{
							return f.call(h, a);
						};
					case 2:
						return function(a, b)
						{
							return f.call(h, a, b);
						};
					case 3:
						return function(a, b, c)
						{
							return f.call(h, a, b, c);
						};
					case 4:
						return function(a, b, c, d)
						{
							return f.call(h, a, b, c, d);
						};
					case 5:
						return function(a, b, c, d, e)
						{
							return f.call(h, a, b, c, d, e);
						};
				}
			}
			return function()
			{
				return f.apply(h, Utils.wrapArguments(arguments));
			};
		},
		bindArgs: function bindArgs(h, f, args)
		{
			Utils.awaitFunction(f, 2);
			args = Utils.isArguments(args) ? Utils.wrapArguments(args) : Utils.isArray(args) ? args : Utils.wrapArguments(arguments, 2);
			return function()
			{
				return f.apply(h, args);
			};
		},
		isCompatibleWith: function isCompatibleWith(h, keys)
		{
			Utils.awaitNotSimple(h, 1);
			if(!Utils.isArray(keys))
			{
				keys = Utils.wrapArguments(arguments, 1);
			}
			for(var i = 0, l = keys.length; i < l; i++)
			{
				if(!h.hasOwnProperty(keys[i]))
				{
					return false;
				}
			}
			return true;
		},
		remap: function remap(s, d, m)
		{
			Utils.awaitValid(s);
			Utils.awaitValid(d);
			Utils.awaitObject(m);
			for(var k in m)
			{
				d[m[k]] = s[k];
			}
			return d;
		},
		defineIfAbsent: function defineIfAbsent(h, k, v, o)
		{
			if(!h.hasOwnProperty(k))
			{
				Utils.define(h, k, v, o);
			}
			return h;
		},
		define: function define(h, k, v, o)
		{
			Utils.awaitValid(h, 1);
			Utils.awaitString(k, 2);
			o = o || {value: v};
			Object.defineProperty(h, k, o);
			return h;
		},
		defineGetter: function defineGetter(h, k, f, o)
		{
			Utils.awaitValid(h, 1);
			Utils.awaitString(k, 2);
			Utils.awaitFunction(f, 3);
			o = Utils.defineIfAbsent(o || {}, "get", f);
			Object.defineProperty(h, k, o);
			return h;
		},
		defineSetter: function defineSetter(h, k, f, o)
		{
			Utils.awaitValid(h, 1);
			Utils.awaitString(k, 2);
			Utils.awaitFunction(f, 3);
			o = Utils.defineIfAbsent(o || {}, "set", f);
			Object.defineProperty(h, k, o);
			return h;
		},
		compare: function compare(a, b)
		{
			return (a === b) ? 0 : a < b ? -1 : 1;
		},
		comparator: function comparator(fields, order, compare)
		{
			if(Utils.isFunction(order))
			{
				compare = order;
				order = Utils.ASC;
			}
			order = (order === "desc" || order === Constants.DESC) ? Constants.DESC : Constants.ASC;
			compare = compare || Utils.compare;
			if(Utils.isString(fields))
			{
				return order ? function(a, b)
				{ //desc
					return 0 - compare(a[fields], b[fields]);
				} : function(a, b)
				{ //asc
					return compare(a[fields], b[fields]);
				}
			}
			Utils.awaitArray(fields, 0);
			return function(a, b)
			{
				var c = 0, f;
				for(var i = 0, l = fields.length; i < l; i++)
				{
					f = fields[i];
					c = (order === Constants.ASC) ? compare(a[f], b[f]) : 0 - compare(a[f], b[f]);
					if(c)
					{
						return c;
					}
				}
				return c;
			};
		}
	};
	Utils.deepCloneHelper = (function()
	{
		var clonedMark = "";
		var clone = undefined;
		if(Utils.isFunction(window.Symbol))
		{
			clonedMark = Symbol.for("_" + Utils.randomString(12) + "_");
			clone = function(o, v)
			{
				o[clonedMark] = v;
				return v;
			};
		}
		else
		{
			var desc = {value: undefined, configurable: true};
			clonedMark = ("_" + Utils.randomString(12) + "_");
			clone = function(o, v)
			{
				desc.value = v;
				Object.defineProperty(o, clonedMark, desc);
				return v;
			};
		}
		Utils.deepCloneMarker = clonedMark;
		return clone;
	})();
	return Utils;
});
//######################################################################################
/**
 * Reworked version of B+ Tree of Graham O'Neill
 * Created by A.Hofmann on 15.03.2015.
 * <br/>
 B+ Tree processing
 Version 1.0.3
 Written by Graham O'Neill, April 2013
 http://goneill.co.nz/btree.php
 It's released under the MIT license,
 so feel free to use this as you wish but please don't claim it to be your own work,
 and if you use it in a real application please let me know so I can see it in use.
 If you find any bugs you can report them by using the Comments section below or the Contact page.
 */
mix.declare("mix.coll.BPlusTree", function()
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Leaf()
	{
		this.keyval = [];
		this.recnum = [];
		this.prevLf = null;
		this.nextLf = null;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	Leaf.prototype.isLeaf = function()
	{
		return true;
	};
	Leaf.prototype.getItem = function(key, near)
	{
		var arr = this.keyval;
		var low = 0, high = arr.length - 1, mid, midVal;
		while(low <= high)
		{
			mid = (low + high) >>> 1;
			midVal = arr[mid];
			if(midVal < key)
			{
				low = mid + 1;
			}
			else if(midVal > key)
			{
				high = mid - 1;
			}
			else
			{
				return mid; // key found
			}
		}
		if(near)
		{
			return low;
		}
		return -1;  // key not found.
	};
	Leaf.prototype.addKey = function(key, rec)
	{
		var keys = this.keyval;
		var low = 0, high = keys.length - 1, mid, midVal;
		while(low <= high)
		{
			mid = (low + high) >>> 1;
			midVal = keys[mid];
			if(midVal < key)
			{
				low = mid + 1;
			}
			else if(midVal > key)
			{
				high = mid - 1;
			}
			else
			{
				return mid;
			}
		}
		var values = this.values;
		for(var i = keys.length; i > low; i--)
		{
			keys[i] = keys[i - 1];
			values[i] = values[i - 1];
		}
		keys[low] = key;
		values[low] = rec;
		return low;
	};
	Leaf.prototype.split = function()
	{
		var mov = this.keyval.length >>> 1;
		var newLeaf = new Leaf();
		for(var i = mov - 1; i >= 0; i--)
		{
			newLeaf.keyval[i] = this.keyval.pop();
			newLeaf.recnum[i] = this.recnum.pop();
		}
		newLeaf.prevLf = this;
		newLeaf.nextLf = this.nextLf;
		if(this.nextLf !== null)
		{
			this.nextLf.prevLf = newLeaf;
		}
		this.nextLf = newLeaf;
		return newLeaf;
	};
	Leaf.prototype.merge = function(frNod, paNod, frKey)
	{
		for(var i = 0, len = frNod.keyval.length; i < len; i++)
		{
			this.keyval[this.keyval.length] = frNod.keyval[i];
			this.recnum[this.recnum.length] = frNod.recnum[i];
		}
		this.nextLf = frNod.nextLf;
		if(frNod.nextLf !== null)
		{
			frNod.nextLf.prevLf = this;
		}
		frNod.prevLf = null;
		frNod.nextLf = null;
		var parentNodeLen = paNod.keyval.length - 1;
		for(var i = parentNodeLen; i >= 0; i--)
		{
			if(paNod.keyval[i] == frKey)
			{
				parentNodeLen = i;
				break;
			}
		}
		for(var i = parentNodeLen, len = paNod.keyval.length - 1; i < len; i++)
		{
			paNod.keyval[i] = paNod.keyval[i + 1];
			paNod.nodptr[i + 1] = paNod.nodptr[i + 2];
		}
		paNod.keyval.pop();
		paNod.nodptr.pop();
	};
	//-----------------------------------------------------------------------------------------------------------------------
	function Node()
	{
		this.keyval = [];
		this.nodptr = [];
	};
	//-----------------------------------------------------------------------------------------------------------------------
	Node.prototype.isLeaf = function()
	{
		return false;
	};
	Node.prototype.getItem = function(key)
	{
		//TODO optimize
		var keys = this.keyval;
		for(var i = 0, len = keys.length; i < len; i++)
		{
			if(keys[i] > key)
			{
				return i;
			}
		}
		return keys.length;
	};
	Node.prototype.addKey = function(key, ptrL, ptrR)
	{
		var keys = this.keyval;
		var itm = keys.length;
		//TODO optimize
		for(var i = 0, len = keys.length; i < len; i++)
		{
			if(key <= keys[i])
			{
				itm = i;
				break;
			}
		}
		for(var i = keys.length; i > itm; i--)
		{
			keys[i] = keys[i - 1];
			this.nodptr[i + 1] = this.nodptr[i];
		}
		keys[itm] = key;
		this.nodptr[itm] = ptrL;
		this.nodptr[itm + 1] = ptrR;
	};
	Node.prototype.split = function()
	{
		var mov = ((this.keyval.length >>> 1) + (this.keyval.length & 1)) - 1; //Math.ceil(this.keyval.length/2) - 1;
		var newNode = new Node();
		newNode.nodptr[mov] = this.nodptr.pop();
		for(var i = mov - 1; i >= 0; i--)
		{
			newNode.keyval[i] = this.keyval.pop();
			newNode.nodptr[i] = this.nodptr.pop();
		}
		return newNode;
	};
	Node.prototype.merge = function(frNod, paNod, paItm)
	{
		var del = paNod.keyval[paItm];
		this.keyval.push(del);
		for(var i = 0, len = frNod.keyval.length; i < len; i++)
		{
			this.keyval.push(frNod.keyval[i]);
			this.nodptr.push(frNod.nodptr[i]);
		}
		this.nodptr.push(frNod.nodptr[frNod.nodptr.length - 1]);
		for(var i = paItm, len = paNod.keyval.length - 1; i < len; i++)
		{
			paNod.keyval[i] = paNod.keyval[i + 1];
			paNod.nodptr[i + 1] = paNod.nodptr[i + 2];
		}
		paNod.keyval.pop();
		paNod.nodptr.pop();
		return del;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	function BPlusTree(order)
	{
		order = Math.max(3, 0 | order);
		// Private
		this.root = new Leaf();
		this.maxkey = order - 1;
		this.minkyl = order >>> 1;
		this.minkyn = this.maxkey >>> 1;
		this.leaf = null;
		this.item = -1;
		// Public
		this.keyval = '';
		this.recnum = -1;
		this.length = 0;
		this.eof = true;
		this.found = false;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	BPlusTree.prototype.insert = function(key, rec)
	{
		var stack = [];
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			stack.push(this.leaf);
			this.item = this.leaf.getItem(key);
			this.leaf = this.leaf.nodptr[this.item];
		}
		this.item = this.leaf.addKey(key, rec);
		this.keyval = key;
		this.eof = false;
		if(this.item === -1)
		{
			this.found = true;
			this.item = this.leaf.getItem(key, false);
			this.recnum = this.leaf.recnum[this.item];
		}
		else
		{
			this.found = false;
			this.recnum = rec;
			this.length++;
			if(this.leaf.keyval.length > this.maxkey)
			{
				var pL = this.leaf;
				var pR = this.leaf.split();
				var ky = pR.keyval[0];
				this.item = this.leaf.getItem(key, false);
				if(this.item === -1)
				{
					this.leaf = this.leaf.nextLf;
					this.item = this.leaf.getItem(key, false);
				}
				while(true)
				{
					if(stack.length === 0)
					{
						var newN = new Node();
						newN.keyval[0] = ky;
						newN.nodptr[0] = pL;
						newN.nodptr[1] = pR;
						this.root = newN;
						break;
					}
					var nod = stack.pop();
					nod.addKey(ky, pL, pR);
					if(nod.keyval.length <= this.maxkey)
					{
						break;
					}
					pL = nod;
					pR = nod.split();
					ky = nod.keyval.pop();
				}
			}
		}
		return (!this.found);
	};
	BPlusTree.prototype.remove = function(key)
	{
		if(key === undefined)
		{
			if(this.item === -1)
			{
				this.eof = true;
				this.found = false;
				return false;
			}
			key = this.leaf.keyval[this.item];
		}
		this._del(key);
		if(!this.found)
		{
			this.item = -1;
			this.eof = true;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.seek(key, true);
			this.found = true;
		}
		return (this.found);
	};
	BPlusTree.prototype.seek = function(key, near)
	{
		near = !!near;
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			this.item = this.leaf.getItem(key);
			this.leaf = this.leaf.nodptr[this.item];
		}
		this.item = this.leaf.getItem(key, near);
		if(near && this.item === -1 && this.leaf.nextLf !== null)
		{
			this.leaf = this.leaf.nextLf;
			this.item = 0;
		}
		if(this.item === -1)
		{
			this.eof = true;
			this.keyval = '';
			this.found = false;
			this.recnum = -1;
		}
		else
		{
			this.eof = false;
			this.found = (this.leaf.keyval[this.item] === key);
			this.keyval = this.leaf.keyval[this.item];
			this.recnum = this.leaf.recnum[this.item];
		}
		return (!this.eof);
	};
	BPlusTree.prototype.skip = function(count)
	{
		count = count | 0;
		//		if (typeof count !== 'number'){ count = 1; }
		if(this.item === -1 || this.leaf === null)
		{
			this.eof = true;
		}
		if(count > 0)
		{
			while(!this.eof && this.leaf.keyval.length - this.item - 1 < count)
			{
				count = count - this.leaf.keyval.length + this.item;
				this.leaf = this.leaf.nextLf;
				if(this.leaf === null)
				{
					this.eof = true;
				}
				else
				{
					this.item = 0;
				}
			}
			if(!this.eof)
			{
				this.item = this.item + count;
			}
		}
		else
		{
			count = -count;
			while(!this.eof && this.item < count)
			{
				count = count - this.item - 1;
				this.leaf = this.leaf.prevLf;
				if(this.leaf === null)
				{
					this.eof = true;
				}
				else
				{
					this.item = this.leaf.keyval.length - 1;
				}
			}
			if(!this.eof)
			{
				this.item = this.item - count;
			}
		}
		if(this.eof)
		{
			this.item = -1;
			this.found = false;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.found = true;
			this.keyval = this.leaf.keyval[this.item];
			this.recnum = this.leaf.recnum[this.item];
		}
		return (this.found);
	};
	BPlusTree.prototype.goto = function(count)
	{
		if(count < 0)
		{
			this.goBottom();
			if(!this.eof)
			{
				this.skip(count + 1);
			}
		}
		else
		{
			this.goTop();
			if(!this.eof)
			{
				this.skip(count - 1);
			}
		}
		return (this.found);
	};
	BPlusTree.prototype.keynum = function()
	{
		if(this.leaf === null || this.item === -1)
		{
			return -1;
		}
		var count = this.item + 1;
		var ptr = this.leaf;
		while(ptr.prevLf !== null)
		{
			ptr = ptr.prevLf;
			count += ptr.keyval.length;
		}
		return count;
	};
	BPlusTree.prototype.goTop = function()
	{
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			this.leaf = this.leaf.nodptr[0];
		}
		if(this.leaf.keyval.length === 0)
		{
			this.item = -1;
			this.eof = true;
			this.found = false;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.item = 0;
			this.eof = false;
			this.found = true;
			this.keyval = this.leaf.keyval[0];
			this.recnum = this.leaf.recnum[0];
		}
		return (this.found);
	};
	BPlusTree.prototype.goBottom = function()
	{
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			this.leaf = this.leaf.nodptr[this.leaf.nodptr.length - 1];
		}
		if(this.leaf.keyval.length === 0)
		{
			this.item = -1;
			this.eof = true;
			this.found = false;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.item = this.leaf.keyval.length - 1;
			this.eof = false;
			this.found = true;
			this.keyval = this.leaf.keyval[this.item];
			this.recnum = this.leaf.recnum[this.item];
		}
		return (this.found);
	};
	BPlusTree.prototype.pack = function()
	{
		this.goTop(0);
		if(this.leaf === this.root)
		{
			return;
		}
		// Pack leaves
		var toN = new Leaf();
		var toI = 0;
		var frN = this.leaf;
		var frI = 0;
		var parKey = [];
		var parNod = [];
		while(true)
		{
			toN.keyval[toI] = frN.keyval[frI];
			toN.recnum[toI] = frN.recnum[frI];
			if(toI === 0)
			{
				parNod.push(toN);
			}
			if(frI === frN.keyval.length - 1)
			{
				if(frN.nextLf === null)
				{
					break;
				}
				frN = frN.nextLf;
				frI = 0;
			}
			else
			{
				frI++;
			}
			if(toI === this.maxkey - 1)
			{
				var tmp = new Leaf();
				toN.nextLf = tmp;
				tmp.prevLf = toN;
				toN = tmp;
				toI = 0;
			}
			else
			{
				toI++;
			}
		}
		var mov = this.minkyl - toN.keyval.length;
		frN = toN.prevLf;
		if(mov > 0 && frN !== null)
		{
			for(var i = toN.keyval.length - 1; i >= 0; i--)
			{
				toN.keyval[i + mov] = toN.keyval[i];
				toN.recnum[i + mov] = toN.recnum[i];
			}
			for(var i = mov - 1; i >= 0; i--)
			{
				toN.keyval[i] = frN.keyval.pop();
				toN.recnum[i] = frN.recnum.pop();
			}
		}
		for(i = 1, len = parNod.length; i < len; i++)
		{
			parKey.push(parNod[i].keyval[0]);
		}
		parKey[parKey.length] = null;
		// Rebuild nodes
		var kidKey, kidNod;
		while(parKey[0] !== null)
		{
			kidKey = parKey;
			kidNod = parNod;
			parKey = [];
			parNod = [];
			var toI = this.maxkey + 1;
			for(var i = 0, len = kidKey.length; i < len; i++)
			{
				if(toI > this.maxkey)
				{
					toN = new Node();
					toI = 0;
					parNod.push(toN);
				}
				toN.keyval[toI] = kidKey[i];
				toN.nodptr[toI] = kidNod[i];
				toI++;
			}
			mov = this.minkyn - toN.keyval.length + 1;
			if(mov > 0 && parNod.length > 1)
			{
				for(var i = toN.keyval.length - 1; i >= 0; i--)
				{
					toN.keyval[i + mov] = toN.keyval[i];
					toN.nodptr[i + mov] = toN.nodptr[i];
				}
				frN = parNod[parNod.length - 2];
				for(var i = mov - 1; i >= 0; i--)
				{
					toN.keyval[i] = frN.keyval.pop();
					toN.nodptr[i] = frN.nodptr.pop();
				}
			}
			for(var i = 0, len = parNod.length; i < len; i++)
			{
				parKey.push(parNod[i].keyval.pop());
			}
		}
		this.root = parNod[0];
		this.goTop();
		return (this.found);
	};
	// ----- Deletion methods -----
	BPlusTree.prototype._del = function(key)
	{
		var stack = [];
		var parNod = null;
		var parPtr = -1;
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			stack.push(this.leaf);
			parNod = this.leaf;
			parPtr = this.leaf.getItem(key);
			this.leaf = this.leaf.nodptr[parPtr];
		}
		this.item = this.leaf.getItem(key, false);
		// Key not in tree
		if(this.item === -1)
		{
			this.found = false;
			return;
		}
		this.found = true;
		// Delete key from leaf
		for(var i = this.item, len = this.leaf.keyval.length - 1; i < len; i++)
		{
			this.leaf.keyval[i] = this.leaf.keyval[i + 1];
			this.leaf.recnum[i] = this.leaf.recnum[i + 1];
		}
		this.leaf.keyval.pop();
		this.leaf.recnum.pop();
		this.length--;
		// Leaf still valid: done
		if(this.leaf === this.root)
		{
			return;
		}
		if(this.leaf.keyval.length >= this.minkyl)
		{
			if(this.item === 0)
			{
				this._fixNodes(stack, key, this.leaf.keyval[0]);
			}
			return;
		}
		var delKey;
		// Steal from left sibling if possible
		var sibL = (parPtr === 0) ? null : parNod.nodptr[parPtr - 1];
		if(sibL !== null && sibL.keyval.length > this.minkyl)
		{
			delKey = (this.item === 0) ? key : this.leaf.keyval[0];
			for(var i = this.leaf.keyval.length; i > 0; i--)
			{
				this.leaf.keyval[i] = this.leaf.keyval[i - 1];
				this.leaf.recnum[i] = this.leaf.recnum[i - 1];
			}
			this.leaf.keyval[0] = sibL.keyval.pop();
			this.leaf.recnum[0] = sibL.recnum.pop();
			this._fixNodes(stack, delKey, this.leaf.keyval[0]);
			return;
		}
		// Steal from right sibling if possible
		var sibR = (parPtr == parNod.keyval.length) ? null : parNod.nodptr[parPtr + 1];
		if(sibR !== null && sibR.keyval.length > this.minkyl)
		{
			this.leaf.keyval.push(sibR.keyval.shift());
			this.leaf.recnum.push(sibR.recnum.shift());
			if(this.item === 0)
			{
				this._fixNodes(stack, key, this.leaf.keyval[0]);
			}
			this._fixNodes(stack, this.leaf.keyval[this.leaf.keyval.length - 1], sibR.keyval[0]);
			return;
		}
		// Merge left to make one leaf
		if(sibL !== null)
		{
			delKey = (this.item === 0) ? key : this.leaf.keyval[0];
			sibL.merge(this.leaf, parNod, delKey);
			this.leaf = sibL;
		}
		else
		{
			delKey = sibR.keyval[0];
			this.leaf.merge(sibR, parNod, delKey);
			if(this.item === 0)
			{
				this._fixNodes(stack, key, this.leaf.keyval[0]);
			}
		}
		if(stack.length === 1 && parNod.keyval.length === 0)
		{
			this.root = this.leaf;
			return;
		}
		var curNod = stack.pop();
		var parItm;
		// Update all nodes
		while(curNod.keyval.length < this.minkyn && stack.length > 0)
		{
			parNod = stack.pop();
			parItm = parNod.getItem(delKey);
			// Steal from right sibling if possible
			sibR = (parItm == parNod.keyval.length) ? null : parNod.nodptr[parItm + 1];
			if(sibR !== null && sibR.keyval.length > this.minkyn)
			{
				curNod.keyval.push(parNod.keyval[parItm]);
				parNod.keyval[parItm] = sibR.keyval.shift();
				curNod.nodptr.push(sibR.nodptr.shift());
				break;
			}
			// Steal from left sibling if possible
			sibL = (parItm === 0) ? null : parNod.nodptr[parItm - 1];
			if(sibL !== null && sibL.keyval.length > this.minkyn)
			{
				for(var i = curNod.keyval.length; i > 0; i--)
				{
					curNod.keyval[i] = curNod.keyval[i - 1];
				}
				for(var i = curNod.nodptr.length; i > 0; i--)
				{
					curNod.nodptr[i] = curNod.nodptr[i - 1];
				}
				curNod.keyval[0] = parNod.keyval[parItm - 1];
				parNod.keyval[parItm - 1] = sibL.keyval.pop();
				curNod.nodptr[0] = sibL.nodptr.pop();
				break;
			}
			// Merge left to make one node
			if(sibL !== null)
			{
				delKey = sibL.merge(curNod, parNod, parItm - 1);
				curNod = sibL;
			}
			else if(sibR !== null)
			{
				delKey = curNod.merge(sibR, parNod, parItm);
			}
			// Next level
			if(stack.length === 0 && parNod.keyval.length === 0)
			{
				this.root = curNod;
				break;
			}
			curNod = parNod;
		}
	};
	BPlusTree.prototype._fixNodes = function(stk, frKey, toKey)
	{
		var values, lvl = stk.length, mor = true;
		do{
			lvl--;
			values = stk[lvl].keyval;
			for(var i = values.length - 1; i >= 0; i--)
			{
				if(values[i] == frKey)
				{
					values[i] = toKey;
					mor = false;
					break;
				}
			}
		}
		while(mor && lvl > 0);
	}
	return BPlusTree;
});
//######################################################################################
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
//######################################################################################
mix.declare("mix.coll.MultiMap", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	var isSymbolAvailable = Detector.symbol.has("for");
	var hashSymbol = isSymbolAvailable ? window.Symbol.for("_hash_") : "_hash_";
	var hashFn = isSymbolAvailable ? window.Symbol.for("_hashFn_") : "_hashFn_";
	var bucketsCount = isSymbolAvailable ? window.Symbol.for("_bucketsCount_") : "_bucketsCount_";
	var valuesCount = isSymbolAvailable ? window.Symbol.for("_valuesCount_") : "_valuesCount_";
	var iteratorSymbol = Detector.symbol.iterator ? window.Symbol.iterator : "@@iterator";

	function hashCode(o)
	{
		return o;
	}

	function MultiMap(hashCodeFn)
	{
		this[hashFn] = Utils.isFunction(hashCodeFn) ? hashCodeFn : hashCode;
		this[hashSymbol] = {};
		this[bucketsCount] = 0;
		this[valuesCount] = 0;
	}

	MultiMap.prototype.hash = function hash()
	{
		return this[hashSymbol];
	};
	MultiMap.prototype.key = function key(k)
	{
		return this[hashFn](k);
	};
	MultiMap.prototype.add = function add(k, v)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		if(bucket === undefined)
		{
			hash[key] = bucket = [];
			this[bucketsCount] += 1;
		}
		if(arguments.length > 2)
		{
			for(var i = 0, o = bucket.length, l = arguments.length; i < l; i++)
			{
				bucket[i + o] = arguments[1 + i];
			}
			this[valuesCount] += (l - 1);
		}
		else
		{
			bucket[bucket.length] = v;
			this[valuesCount] += 1;
		}
		return this;
	};
	/**
	 * Iterates over all elements in this map
	 * @param fn a function(value, key, map)
	 * @param thisArg to be used as <b>this</b> for callback call
	 * @returns {MultiMap} this
	 */
	MultiMap.prototype.forEach = function forEach(fn, thisArg)
	{
		Utils.awaitFunction(fn);
		var hash = this.hash();
		for(var k in hash)
		{
			fn.call(thisArg, hash[k], k, this);
		}
		return this;
	};
	MultiMap.prototype.set = function set(k, v)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		v = Utils.isArray(v) ? v : [v];
		var diff = v.length;
		if(bucket !== undefined)
		{
			diff -= bucket.length;
		}
		else
		{
			this[bucketsCount] += 1;
		}
		hash[key] = v;
		this[valuesCount] += diff;
		return this;
	};
	MultiMap.prototype.get = function get(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		return bucket || Constants.EMPTY_ARRAY;
	};
	MultiMap.prototype["delete"] = function(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		var bucket = hash[key];
		if(bucket !== undefined)
		{
			delete hash[key];
			this[valuesCount] -= bucket.length;
			this[bucketsCount] -= 1;
			return true;
		}
		return false;
	};
	MultiMap.prototype.entries = MultiMap.prototype[iteratorSymbol] = function entries()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function EntryInterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : [keys[index], hash[keys[index++]]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	MultiMap.prototype.keys = function keys()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function KeyIterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : keys[index++]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	MultiMap.prototype.values = function values()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function ValueIterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : hash[keys[index++]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	MultiMap.prototype.has = function has(k)
	{
		"use strict";
		return this.key(k) in this.hash();
	};
	MultiMap.prototype.clear = function clear()
	{
		"use strict";
		var hash = this.hash();
		for(var k in hash)
		{
			delete hash[k];
		}
		this[valuesCount] = this[bucketsCount] = 0;
		return this;
	};
	MultiMap.prototype.toString = function toString()
	{
		return "[object MultiMap]";
	};
	MultiMap.prototype.clone = function clone()
	{
		var hash = this.hash();
		var c = new MultiMap(this[hashFn]);
		for(var k in hash)
		{
			c.set(k, hash[k].concat());
		}
		return c;
	};
	Object.defineProperty(MultiMap.prototype, "size", {
		get: function size()
		{
			"use strict";
			return this[bucketsCount];
		}
	});
	Object.defineProperty(MultiMap.prototype, "count", {
		get: function count()
		{
			"use strict";
			return this[valuesCount];
		}
	});
	return MultiMap;
});
//######################################################################################
mix.declare("mix.coll.SimpleMap", ["mix.Utils", "mix.Detector"], function(Utils, Detector)
{
	"use strict";
	var isSymbolAvailable = Detector.symbol.has("for");
	var hashSymbol = isSymbolAvailable ? window.Symbol.for("_hash_") : "_hash_";
	var sizeSymbol = isSymbolAvailable ? window.Symbol.for("_size_") : "_size_";
	var hashFn = isSymbolAvailable ? window.Symbol.for("_hashFn_") : "_hashFn_";
	var iteratorSymbol = Detector.symbol.iterator ? window.Symbol.iterator : "@@iterator";

	function hashCode(o)
	{
		return o;
	}

	function SimpleMap(hashCodeFn)
	{
		this[hashFn] = Utils.isFunction(hashCodeFn) ? hashCodeFn : hashCode;
		this[hashSymbol] = {};
		this[sizeSymbol] = 0;
	}

	SimpleMap.prototype.hash = function hash()
	{
		return this[hashSymbol];
	};
	SimpleMap.prototype.key = function key(k)
	{
		return this[hashFn](k);
	};
	/**
	 * Iterates over all elements in this map
	 * @param fn a function(value, key, map)
	 * @param thisArg to be used as <b>this</b> for callback call
	 * @returns {SimpleMap} this
	 */
	SimpleMap.prototype.forEach = function forEach(fn, thisArg)
	{
		Utils.awaitFunction(fn);
		var hash = this.hash();
		for(var k in hash)
		{
			fn.call(thisArg, hash[k], k, this);
		}
		return this;
	};
	SimpleMap.prototype.set = function set(k, v)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		if(!(key in hash))
		{
			this[sizeSymbol] += 1;
		}
		hash[key] = v;
		return this;
	};
	SimpleMap.prototype.get = function get(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		return hash[key] || null;
	};
	SimpleMap.prototype["delete"] = function(k)
	{
		"use strict";
		var key = this.key(k);
		var hash = this.hash();
		if(key in hash)
		{
			delete hash[key];
			this[sizeSymbol] -= 1;
			return true;
		}
		return false;
	};
	SimpleMap.prototype.entries = SimpleMap.prototype[iteratorSymbol] = function entries()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function EntryInterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : [keys[index], hash[keys[index++]]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SimpleMap.prototype.keys = function keys()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function KeyIterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : keys[index++]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SimpleMap.prototype.values = function values()
	{
		"use strict";
		var index = 0;
		var hash = this.hash();
		var keys = Object.keys(hash);
		var iter = {
			next: function ValueIterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : hash[keys[index++]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SimpleMap.prototype.has = function has(k)
	{
		"use strict";
		return this.key(k) in this.hash();
	};
	SimpleMap.prototype.clear = function clear()
	{
		"use strict";
		var hash = this.hash();
		for(var k in hash)
		{
			delete hash[k];
		}
		this[sizeSymbol] = 0;
		return this;
	};
	SimpleMap.prototype.toString = function toString()
	{
		return "[object SimpleMap]";
	};
	SimpleMap.prototype.clone = function clone()
	{
		var hash = this.hash();
		var c = new SimpleMap(this[hashFn]);
		for(var k in hash)
		{
			c.set(k, hash[k]);
		}
		return c;
	};
	Object.defineProperty(SimpleMap.prototype, "size", {
		get: function size()
		{
			"use strict";
			return this[sizeSymbol];
		}
	});
	return SimpleMap;
});
//######################################################################################
mix.declare("mix.coll.SortedMap", ["mix.Utils", "mix.Detector"], function(Utils, Detector)
{
	"use strict";
	var isSymbolAvailable = Detector.symbol.has("for");
	var keySymbol = isSymbolAvailable ? window.Symbol.for("_keys_") : "_keys_";
	var valueSymbol = isSymbolAvailable ? window.Symbol.for("_values_") : "_values_";
	var comparatorSymbol = isSymbolAvailable ? window.Symbol.for("_comparator_") : "_comparator_";
	var iteratorSymbol = Detector.symbol.iterator ? window.Symbol.iterator : "@@iterator";

	function SortedMap(comparator, keys, values)
	{
		this[comparatorSymbol] = Utils.isFunction(comparator) ? comparator : Utils.compare;
		if(Utils.isArray(keys))
		{
			if(Utils.isArray(values))
			{
				this[keySymbol] = keys;
				this[valueSymbol] = values;
				for(var i = 0, l = 0 | Math.min(keys.length, values.length); i < l; i++)
				{
					this.set(keys[i], values[i]);
				}
			}
			else if(Utils.isEven(keys.length))
			{
				for(var i = 0, l = 0 | Math.min(keys.length, values.length); i < l; i += 2)
				{
					this.set(keys[i], values[i + 1]);
				}
			}
		}
		else
		{
			this[keySymbol] = [];
			this[valueSymbol] = [];
		}
	}

	SortedMap.prototype.at = function at(idx)
	{
		"use strict";
		var keys = this[keySymbol];
		var values = this[valueSymbol];
		return [keys[idx], values[idx]];
	};
	SortedMap.prototype.min = function min()
	{
		"use strict";
		var keys = this[keySymbol];
		return keys.length > 0 ? keys[0] : undefined;
	};
	SortedMap.prototype.max = function max()
	{
		"use strict";
		var keys = this[keySymbol];
		return keys.length > 0 ? keys[keys.length - 1] : undefined;
	};
	SortedMap.prototype.index = function index(k)
	{
		"use strict";
		var keys = this[keySymbol];
		var comparator = this[comparatorSymbol];
		return Utils.binarySearch(keys, 0, keys.length, k, comparator);
	};
	SortedMap.prototype.set = function set(k, v)
	{
		"use strict";
		var idx = this.index(k);
		if(idx > -1)
		{
			this[valueSymbol][idx] = v;
		}
		else
		{
			idx = 0 - (idx + 1);
			this[keySymbol].splice(idx, 0, k);
			this[valueSymbol].splice(idx, 0, v);
		}
		return this;
	};
	SortedMap.prototype.get = function get(k)
	{
		"use strict";
		var idx = this.index(k);
		if(idx > -1)
		{
			return this[valueSymbol][idx];
		}
		return null;
	};
	SortedMap.prototype["delete"] = function(k)
	{
		"use strict";
		var idx = this.index(k);
		if(idx > -1)
		{
			this[keySymbol].splice(idx, 1);
			this[valueSymbol].splice(idx, 1);
			return true;
		}
		return false;
	};
	SortedMap.prototype.entries = SortedMap.prototype[iteratorSymbol] = function entries()
	{
		"use strict";
		var index = 0;
		var keys = this[keySymbol];
		var values = this[valueSymbol];
		var iter = {
			next: function EntryInterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : [keys[index], values[index++]]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SortedMap.prototype.keys = function keys()
	{
		"use strict";
		var index = 0;
		var keys = this[keySymbol];
		var iter = {
			next: function KeyIterator()
			{
				var done = index >= keys.length;
				return {
					done: done,
					value: done ? undefined : keys[index++]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	SortedMap.prototype.values = function values()
	{
		"use strict";
		var index = 0;
		var values = this[valueSymbol];
		var iter = {
			next: function ValueIterator()
			{
				var done = index >= values.length;
				return {
					done: done,
					value: done ? undefined : values[index++]
				};
			}
		};
		iter[iteratorSymbol] = function()
		{
			return iter;
		};
		return iter;
	};
	/**
	 * Iterates over all elements in this map
	 * @param fn a function(value, key, map)
	 * @param thisArg to be used as <b>this</b> for callback call
	 * @returns {SortedMap} this
	 */
	SortedMap.prototype.forEach = function forEach(fn, thisArg)
	{
		Utils.awaitFunction(fn);
		var keys = this[keySymbol];
		var values = this[valueSymbol];
		for(var i = 0, l = keys.length; i < l; i++)
		{
			fn.call(thisArg, values[i], keys[i], this);
		}
		return this;
	};
	SortedMap.prototype.has = function has(k)
	{
		"use strict";
		return this.index(k) > -1;
	};
	SortedMap.prototype.clear = function clear()
	{
		"use strict";
		this[keySymbol].length = this[valueSymbol].length = 0;
		return this;
	};
	SortedMap.prototype.clone = function clone()
	{
		var c = new SortedMap(this[comparatorSymbol]);
		Array.prototype.push(c[keySymbol], this[keySymbol]);
		Array.prototype.push(c[valueSymbol], this[valueSymbol]);
		return c;
	};
	SortedMap.prototype.toString = function toString()
	{
		return "[object SortedMap]";
	};
	Object.defineProperty(SortedMap.prototype, "size", {
		get: function size()
		{
			"use strict";
			return this[keySymbol].length;
		}
	});
	return SortedMap;
});
//######################################################################################
/**
 * Created by A.Hofmann on 16.03.2015.
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
//######################################################################################
/**
 * Created by A.Hofmann on 06.03.2015.
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
//######################################################################################
/**
 * Created by A.Hofmann on 06.03.2015.
 */
mix.declare("mix.event.Event", function()
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Event(type, target)
	{
		this.type = type;
		this.target = target;
	}

	//-----------------------------------------------------------------------------------------------------------------------
	Event.create = function create(type, target)
	{
		return new Event(type, target);
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Event;
});
//######################################################################################
/**
 * Created by A.Hofmann on 06.03.2015.
 */
mix.declare("mix.event.PropertyChangeEvent", ["mix.event.Event"], function(Event)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function PropertyChangeEvent(type, source, property, oldValue, newValue)
	{
		Event.call(this, type, source);
		this.property = property;
		this.oldValue = oldValue;
		this.newValue = newValue;
	}

	PropertyChangeEvent.prototype = Object.create(Event.prototype);
	PropertyChangeEvent.prototype.constructor = PropertyChangeEvent;
	//-----------------------------------------------------------------------------------------------------------------------
	return PropertyChangeEvent;
});
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */
/**
 * Created by A.Hofmann on 06.03.2015.
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
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 06.03.2015.
 */
mix.declare("mix.model.Model", ["mix.model.Config", "mix.event.Dispatcher", "mix.Utils", "mix.Constants", "mix.Detector", "mix.model.Property"], function(ModelConfig, Dispatcher, Utils, Constants, Detector, Property)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Model()
	{
		this.bindable = false;
		this.dataSymbol = ModelConfig.dataSymbol;
		this.dispatcherSymbol = ModelConfig.dispatcherSymbol;
	}

	/**
	 * Retrieves data that holds internal state of the given model
	 * @param val a model instance
	 * @return {Object} internal data storage
	 */
	Model.prototype.data = function data(val)
	{
		return val[this.dataSymbol];
	};
	/**
	 * Retrieves dispatcher of the given model instance
	 * @param val a model instance
	 * @return {mix.event.Dispatcher} internal dispatcher
	 */
	Model.prototype.dispatcher = function dispatcher(val)
	{
		return val[this.dispatcherSymbol];
	};
	//-----------------------------------------------------------------------------------------------------------------------
	Model.property = function()
	{
		return new Property();
	};
	/**
	 *
	 * @param cnstr
	 * @param parent
	 * @param def
	 * @returns {ExtendedModel}
	 */
	Model.extend = function extend(parent, def)
	{
		switch((parent ? 1 : 0) + (def ? 1 : 0))
		{
			case 1:
			{
				def = Utils.awaitObject(parent, 1);
				parent = Object;
			}
				break;
			case 2:
			{
				parent = Utils.awaitFunction(parent, 1);
				def = Utils.awaitObject(def, 2);
			}
				break;
			default:
			{
				throw new Error("Invalid parameter list.");
			}
		}
		var desc = {}, initLst = [], model = new Model(), isDispatcher = (parent instanceof Dispatcher);
		for(var name in def)
		{
			var member = def[name].name(name).freeze(model);
			if(member instanceof Property)
			{
				if(member._bindable)
				{
					model.bindable = true;
				}
				if(Utils.isFunction(member.factory()))
				{
					initLst.push(member);
				}
			}
			desc[name] = member.build();
		}
		function ExtendedModel()
		{
			parent.call(this);
			ModelConfig.dataSetup(this, {});
			if(model.bindable)
			{
				ModelConfig.dispatcherSetup(this, isDispatcher ? this : new Dispatcher(this));
			}
			for(var i = 0, l = initLst.length; i < l; i++)
			{
				var prop = initLst[i];
				prop._factory.call(prop, this);
			}
		}

		ExtendedModel.prototype = Object.create(parent.prototype, desc);
		ExtendedModel.prototype.constructor = ExtendedModel;
		ExtendedModel.model = model;
		return ExtendedModel;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Model;
});
//######################################################################################
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
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 13.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 13.03.2015.
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
//######################################################################################
/**
 * Created by A.Hofmann on 13.03.2015.
 */
mix.declare("mix.net.URL", ["mix.Utils"], function(Utils)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	/*
	 https://developer.mozilla.org/en-US/docs/Web/API/URLUtils
	 */
	//IPv4: (\d{1,3}(?:\.\d{1,3}){3})
	//IPv6: (?:\[?((?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){7}))\]?)
	//-----------------------------------------------------------------------------------------------------------------------
	var searchRe = /(?:[\?&]((?:[^=&%!\*\'\(\) ;:@\+$,\/\?#\[\]]|%[0-9a-f]{2})+)=((?:[^=&%!\*\'\(\) ;:@\+$,\/\?#\[\]]|%[0-9a-f]{2})+))/gi;
	//-----------------------------------------------------------------------------------------------------------------------
	function URLSearch(s)
	{
		if(!(this instanceof URLSearch))
		{
			return new URLSearch(s);
		}
		this.data = {};
		if(!Utils.isString(s))
		{
			return;
		}
		var idx = 0, result, regex = searchRe;
		//Reset pattern ...
		regex.lastIndex = 0;
		while(result = regex.exec(s))
		{
			if(result.index !== idx)
			{
				break;
			}
			var k = result[1];
			var v = result[2];
			this.append(k, v);
			idx += result[0].length;
		}
	};
	URLSearch.prototype.set = function set(k, v)
	{
		this.data = Utils.isArray(v) ? v.concat() : [v];
		return this;
	};
	URLSearch.prototype.append = function append(k, v)
	{
		var data = this.data;
		if(k in data)
		{
			data[k].push(v);
		}
		else
		{
			data[k] = [v];
		}
		return this;
	};
	URLSearch.prototype["delete"] = function(k, s)
	{
		if(s !== undefined && k in this.data)
		{
			var lst = this.data[k]
			var i = lst.indexOf(s);
			if(i > -1)
			{
				lst.splice(i, 1);
				if(lst.length)
				{
					return this;
				}
			}
		}
		delete this.data[k];
		return this;
	};
	URLSearch.prototype.get = function get(k)
	{
		var lst = this.data[k];
		return lst ? lst[0] : null;
	};
	URLSearch.prototype.getAll = function getAll(k)
	{
		return this.data[k];
	};
	URLSearch.prototype.has = function has(k)
	{
		return k in this.data;
	};
	URLSearch.prototype.toString = function toString()
	{
		var str = "", data = this.data, i, v, c = 0;
		for(var k in data)
		{
			var lst = data[k];
			for(i = 0; i < lst.length; i++)
			{
				if(c++)
				{
					str += "&";
				}
				v = lst[i];
				str += (k + "=" + v);
			}
		}
		return str;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	var pathRe = /(?:\/(\.\.|(?:\.?(?:[\w_~\-]+)|(?:%[0-9a-f]{2}))+)?)/gi;
	//-----------------------------------------------------------------------------------------------------------------------
	function URLPath(p)
	{
		if(!(this instanceof URLPath))
		{
			return new URLPath(p);
		}
		this.data = [];
		if(!Utils.isString(p))
		{
			return;
		}
		var idx = 0, result, regex = pathRe;
		//Reset pattern ...
		regex.lastIndex = 0;
		while(result = regex.exec(p))
		{
			if(result.index !== idx)
			{
				break;
			}
			var part = result[1];
			this.append(part);
			idx += result[0].length;
		}
	}

	URLPath.prototype.append = function(part)
	{
		if(part)
		{
			this.data.push(part);
		}
		return this;
	};
	URLPath.prototype.toString = function()
	{
		var p = "/", data = this.data;
		;
		for(var i = 0, l = data.length; i < l; i++)
		{
			p += data[i];
			if(i + 1 < l)
			{
				p += "/";
			}
		}
		return p;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	var urlRe = /(?:([^:\/?#.]+):)?(?:\/\/)?(?:(?:([^\/?#:]+)(?::([^\/?#]+))?)@)?((?:[a-z][\w~\-]*(?:\.[\w~\-]+)*)|(?:\d{1,3}(?:\.\d{1,3}){3})|(?:\[?(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){7})\]?))(?::(\d{1,5}))?((?:\/(?:\.\.|(?:\.?(?:[\w_~\-]+)|(?:%[0-9a-f]{2}))+)?)+)?(\?(?:[^=&%!\*\'\(\) ;:@\+$,\/\?#\[\]]|%[0-9a-f]{2})+=(?:[^=&%!\*\'\(\) ;:@\+$,\/\?#\[\]]|%[0-9a-f]{2})+(?:&(?:[^=&%!\*\'\(\) ;:@\+$,\/\?#\[\]]|%[0-9a-f]{2})+=(?:[^=&%!\*\'\(\) ;:@\+$,\/\?#\[\]]|%[0-9a-f]{2})+)*)?(#.*)?/i;
	//-----------------------------------------------------------------------------------------------------------------------
	function URLData(url)
	{
		var regexp = urlRe, result = regexp.exec(url);
		if(result)
		{
			this.protocol = result[1] || "";
			this.username = result[2] || "";
			this.password = result[3] || "";
			this.hostname = result[4] || "";
			this.port = result[5] || "";
			this.path = new URLPath(result[6]);
			this.search = new URLSearch(result[7]);
			this.hash = result[8];
		}
	}

	Utils.defineGetter(URLData.prototype, "pathname", function()
	{
		return this.path.toString();
	});
	Utils.defineGetter(URLData.prototype, "host", function()
	{
		return this.hostname + (this.port ? ":" + this.host : "");
	});
	Utils.defineGetter(URLData.prototype, "origin", function()
	{
		return (this.protocol ? this.protocol + "://" : "http://") + this.hostname + (this.port ? ":" + this.host : "");
	});
	URLData.prototype.toString = function()
	{
		var url = this.data.protocol + "://";
		url += (this.data.username ? this.data.username + (this.data.password ? ":" + this.data.password : "") + "@" : "");
		url += this.data.host;
		url += this.data.path;
		url += this.data.search;
		url += (this.data.hash ? this.data.hash : "");
		return url;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	function URL(url)
	{
		if(!(this instanceof URL))
		{
			return new URL(url);
		}
		Utils.awaitString(url, 1);
		this.data = new URLData(url);
	}

	//-----------------------------------------------------------------------------------------------------------------------
	URL.prototype.protocol = function(v)
	{
		if(Utils.isString(v))
		{
			this.data.protocol = v;
			return this;
		}
		return this.data.protocol;
	};
	URL.prototype.username = function(v)
	{
		if(Utils.isString(v))
		{
			this.data.username = v;
			return this;
		}
		return this.data.username;
	};
	URL.prototype.password = function(v)
	{
		if(Utils.isString(v))
		{
			this.data.password = v;
			return this;
		}
		return this.data.password;
	};
	URL.prototype.port = function(v)
	{
		if(Utils.isString(v))
		{
			if(!v.matches(/\d{1,5}/))
			{
				throw new TypeError("Wrong port: " + v);
			}
			this.data.port = v;
			return this;
		}
		return this.data.port;
	};
	URL.prototype.path = function(v)
	{
		if(arguments.length > 1)
		{
			var arr = [];
			for(var i = 0, args = arguments; i < args.length; i++)
			{
				arr.push(args[i]);
			}
			v = arr;
		}
		if(Utils.isString(v))
		{
			this.data.port = v;
			return this;
		}
		if(Utils.isArray(v))
		{
			this.data.path.data.length = 0;
			Array.prototype.push(this.data.path.data, v)
		}
		return this.data.path.toString();
	};
	URL.prototype.host = function(v)
	{
		if(Utils.isString(v))
		{
			this.data.host = v;
			return this;
		}
		return this.data.host;
	};
	URL.prototype.hash = function(v)
	{
		if(Utils.isString(v))
		{
			this.data.hash = v;
			return this;
		}
		return this.data.host;
	};
	URL.prototype.search = function()
	{
		return this.data.search;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	URL.prototype.toString = function()
	{
		return this.data.toString();
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return URL;
});
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */
mix.declare("mix.orm.Session", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Session()
	{
	}

	//-----------------------------------------------------------------------------------------------------------------------
	return Session;
});
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */
mix.declare("mix.orm.SessionFactory", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function SessionFactory()
	{
	}

	//-----------------------------------------------------------------------------------------------------------------------
	return SessionFactory;
});
//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 16.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 15.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 13.03.2015.
 */


//######################################################################################
/**
 * Created by A.Hofmann on 21.02.2015.
 */
mix.config("mix.core", {
	baseUrl: "/Example/Mx",
	schemas: {
		external: mix.Schema({
			url: {
				jQuery: "http://code.jquery.com/jquery-2.1.3.min.js"
			},
			mime: {
				"default": "text/javascript"
			}
		}),
		library: mix.Schema({
			mime: {
				"default": "text/javascript"
			},
			path: "/libs",
			suffix: ".js",
			injector: function(dep, src)
			{
				"use strict";
				var script = window.document.createElement("script");
				script.type = dep.mime;
				script.setAttribute("data-alias", dep.key);
				script.textContent = src;
				window.document.head.appendChild(script);
				dep.resolve();
			}
		})
	}
});
_mix_.resource().alias("test_lib").type("library").requires("jQuery", "test_lib2").build(function()
{
	"use strict";
	var category = {
		name: "people",
		members: []
	}
	var anna = {
		category: category,
		sex: "female",
		name: "Anna",
		age: 27,
		height: 177.5,
		married: true,
		skills: ["psychologist", "write", "speak"],
		partner: undefined
	}
	var andre = {
		category: category,
		sex: "male",
		name: "Andre",
		age: 30,
		height: 178.5,
		married: true,
		skills: ["drink", "code", "sleep"],
		partner: anna
	}
	anna.partner = andre;
	category.members.push(anna, andre);
	return andre;
}).resource({alias: "jQuery", type: "external", requires: "test_lib2"}).build(function()
{
	"use strict";
	var counter = 1;
	window.out = function(val)
	{
		$("#out").prepend('<div>' + (counter++) + ': ' + val + '</div>');
	};
	return jQuery;
}).resource({alias: "test_lib2", type: "library"}).build(function()
{
	"use strict";
	return "bla2";
});
//######################################################################################
/**
 * Created by A.Hofmann on 21.02.2015.
 */
mix.extend("mix.Utils", ["mix.coll.SortedMap"], function(Utils, SortedMap)
{
	"use strict";
	console.log("Extend ok? : " + (Utils === mix.Utils && SortedMap === mix.coll.SortedMap));
});