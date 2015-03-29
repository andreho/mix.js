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
	function isNumber(o)
	{
		return typeof o === "number";
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
	//------------------------------------------------------------------------------------------------------
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
	//------------------------------------------------------------------------------------------------------------------
    function argsToArray(args, arr) {
        if (args.length > 0) {
            if (args.length === 1) {
                if (isArray(args[0])) {
                    Array.prototype.push.apply(arr, args[0]);
                }
                else {
                    arr.push(args[0]);
                }
            }
            else {
                for (var i = 0, l = args.length; i < l; i++) {
                    arr.push(args[i]);
                }
            }
        }
        return arr;
    }
	//------------------------------------------------------------------------------------------------------------------
	function read(src, path)
	{
        path = isString(path) ? path.split(/\./g) : isArray(path) ? path : [path];
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
	//------------------------------------------------------------------------------------------------------------------
	function Schema(o)
	{
		if(!(this instanceof Schema))
		{
			return new Schema(o);
		}

		this._urls = []; //Schema.defaultURLProvider; //String, Object or function (d:Dependency):String
		this._external = false; //Schema.defaultExternal; //Boolean or function (d:Dependency):Boolean

		this._alias = ""; //String, Object or function (d:Dependency):String
		this._prefix = ""; //String or function (d:Dependency):String
		this._suffix = ""; //String or function (d:Dependency):String
		this._path = "/"; //String or function (d:Dependency):String
		this._mime = "*/*"; //String or function (d:Dependency):String

		this._loaded = null; //Schema.defaultLoader; //function (d:Dependency):void
		this._failed = null; //Schema.defaultLoader; //function (d:Dependency):void

		this._loader = null; //Schema.defaultLoader; //function (d:Dependency):void
        this._injector = null; //Schema.defaultInjector; //function (d:Dependency, rawData:String):String
        this._preprocessor = null; //Schema.defaultPreprocessor; //function (d:Dependency, rawData:String):String

		if(isObject(o))
		{
			for(var k in o)
			{
				var v = o[k];

				switch (k){
					case "urls": this.urls(v); break;
					case "alias": this.alias(v); break;
					case "prefix": this.prefix(v); break;
					case "suffix": this.suffix(v); break;
					case "path": this.path(v); break;
					case "mime": this.mime(v); break;
					case "external": this.external(v); break;
					case "loaded": this.loaded(v); break;
					case "failed": this.failed(v); break;
					case "loader": this.loader(v); break;
					case "injector": this.injector(v); break;
					case "preprocessor": this.preprocessor(v); break;
					default:{
						throw new Error("Unsupported parameter: "+k);
					}
				}
			}
		}
	};
	//------------------------------------------------------------------------------------------------------------------
	Schema.prototype.urls = function(val){
		if(val !== undefined){
			argsToArray(arguments, this._urls);
			return this;
		}
		return this._urls;
	};
	Schema.prototype.alias = function(val){
		if(isString(val) || isObject(val) || isFunction(val)){
			this._alias = val;
			return this;
		}
		return this._alias;
	};
	Schema.prototype.external = function(val){
		if(isBoolean(val) || isObject(val) || isFunction(val)){
			this._external = val;
			return this;
		}
		return this._external;
	};
	Schema.prototype.path = function(val){
		if(isString(val) || isFunction(val)){
			this._path = val;
			return this;
		}
		return this._path;
	};
	Schema.prototype.prefix = function(val){
		if(isString(val) || isFunction(val)){
			this._prefix = val;
			return this;
		}
		return this._prefix;
	};
	Schema.prototype.suffix = function(val){
		if(isString(val) || isFunction(val)){
			this._suffix = val;
			return this;
		}
		return this._suffix;
	};
	Schema.prototype.mime = function(val){
		if(isString(val) || isObject(val) || isFunction(val)){
			this._mime = val;
			return this;
		}
		return this._mime;
	};
	Schema.prototype.loaded = function(val){
		if(isFunction(val)){
			this._loaded = val;
			return this;
		}
		return this._loaded;
	};
	Schema.prototype.failed = function(val){
		if(isFunction(val)){
			this._failed = val;
			return this;
		}
		return this._failed;
	};
	Schema.prototype.loader = function(val){
		if(isFunction(val)){
			this._loader = val;
			return this;
		}
		return this._loader;
	};
	Schema.prototype.injector = function(val){
		if(isFunction(val)){
			this._injector = val;
			return this;
		}
		return this._injector;
	};
	Schema.prototype.preprocessor = function(val){
		if(isFunction(val)){
			this._preprocessor = val;
			return this;
		}
		return this._preprocessor;
	};
	//------------------------------------------------------------------------------------------------------------------
	Schema.default = {
		external: function (dep) {
			var location = window.location;
			var host = location.protocol + "//" + location.host;

			var retry = dep._retry;
            if(retry < dep.urls().length){
				return dep.urls()[retry].search(host) !== 0
			}
			return false;
		},
		urls: function(dep){
			var location = window.location;
			var base = location.href.substring(0,
				location.href.length -
				(location.port ? location.port.length + 1 : 0) -
				location.pathname.length - (location.search ? location.search.length : 0));

			var url = base + (location.port? ":" + location.port : "") + "/" + cfg.baseUrl;

			url += ("/" + (isFunction(this.path()) ? this.path().call(this, dep) : this.path()));

			var alias;
			if(isFunction(this.alias()))
			{
				alias = this.alias().call(this, dep);
			}
			else if(isObject(this.alias()))
			{
				alias = this.alias()[dep.alias()];
			}

			alias = (isFunction(this.prefix()) ? this.prefix().call(this, dep) : this.prefix()) +
			(alias || dep.alias) +
			(isFunction(this.suffix()) ? this.suffix().call(this, dep) : this.suffix());
			url += ("/" + alias);
			url = url.replace(/([^:])\/+/g, "$1/");
			return url;
		},
		loader: function(dep){

			if(dep.urls().length)
			{
				throw new Error("Please provide an URL for the definition: " + dep + ", type: " + dep.type());
			}

			var self = this,
			onLoaded = function(e){
				dep.flags(Dependency.LOADED);
				dep.result = e;
				self.loaded.call(self, dep);
			},
			onFailed = function(e){
				dep.result = e;
				self.failed.call(self, dep);
			};

			if(dep.is(Dependency.EXTERNAL))
			{
				var script = window.document.createElement("script");
				script.type = dep.mime();
				script.src = dep.url();
				script.setAttribute("data-key", dep.toString());
				script.onload = onLoaded;
				script.onerror = onFailed;
				window.document.head.appendChild(script);
			}
			else
			{
				var request = new XMLHttpRequest();
				request.onload = onLoaded;
				request.onerror = onFailed;
				request.open("GET", dep.url(), true);
				request.send();
			}
		},
		injector: function(dep, raw){
			dep.resolve();
		},
		preprocessor: function(dep){
		}
	};
	//------------------------------------------------------------------------------------------------------------------
	Schema.prototype.setup = function(dep)
	{
		dep.urls(isFunction(this.urls()) ? this.urls().call(this, dep) : isObject(this.urls())? this.urls()[dep] : this.urls());
		dep.mime(isFunction(this.mime()) ? this.mime().call(this, dep) : isObject(this.mime()) ? this.mime()[dep] || this.mime()["default"] : this.mime());
		dep.external(isFunction(this.external()) ? this.external().call(this, dep) : isObject(this.external()) ? this.external()[dep] : this.external());
		return this;
	};
	//------------------------------------------------------------------------------------------------------------------
	var context = {
		loaded: "LOADED"
	};
	var cfg = {
		debug: true,
		baseUrl: "/app",
		logStyle: "color: COLOR; font-style: bold;",
		console: window.console,
		schemas: {},
		internal: {},
		"default":{
			type: "lib",
			unknownType: ""
		}
	};
	//------------------------------------------------------------------------------------------------------------------
	var config = {
		mix: {
			core: cfg
		}
	};
	//------------------------------------------------------------------------------------------------------------------
	var registry = {};
	var namespaces = {};
	var pendingMap = {};
	var pendingList = [];
	var nsRegExp = /[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*/;
	//------------------------------------------------------------------------------------------------------------------
	function Core()
	{
		Object.defineProperty(this, "_config_", {value: config});
		Object.defineProperty(this, "_context_", {value: context});
		Object.defineProperty(this, "_registry_", {value: registry});
		Object.defineProperty(this, "_pending_", {value: pendingList});
	}

	Core.prototype.namespace = function(ns)
	{
		if(ns instanceof Core || ns instanceof Namespace)
		{
			return ns;
		}
        if (!isString(ns) || (ns.length > 0 && !nsRegExp.test(ns)))
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

            if (subNs) {
                if (!current.has(subNs)) {
                    current = new Namespace(subNs, current);
                }
                else {
                    current = current[subNs];
                }
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
			return this;
		}
		return this._context_;
	};
	Core.prototype.has = function(alias)
	{
		return alias in this;
	};
	Core.prototype.set = function(key, value, opts)
	{
		if(key in this){
			throw new Error("Given definition with key '" + key + "' exists in namespace '" + this + "' already.");
		}
		if(isObject(opts)){
			Object.defineProperty(this, key, opts);
		}
		else{
			this[key] = value;
		}
		return this;
	};
	Core.prototype.provide = function(key, dependencies, callback)
	{
		return this.declare(key, "provided", dependencies, callback);
	};
	Core.prototype.declare = function(key, type, dependencies, callback)
	{
		switch (arguments.length)
		{
			case 1: {
				if(isObject(key)){
					return new Dependency(key);
				}
			}
				break;
			case 2: {
				if(isString(key) && isFunction(type)){
					return new Dependency({
						key: key,
						type: cfg.default.type,
						callback: type
					});
				}
				else if(isArray(key) && isFunction(type)){
					return new Dependency({
						assignable: false,
						key: cfg.default.unknownType,
						type: cfg.default.type,
						callback: type
					});
				}
			}
				break;
			case 3: {
				if(isString(key) && isArray(type) && isFunction(dependencies)){
					return new Dependency({
						key: key,
						type: cfg.default.type,
						dependencies: type,
						callback: dependencies
					});
				}
			}
				break;
			case 4: {
				if(isString(key) && isString(type) && isArray(dependencies) && isFunction(callback)){
					return new Dependency({
						key: key,
						type: type,
						dependencies: dependencies,
						callback: callback
					});
				}
			}
				break;
		}

		var assignable = "extend" !== type;
		if(assignable && (key in registry))
		{
			throw new Error("Given definition with key '" + key + "' was already defined.");
		}
		if(callback === undefined)
		{
			if(isFunction(type))
			{
				callback = type;
				dependencies = [];
				type = "declaration";
			}
			else if(isArray(type))
			{
				callback = dependencies;
				dependencies = type;
				type = "declaration";
			}
			else if(type === "provided")
			{
				var provided = dependencies;
				callback = function providedValue()
				{
					return provided;
				}
				dependencies = [];
			}
			else if(isFunction(dependencies))
			{
				callback = dependencies;
				dependencies = [];
			}
		}

        var dotIdx = key.lastIndexOf("."), ns;

        if (dotIdx > -1) {
            ns = dotIdx > -1 ? key.substr(0, dotIdx) : key;
            key = key.substr(dotIdx + 1);
        }
        else {
            ns = "";
        }

		return this.dependency(ns).alias(key).assignable(assignable).type(type).dependencies(dependencies).build(callback);
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
	Core.prototype.dependency = function(o)
	{


		if(!arguments.length)
		{
			return new Dependency().namespace(o);
		}
		else if(isString(o))
		{
			return new Resource(this.namespace(o));
		}
		else if(isObject(o))
		{
            var resource = new Resource(this.namespace(o.ns || o.namespace || this))
                .alias(o.alias)
                .type(o.type)
                .assignable(isBoolean(o.assignable) ? o.assignable : true)
                .dependencies((o.dependencies || o.requires || []));
			if(isFunction(o.builder))
			{
				return resource.build(o.builder);
			}
			return resource;
		}
		throw new Error("Unsupported parameter type: '" + o + "', please provide either a string or a hash.");
	};
    Core.prototype.inject = function (dep, dependencies)
	{
		var i = 0, j = 0, l = dependencies.length, args = new Array(l);

		while(i < l)
		{
			var d = dependencies[i++];

			if(this.isInjectable(d))
			{
                var ed = this.unescapeDependency(d);

                if (ed === "dep") {
                    args[j++] = dep;
                }
                else if (ed === d)
				{
					if(ed in registry){
						args[j++] = registry[ed];
					}
					else{
						throw new Error("Unable to inject '"+ed+"' at index: "+j+" for: '"+dep+"'");
					}
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
    Core.prototype.escapeDependency = function (d) {
        return "!" + d;
    };
    Core.prototype.unescapeDependency = function (d)
	{
		return d.length && (d.charAt(0) === "!" || d.charAt(0) === "-") ? d.substr(1) : d;
	};
    Core.prototype.isResourceDependency = function (d) {
        return d.length && (d.search(/^[\w\-$]+:.+$/i)) === 0;
    };
    Core.prototype.getResourceType = function (d) {
        return d.replace(/^([\w\-$]+):.+$/i, "$1");
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
	Namespace.prototype.set = Core.prototype.set;
    Namespace.prototype.namespace = Core.prototype.namespace;
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
    //-----------------------------------------------------------------------------------------------------------------------
    function Dependency(o)
	{
		if(!(this instanceof Dependency)){
			return new Dependency(o);
		}

        this._flags = 0;

        this._ns = null;
        this._type = "";
        this._alias = "";

        this._key = ""; //(ns.alias) ? ns + "." + alias : alias;

		this._callback = undefined;

        this._dependencies = [];
        this._dependenciesHash = {};

        this._result = undefined;
        this._value = undefined;

		this._retry = 0;
        this._schema = null;
        this._mime = "*/*";
        this._urls = [];

		if(isObject(o))
		{
			for(var k in o)
			{
				var v = o[k];
				switch (k)
				{
					case "assignable": this.flags(Dependency.ASSIGNABLE); break;
					case "loadable": this.flags(Dependency.LOADABLE); break;
					case "external": this.flags(Dependency.EXTERNAL); break;

					case "ns":
					case "namespace": this.ns(v); break;
					case "requires":
					case "dependencies": this.dependencies(v); break;
					case "flags": this.flags(v); break;
					case "key": this.key(v); break;
					case "type": this.type(v); break;
					case "alias": this.alias(v); break;
					case "callback": this.callback(v); break;
					case "schema": this.schema(v); break;
					case "mime": this.mime(v); break;
					case "url":
					case "urls": this.urls(v); break;

					default:
					{
						throw Error("Unsupported parameter: "+k);
					}
				}
			}
		}
	};
    //-----------------------------------------------------------------------------------------------------------------------
    Dependency.ASSIGNABLE = 1;
    Dependency.LOADABLE = 2;
    Dependency.LOADED = 4;
    Dependency.RESOLVED = 8;
    Dependency.EXTERNAL = 16;
    Dependency.PROCESSED = 32;
    //-----------------------------------------------------------------------------------------------------------------------
    var counter = 0;
    //-----------------------------------------------------------------------------------------------------------------------
    Dependency.prototype.flags = function (val) {
        if (isNumber(val)) {
            this._flags |= val;
            return this;
        }
        return this._flags;
    };
    Dependency.prototype.alias = function (val) {
        if (isString(val)) {
            this._alias = val;
            return this;
        }
        return this._alias;
    };
    Dependency.prototype.ns = Dependency.prototype.namespace = function (val) {
        if (val !== undefined) {
            this._ns = core.namespace(val);
            return this;
        }
        return this._ns;
    };
    Dependency.prototype.type = function (val) {
        if (isString(val)) {
            this._type = val;
            return this;
        }
        return this._type;
    };
    Dependency.prototype.key = function (val) {
        if (isString(val)) {
			if(~val.search(":")){
				var idx = val.search(":");
				this.type(val.substr(0, idx));
				val = val.substr(idx+1);
			}
            this._key = val;
            return this;
        }
        return this._key;
    };
    Dependency.prototype.mime = function (val) {
        if (isString(val)) {
            this._mime = val;
            return this;
        }
        return this._mime;
    };
    Dependency.prototype.callback = function (val) {
        if (isFunction(val)) {
            this._callback = val;
            return this;
        }
        return this._callback;
    };
    Dependency.prototype.schema = function (val) {
        if (val instanceof Schema) {
            this._schema = val;
            return this;
        }
        return this._schema;
    };
	Dependency.prototype.url = function(){
		return this._urls[this._retry];
	};
	Dependency.prototype.nextUrl = function(){
		return this._urls[++this._retry];
	};
	Dependency.prototype.urls = function () {
		if (arguments.length > 0) {
			argsToArray(arguments, this._urls);
			return this;
		}
        return this._urls;
    };
    Dependency.prototype.requires = Dependency.prototype.dependencies = function () {
        if (arguments.length > 0) {
            argsToArray(arguments, this._dependencies);
            return this;
        }
        return this._dependencies;
    };
	Object.defineProperties(Dependency.prototype, {
		value: {
			get: function(){
				return this._value;
			},
			set: function(v){
				this._value = v;
			}
		},
		result: {
			get: function(){
				return this._result;
			},
			set: function(v){
				this._result = v;
			}
		}
	});
    //------------------------------------------------------------------------------------------------------------------
	Dependency.prototype.build = function () {
		if (!this.alias() || !isString(this.alias())) {
			throw new Error("Invalid alias: '" + this.alias() + "'");
		}
		if (!this.type() || !isString(this.type())) {
			throw new Error("Invalid type: '" + this.type() + "'");
		}
		if (!isArray(this.dependencies())) {
			throw new Error("Invalid dependencies: '" + this.alias() + "'");
		}

		var found = 0, dependencies = this.dependencies();

		for (var i = 0, l = dependencies.length; i < l; i++) {
			var d = dependencies[i];

			var key = core.unescapeDependency(d);

			if (!core.isDependency(d) || key in registry) {
				found += 1;
			}
			else {
				this._dependenciesHash[key] = true;

				pendingMap[key] = 1 + (pendingMap[key] || 0);

				if (core.isResourceDependency(d)) {
					var type = core.getResourceType(d);

					core.declare(d, type, [core.escapeDependency("dep")], function (dep) {
						return dep.value;
					});
				}
			}
		}

		if (found < l) {
			pendingList.push(this);
		}

		return this._ns;
	};
	Dependency.prototype.resolve = function()
	{
        var key = this.toString();

        if (!this.is(Dependency.LOADABLE) || this.is(Dependency.LOADED))
		{
            if (!this.is(Dependency.RESOLVED))
			{
				this.complete();

				if(delete pendingMap[key])
				{
					var readyList = [], dep;

					for(var i = pendingList.length - 1; i >= 0; i--)
					{
						dep = pendingList[i];

                        if (delete dep._dependenciesHash[key] && !Object.keys(dep._dependenciesHash).length)
						{
							readyList.push(dep);
							pendingList.splice(i, 1);
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
	Dependency.prototype.complete = function()
	{
        if (this.is(Dependency.RESOLVED))
		{
			return;
		}

        this.mark(Dependency.RESOLVED);

        var key = this.toString();

        var args = core.inject(this, this.dependencies());

		try
		{
            var result = this.callback().apply(null, args);

            counter++;

            if (this.is(Dependency.ASSIGNABLE) && this.alias())
			{
				registry[key] = result;

                this.ns().set(this.alias(), result);

                if(cfg.debug)
				{
                    cfg.console.log("%c" + ("      ".substr(0, 6 - counter.toString().length) + counter) + ": %c" + key,
					cfg.logStyle.replace("COLOR", "red"), cfg.logStyle.replace("COLOR", "green"));
				}
			}

            this.value = this.result = null;
		}
		catch(e)
		{
			cfg.console.error("Unable to resolve definition: " + key + ", because of: ");
			cfg.console.log("%c" + (e.stack ? e.stack : e), cfg.logStyle.replace("COLOR", "red"));
		}
        return this;
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
        this.mark(Dependency.LOADED);

        if (res)
		{
            this.result = res;

            if (res.srcElement || res.target) {
                var src = (res.srcElement || res.target);

                if (src.onload || src.onerror) {
                    src.onload = null;
                    src.onerror = null;
                }

                //Internal source ...
                if (src instanceof XMLHttpRequest) {
                    if (!(src.status == 200 || src.status == 304)) {
                        throw new Error("Unable to load following dependency: '" + this + "' from: '" + this.url + "'");
                    }
                    this.schema().injector.call(this.schema(), this, this.value = src.responseText);
                }
            }
            else {
                this.value = res;
            }

            //In case someone forget to call it in the corresponding injector ...
			this.resolve();
		}
	};
	Dependency.prototype.load = function()
	{
		//Is this dependency loadable?
        if (!this.is(Dependency.LOADABLE) || this.is(Dependency.LOADED)) {
			this.resolve();
		}
        else {
            this.schema().loader.call(this.schema(), this);
        }

        return this;
	};
	//------------------------------------------------------------------------------------------------------
    Dependency.prototype.is = function (bits) {
        return (this._flags_ & bits) === bits;
    };
    Dependency.prototype.mark = function (bits) {
        this._flags_ |= bits;
        return this;
    };
    Dependency.prototype.unmark = function (bits) {
        this._flags_ &= ~bits;
        return this;
    };
    Dependency.prototype.toString = function () {
        return this._key || (this._key = (this._ns.alias) ? this._ns + "." + this._alias : this._alias);
    };

	//------------------------------------------------------------------------------------------------------
	var monitoredTimes = 0;
	//------------------------------------------------------------------------------------------------------
	setTimeout(function monitorRequirements()
	{
		if(monitoredTimes++ < 5 && pendingList.length > 0)
		{
			cfg.console.log("%cAwaiting dependencies: " + pendingList.join(","), "background-color: red; color: white; font-style: bold;");
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
