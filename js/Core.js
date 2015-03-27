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

    function argsToArray(args, lst) {
        if (args.length > 0) {
            if (args.length === 1) {
                if (isArray(args[0])) {
                    Array.prototype.push.apply(lst, args[0]);
                }
                else {
                    lst.push(args[0]);
                }
            }
            else {
                for (var i = 0, l = args.length; i < l; i++) {
                    lst.push(args[i]);
                }
            }
        }
        return lst;
    }

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

		this.loader = Schema.defaultLoader; //function (d:Dependency):void
        this.injector = Schema.defaultInjector; //function (d:Dependency, rawData:String):String
        this.preprocessor = Schema.defaultPreprocessor; //function (d:Dependency, rawData:String):String

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

        alias = (isFunction(this.prefix) ? this.prefix.call(this, dep) : this.prefix) + (alias || dep.alias) + (isFunction(this.suffix) ? this.suffix.call(this, dep) : this.suffix);
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

        var dotIdx = key.lastIndexOf("."), ns;

        if (dotIdx > -1) {
            ns = dotIdx > -1 ? key.substr(0, dotIdx) : key;
            key = key.substr(dotIdx + 1);
        }
        else {
            ns = "";
        }

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
	//------------------------------------------------------------------------------------------------------
    //function Resource(ns)
    //{
    //	this._ns_ = ns;
    //	this._type_ = undefined;
    //	this._alias_ = undefined;
    //	this._builder_ = undefined;
    //	this._assignable_ = true;
    //	this._dependencies_ = undefined;
    //}
    //
    //Resource.prototype.alias = function(alias)
    //{
    //	this._alias_ = alias;
    //	return this;
    //};
    //Resource.prototype.assignable = function(assignable)
    //{
    //	this._assignable_ = !!assignable;
    //	return this;
    //};
    //Resource.prototype.type = function(type)
    //{
    //	this._type_ = type;
    //	return this;
    //};
    //Resource.prototype.dependencies = Resource.prototype.requires = function()
    //{
    //	var dependencies = null;
    //	if(arguments.length === 1)
    //	{
    //		dependencies = arguments[0];
    //		if(isString(dependencies))
    //		{
    //			dependencies = [dependencies];
    //		}
    //		else if(!isArray(dependencies))
    //		{
    //			throw new TypeError("Awaited either a string or an array.");
    //		}
    //	}
    //	else
    //	{
    //		dependencies = [];
    //
    //		for(var i = 0, l = arguments.length; i < l; i++)
    //		{
    //			dependencies[i] = arguments[i];
    //		}
    //	}
    //	this._dependencies_ = dependencies;
    //	return this;
    //};
    //Resource.prototype.build = function(builder)
    //{
    //	this._builder_ = builder;
    //
    //   var dep = new Dependency(this._ns_, this._alias_, this._dependencies_, this._builder_, this._type_, this._assignable_);
    //
    //   if(!dep.alias || !isString(dep.alias))
    //	{
    //		throw new Error("Invalid alias: '" + dep.alias + "'");
    //	}
    //
    //   if(isArray(dep.dependencies))
    //	{
    //		var found = 0;
    //
    //       for(var i = 0, l = dep.dependencies.length; i < l; i++)
    //		{
    //			var d = dep.dependencies[i];
    //           var fqn = core.unescapeDependency(d);
    //
    //           if (!core.isDependency(d) || fqn in registry) {
    //               found += 1;
    //           }
    //			else
    //			{
    //				dep.matrix[fqn] = true;
    //				requiredMap[fqn] = 1 + (requiredMap[fqn] || 0);
    //
    //               if (core.isResourceDependency(d)) {
    //                   var type = core.getResourceType(d);
    //                   core.declare(d, type, [core.escapeDependency("dep")], function (dep) {
    //                       return dep.value;
    //                   });
    //               }
    //			}
    //		}
    //		if(found < l)
    //		{
    //			requiredList.push(dep);
    //			return dep.ns;
    //		}
    //	}
    //	else if(isFunction(dep.dependencies))
    //	{
    //		dep.builder = dep.dependencies;
    //	}
    //	if(isFunction(dep.builder))
    //	{
    //		dep.load();
    //	}
    //	else
    //	{
    //		throw new Error("Builder parameter must be a function.");
    //	}
    //	return dep.ns;
    //};
    //-----------------------------------------------------------------------------------------------------------------------
    function Dependency()
	{
        this._flags_ = 0;

        this._ns_ = null;
        this._alias_ = "";
        this._type_ = "";

        this._key_ = ""; //(ns.alias) ? ns + "." + alias : alias;

		this._builder_ = undefined;

        this._dependencies_ = [];
        this._dependenciesHash_ = {};

        this.counter = 0;
        this.value = undefined;
        this.result = undefined;

        this._url_ = [];
        this._mime_ = "*/*";
        this._schema_ = null;

        //if(this.loadable)
        //{
        //	this.schema = cfg.schemas[type];
        //	this.schema.setup(this);
        //}
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
    Dependency.prototype.build = function () {
        if (!this._alias_ || !isString(this._alias_)) {
            throw new Error("Invalid alias: '" + this._alias_ + "'");
        }

        if (!isArray(this._dependencies_)) {
            throw new Error("Dependencies must be an array: '" + this._alias_ + "'");
        }

        var found = 0;

        for (var i = 0, l = this._dependencies_.length; i < l; i++) {
            var d = this._dependencies_[i];

            var fqn = core.unescapeDependency(d);

            if (!core.isDependency(d) || fqn in registry) {
                found += 1;
            }
            else {
                this._dependenciesHash_[fqn] = true;

                requiredMap[fqn] = 1 + (requiredMap[fqn] || 0);

                if (core.isResourceDependency(d)) {
                    var type = core.getResourceType(d);

                    core.declare(d, type, [core.escapeDependency("dep")], function (dep) {
                        return dep.value;
                    });
                }
            }
        }

        if (found < l) {
            requiredList.push(this);
        }

        return this._ns_;
    };
    //-----------------------------------------------------------------------------------------------------------------------
    Dependency.prototype.flags = function (val) {
        if (val !== undefined) {
            this._flags_ = 0 | val;
            return this;
        }
        return this._flags_;
    };
    Dependency.prototype.alias = function (val) {
        if (isString(val)) {
            this._alias_ = val;
            return this;
        }
        return this._alias_;
    };
    Dependency.prototype.ns = Dependency.prototype.namespace = function (val) {
        if (val !== undefined) {
            this._ns_ = core.namespace(val);
            return this;
        }
        return this._ns_;
    };
    Dependency.prototype.type = function (val) {
        if (isString(val)) {
            this._type_ = val;
            return this;
        }
        return this._type_;
    };
    Dependency.prototype.key = function (val) {
        if (val !== undefined) {
            this._key_ = val;
            return this;
        }
        return this._key_;
    };
    Dependency.prototype.mime = function (val) {
        if (isString(val)) {
            this._mime_ = val;
            return this;
        }
        return this._mime_;
    };
    Dependency.prototype.builder = function (val) {
        if (isFunction(val)) {
            this._builder_ = val;
            return this;
        }
        return this._builder_;
    };
    Dependency.prototype.schema = function (val) {
        if (val instanceof Schema) {
            this._schema_ = val;
            return this;
        }
        return this._schema_;
    };
    Dependency.prototype.url = function () {
        if (arguments.length > 0) {
            argsToArray(arguments, this._url_);
            return this;
        }
        return this._url_;
    };
    Dependency.prototype.requires = Dependency.prototype.dependencies = function () {
        if (arguments.length > 0) {
            argsToArray(arguments, this._dependencies_);
            return this;
        }
        return this._dependencies_;
    };
    //-----------------------------------------------------------------------------------------------------------------------
	Dependency.prototype.resolve = function()
	{
        var fqn = this.toString();

        if (!this.is(Dependency.LOADABLE) || this.is(Dependency.LOADED))
		{
            if (!this.is(Dependency.RESOLVED))
			{
				this.complete();

				if(delete requiredMap[fqn])
				{
					var readyList = [], dep;

					for(var i = requiredList.length - 1; i >= 0; i--)
					{
						dep = requiredList[i];

                        if (delete dep._dependenciesHash_[fqn] && !Object.keys(dep._dependenciesHash_).length)
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
	Dependency.prototype.complete = function()
	{
        if (this.is(Dependency.RESOLVED))
		{
			return;
		}
        this.mark(Dependency.RESOLVED);

        var fqn = this.toString();
        var args = core.inject(this, this._dependencies_);

		try
		{
            var result = this._builder_.apply(null, args);

            counter++;

            if (this.is(Dependency.ASSIGNABLE))
			{
				registry[fqn] = result;

                this._ns_.set(this._alias_, result);

                if(cfg.debug)
				{
                    cfg.console.log("%c" + ("      ".substr(0, 6 - counter.toString().length) + counter) + ": %c" + fqn,
                        cfg.logStyle.replace("COLOR", "red"), cfg.logStyle.replace("COLOR", "green"));
				}
			}

            this.value = this.result = null;
		}
		catch(e)
		{
			cfg.console.error("Unable to resolve definition: " + fqn + ", because of: ");
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
                    this._schema_.injector.call(this._schema_, this, this.value = src.responseText);
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
        if (!this.is(Dependency.LOADABLE) || this.is(Dependency.LOADED))
		{
			this.resolve();
		}
        else {
            this._schema_.loader.call(this.schema, this);
        }

        return this;
	};
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
        return this._key_ || (this._key_ = (this._ns_.alias) ? this._ns_ + "." + this._alias_ : this._alias_);
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
