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
	function noop(){}

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
	function Schema(o){
		if(!(this instanceof Schema)){
			return new Schema(o);
		}

		this._urls = Schema.default.urls; //String, Object or function (d:Dependency):String
		this._flags = Schema.default.flags; //int, Object or function (d:Dependency):int

		this._alias = ""; //String, Object or function (d:Dependency):String
		this._prefix = ""; //String or function (d:Dependency):String
		this._suffix = ""; //String or function (d:Dependency):String
		this._path = "/"; //String or function (d:Dependency):String
		this._mime = "*/*"; //String or function (d:Dependency):String

		this._loaded = Schema.default.loaded; //function (d:Dependency):void
		this._failed = Schema.default.failed; //function (d:Dependency):void

		this._loader = Schema.default.loader; //function (d:Dependency):void
        this._injector = Schema.default.injector; //function (d:Dependency, rawData:String):String
        this._preprocessor = Schema.default.preprocessor; //function (d:Dependency, rawData:String):String

		if(isObject(o)){
			for(var k in o){
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
			this._urls = val;
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
	Schema.prototype.flags = function(val){
		if(isNumber(val) || isObject(val) || isFunction(val)){
			this._flags = val;
			return this;
		}
		return this._flags;
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
		urls: function(dep){
			var location = window.location;
			var base = location.href.substring(0,
				location.href.length -
				(location.port ? location.port.length + 1 : 0) -
				location.pathname.length - (location.search ? location.search.length : 0));

			var url = base + (location.port? ":" + location.port : "") + "/" + coreCfg.baseUrl;

			url += ("/" + (isFunction(this.path()) ? this.path().call(this, dep) : this.path()));

			var alias;
			if(isFunction(this.alias())){
				alias = this.alias().call(this, dep);
			}
			else if(isObject(this.alias())){
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

			if(dep.urls().length){
				throw new Error("Please provide an URL for the definition: " + dep + ", type: " + dep.type());
			}

			var self = this,

			onLoaded = function(e){
				dep.flags(Dependency.LOADED);
				dep.result = e;
				self.loaded().call(self, dep);
			},
			onFailed = function(e){
				dep.result = e;
				self.failed().call(self, dep);
			};

			if(dep.is(Dependency.EXTERNAL)) {
				var script = window.document.createElement("script");
				script.type = dep.mime();
				script.src = dep.url();
				script.setAttribute("data-key", dep.toString());
				script.onload = onLoaded;
				script.onerror = onFailed;
				window.document.head.appendChild(script);
			}
			else {
				var request = new XMLHttpRequest();
				request.onload = onLoaded;
				request.onerror = onFailed;
				request.open("GET", dep.url(), true);
				request.send();
			}
		},
		loaded: function(dep) {
			this.mark(Dependency.LOADED);

			var res = dep.result;

			if (res)
			{
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
						this.schema().injector().call(this.schema(), this, dep.value = src.responseText);
					}
				}
				else {
					dep.value = res;
				}

				//In case someone forget to call it in the corresponding injector ...
				dep.resolve();
			}
		},
		failed: function(dep) {
			var res = dep.result;
			if(res && (res.srcElement || res.target)){
				var src = (res.srcElement || res.target);

				if(src.onload || src.onerror){
					src.onload = null;
					src.onerror = null;
				}
			}
			coreCfg.console.error("Unable to load following dependency: '" + this + "' from: '" + this.url + "'", this, res);
		},
		injector: function(dep, raw){
			dep.resolve();
		},
		preprocessor: function(dep){
		},
		flags: function(dep){
			var flags = 0;

			var location = window.location;
			var host = location.protocol + "//" + location.host;
			var retry = dep._retry;

			if(retry < dep.urls().length && dep.urls()[retry].search(host) !== 0){
				flags |= Dependency.EXTERNAL;
			}

			if(dep.type() != "module"){
				flags |= Dependency.LOADABLE;
			}

			flags |= Dependency.ASSIGNABLE;

			return flags;
		}
	};
	//------------------------------------------------------------------------------------------------------------------
	Schema.prototype.setup = function(dep)
	{
		dep.urls(isFunction(this.urls()) ? this.urls().call(this, dep) : isObject(this.urls())? this.urls()[dep] : this.urls());
		dep.mime(isFunction(this.mime()) ? this.mime().call(this, dep) : isObject(this.mime()) ? this.mime()[dep] || this.mime()["default"] : this.mime());
		//dep.external(isFunction(this.external()) ? this.external().call(this, dep) : isObject(this.external()) ? this.external()[dep] : this.external());
		dep.flags(isFunction(this.flags()) ? this.flags().call(this, dep) : isObject(this.flags()) ? this.external()[dep] : this.flags());
		return this;
	};
	//------------------------------------------------------------------------------------------------------------------
	var context = {
		loaded: "LOADED"
	};
	var coreCfg = {
		debug: true,
		baseUrl: "/app",
		logStyle: "color: COLOR; font-style: bold;",
		console: window.console,
		schemas: {},
		internal: {},
		"default":{
			type: "module",
			unknownType: ""
		}
	};
	//------------------------------------------------------------------------------------------------------------------
	var config = {
		mix: {
			core: coreCfg
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

	Core.prototype.resource = function(o)
	{
		return this.declare(o);
	};

	Core.prototype.provide = function(key, value)
	{
		return this.declare({
			key: key,
			type: "provided",
			loadable: false,
			assignable: true,
			callback: function providedValue() {
				return value;
			}
		}).build();
	};

	Core.prototype.declare = function(key, type, dependencies, callback)
	{
		if(arguments.length === 0){
			return new Dependency();
		}
		if(isObject(key)){
			return new Dependency(key);
		}

		var params = {
			loadable: true,
			assignable: true,
			key: key,
			type: (function(){
				if(isString(type)){
					return type;
				}
				return coreCfg.default.type;
			})(),
			dependencies: (function(){
				if(isArray(dependencies)){
					return dependencies;
				}
				if(isArray(type)){
					return type;
				}
				return [];
			})(),
			callback: (function(){
				if(isFunction(callback)){
					return callback;
				}
				if(isFunction(dependencies)){
					return dependencies;
				}
				if(isFunction(type)){
					return type;
				}
				return noop;
			})()
		};

		var d = new Dependency(params);

		if(d.is(Dependency.ASSIGNABLE) && d.key in registry)
		{
			throw new Error("Given dependency with key '" + key + "' was already resolved.");
		}

		return d.build();
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

		return this.declare({key: key, type: "extend", assignable: false, dependencies: dependencies, callback: builder});
	};
	Core.prototype.plugin = function(key, dependencies, builder)
	{
		return this.declare(key, "plugin", dependencies, builder);
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
	function Namespace(alias, parent) {
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
	Namespace.prototype.config = function(a, b){
		return core.config(a, b);
	};
	Namespace.prototype.context = function(context){
		core.context(context);
		return this;
	};
	Namespace.prototype.provide = function(key, value){
		core.provide(key, value);
		return this;
	};
	Namespace.prototype.declare = function(key, type, dependencies, builder){
		core.declare(key, type, dependencies, builder);
		return this;
	};
	Namespace.prototype.extend = function(key, dependencies, builder){
		core.extend(key, dependencies, builder);
		return this;
	};
	Namespace.prototype.toString = function toString(){
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
    function Dependency(o){
		if(!(this instanceof Dependency)){
			return new Dependency(o);
		}

        this._flags = 0;

        this._ns = core;
        this._type = "";
        this._alias = "";

        this._key = ""; //(ns.alias) ? ns + "." + alias : alias;

		this._callback = noop;

        this._dependencies = [];
        this._dependenciesHash = {};

        this._result = undefined;
        this._value = undefined;

		this._retry = 0;
        this._schema = null;
        this._mime = "*/*";
        this._urls = [];

		if(isObject(o)){
			for(var k in o){

				var v = o[k];

				switch (k){
					case "assignable": this.mark(v? Dependency.ASSIGNABLE : 0); break;
					case "loadable": this.mark(v? Dependency.LOADABLE : 0); break;
					case "external": this.mark(v? Dependency.EXTERNAL : 0); break;

					case "key": this.key(v); break;

					case "alias": this.alias(v); break;

					case "ns":
					case "namespace": this.ns(v); break;

					case "requires":
					case "dependencies": this.dependencies(v); break;

					case "type": this.type(v); break;
					case "flags": this.flags(v); break;
					case "callback": this.callback(v); break;
					case "schema": this.schema(v); break;
					case "mime": this.mime(v); break;

					case "url":
					case "urls": this.urls(v); break;

					default:{
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
    Dependency.prototype.flags = function (val) {
        if (isNumber(val)) {
            this._flags = val;
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
			//Extract type
			var idx = val.indexOf(':');
			if(~idx){ //NOT(-1) => ZERO
				this.type(val.substr(0, idx));
				val = val.substr(idx+1);
			}
			//Extract namespace and alias
			idx = val.lastIndexOf('.');
			if(~idx){
				this.ns(val.substr(0, idx));
				this.alias(val.substr(idx+1));
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
		else if(isString(val)) {
			return this.schema(coreCfg.schemas[val]);
		}
        return this._schema;
    };
	Dependency.prototype.url = function(val){
		if(isString(val)){
			this._urls[this._retry] = val;
			return this;
		}
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
		if (!this.ns()) {
			throw new Error("Invalid namespace: '" + this.ns() + "' defined by: "+this);
		}
		if (!this.alias() || !isString(this.alias())) {
			throw new Error("Invalid alias: '" + this.alias() + "' defined by: "+this);
		}
		if (!this.type() || !isString(this.type())) {
			throw new Error("Invalid type: '" + this.type() + "' defined by: "+this);
		}
		if (!isArray(this.dependencies())) {
			throw new Error("Invalid dependencies: '" + this.alias() + "' defined by: "+this);
		}
		if (!isFunction(this.callback())) {
			throw new Error("Invalid callback: '" + this.callback() + "' defined by: "+this);
		}
		if(!this.schema()){
			this.schema(this.type());
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
		else {
			this.load();
		}

		return this._ns;
	};
	Dependency.prototype.resolve = function()
	{
        var key = this.toString();

        if (!this.is(Dependency.LOADABLE) || this.is(Dependency.LOADED)){
            if (!this.is(Dependency.RESOLVED)){
				this.complete();

				if(delete pendingMap[key]){
					var readyList = [], dep;

					for(var i = pendingList.length - 1; i >= 0; i--){
						dep = pendingList[i];

                        if (delete dep._dependenciesHash[key] && !Object.keys(dep._dependenciesHash).length){
							readyList.push(dep);
							pendingList.splice(i, 1);
						}
					}
					for(i = 0; i < readyList.length; i++){
						(dep = readyList[i]).load();
					}
				}
			}
		}
		return this;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	var loadedDependenciesCounter = 0;
	//-----------------------------------------------------------------------------------------------------------------------
	Dependency.prototype.complete = function()
	{
        if (this.is(Dependency.RESOLVED)){
			return;
		}

        this.mark(Dependency.RESOLVED);

        var key = this.toString();

        var args = core.inject(this, this.dependencies());

		try
		{
            var result = this.callback().apply(null, args);

            loadedDependenciesCounter++;

            if (this.is(Dependency.ASSIGNABLE) && this.alias()){
				registry[key] = result;

                this.ns().set(this.alias(), result);

                if(coreCfg.debug){
                    coreCfg.console.log("%c" + ("      ".substr(0, 6 - loadedDependenciesCounter.toString().length) + loadedDependenciesCounter) + ": %c" + key,
					coreCfg.logStyle.replace("COLOR", "red"), coreCfg.logStyle.replace("COLOR", "green"));
				}
			}

            this.value = this.result = null;
		}
		catch(e){
			coreCfg.console.error("Unable to resolve definition: " + key + ", because of: ");
			coreCfg.console.log("%c" + (e.stack ? e.stack : e), coreCfg.logStyle.replace("COLOR", "red"));
		}
        return this;
	};
	Dependency.prototype.load = function()
	{
		if(this.schema()){
			this.schema().setup(this);
		}

		//Is this dependency loadable?
        if (!this.is(Dependency.LOADABLE) || this.is(Dependency.LOADED)) {
			this.resolve();
		}
        else {
            this.schema().loader().call(this.schema(), this);
        }

        return this;
	};
	//------------------------------------------------------------------------------------------------------
    Dependency.prototype.is = function (bits) {
        return (this._flags & bits) === bits;
    };
    Dependency.prototype.mark = function (bits) {
        this._flags |= bits;
        return this;
    };
    Dependency.prototype.unmark = function (bits) {
        this._flags &= ~bits;
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
			coreCfg.console.log("%cAwaiting dependencies: " + pendingList.join(","), "background-color: red; color: white; font-style: bold;");
			setTimeout(monitorRequirements, 3000);
		}
	}, 3000);
	//------------------------------------------------------------------------------------------------------
	var oldMixCore = target[mixCoreKey], oldMixNs = target[mixNsKey];
	var core = target[mixCoreKey] = new Core();
	var mix = target[mixNsKey] = core.namespace("mix");
	//------------------------------------------------------------------------------------------------------
	mix.provide("mix.Schema", Schema);
	//------------------------------------------------------------------------------------------------------
	mix.config("mix.core", {
		baseUrl: "/mix.js/app",
		schemas: {
			module: mix.Schema({
				mime: {
					"default": "text/javascript"
				},
				injector: function(dep, src)
				{
					"use strict";
					var script = window.document.createElement("script");
					script.type = dep.mime;
					script.setAttribute("data-key", dep.key);
					script.textContent = src;
					window.document.head.appendChild(script);
					dep.resolve();
				}
			})
		}
	});
	//------------------------------------------------------------------------------------------------------

})(window, _mix_, "mix");
//-----------------------------------------------------------------------------------------------------------------------
