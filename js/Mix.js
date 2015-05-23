/**
 * Created by a.hofmann on 13.05.2015.
 */
(function (target, rootNs) {
    "use strict";

    //-UTILS--------------------------------------------------------------------------------------------------
    function noop() {
    }

    function isBoolean(o) {
        return typeof o === "boolean";
    }

    function isNumber(o) {
        return typeof o === "number";
    }

    function isString(o) {
        return typeof o === "string";
    }

    function isObject(o) {
        return typeof o === "object";
    }

    function isFunction(o) {
        return typeof o === "function";
    }

    function isArray(o) {
        return o instanceof Array;
    }

    function property(host, name, value, opts) {
        opts = opts || {};
        opts.value = value;
        Object.defineProperty(host, name, opts);
        return host;
    }

    function length(o) {
        var i = 0;
        for (var k in o) {
            i++;
        }
        return i;
    }

    function getter(host, name, value, opts) {
        opts = opts || {};
        opts.get = value;
        Object.defineProperty(host, name, opts);
        return host;
    }

    function setter(host, name, value, opts) {
        opts = opts || {};
        opts.set = value;
        Object.defineProperty(host, name, opts);
        return host;
    }

    //------------------------------------------------------------------------------------------------------
    var registry = {}, namespaces = {}, pending = {}, schemas = [];
    //------------------------------------------------------------------------------------------------------

    /**
     * @param alias
     * @param parent
     * @returns {Namespace}
     * @constructor
     */
    function Namespace(alias, parent) {
        if (!(this instanceof Namespace)) {
            return new Namespace(alias, parent);
        }
        if (!isString(alias) || (!parent && alias.length)) {
            throw new Error("Invalid alias: '" + alias + "'");
        }
        property(this, "alias", alias || '');
        property(this, "elements", {});
        property(this, "namespaces", {});
        if (parent instanceof Namespace) {
            property(parent.namespaces, alias, property(this, "parent", parent));
        }
    }

    /**
     * @param ns
     * @returns {Namespace}
     */
    Namespace.prototype.namespace = function (ns) {
        if (ns instanceof Namespace) {
            return ns;
        }
        if (!isString(ns)) {
            throw new Error("Awaited either a string as first argument or a namespace.");
        }
        var i = 0, subNs, split = ns.split(/\./g), current = this.root();
        for (; i < split.length; i++) {
            subNs = split[i];
            if (subNs) {
                if (!current.hasNamespace(subNs)) {
                    current = new Namespace(subNs, current);
                    namespaces[current] = current;
                }
                else {
                    current = current.namespaces[subNs];
                }
            }
        }
        return current;
    }
    /**
     * @param alias
     * @param value
     * @param opts
     */
    Namespace.prototype.element = function (alias, value, opts) {
        property(this.elements, alias, value, opts || {enumerable: true, configurable: true});
        var key = (!this.alias ? '' : this + '.') + alias;
        registry[key] = value;
    }
    /**
     * @param ns
     * @returns {boolean}
     */
    Namespace.prototype.hasNamespace = function (ns) {
        return (ns in this.namespaces);
    }
    /**
     * @param alias
     * @returns {boolean}
     */
    Namespace.prototype.hasElement = function (alias) {
        return (alias in this.elements);
    }
    /**
     * @returns {Namespace}
     */
    Namespace.prototype.root = function () {
        var current = this;
        while (current) {
            if (!current.parent) {
                return current;
            }
            current = current.parent;
        }
        throw new Error("Not reachable.");
    };
    /**
     * @param def
     * @returns {Namespace}
     */
    Namespace.prototype.schema = function (def) {
        Schema(def);
        return this;
    };
    Namespace.prototype.toString = function () {
        var arr = [], current = this;
        while (current) {
            if (current.alias) {
                arr.unshift(current.alias);
            }
            current = current.parent;
        }
        return arr.join(".");
    }
    //------------------------------------------------------------------------------------------------------
    function Schema(o) {
        if (!(this instanceof Schema)) {
            return new Schema(o);
        }

        o = o || {};

        this.id = o.id || '';

        this.baseUrl = o.baseUrl || '/';
        this.mime = o.mime || '*/*';

        this.url = o.url || Schema.default.url;
        this.loader = o.loader || Schema.default.loader;
        this.matcher = o.matcher || Schema.default.matcher;
        this.injector = o.injector || Schema.default.injector;

        this.onLoaded = o.onLoaded || Schema.default.onLoaded;
        this.onFailed = o.onFailed || Schema.default.onFailed;

        this.suffix = o.suffix || '';
        this.prefix = o.prefix || '';
    }

    Schema.default = {
        /**
         * @param res
         */
        matcher: function (res) {
            return this.id == res.type;
        },
        url: function (res) {
            var location = window.location;
            var base = location.href.substring(0,
                location.href.length -
                (location.port ? location.port.length + 1 : 0) -
                location.pathname.length - (location.search ? location.search.length : 0));

            var url = base + (location.port ? ':' + location.port : '') + '/';
            url += this.baseUrl + '/';
            url += res.namespace.toString().replace('\.', '/');
            url += (this.prefix + res.alias + this.suffix);

            url = url.replace(/([^:])\/+/g, "$1/");

            return url;
        },
        loader: function (res, success, failure) {
            if (res.state == 'pending' || res.state == 'injected' || res.state == 'resolved') {
                return;
            }

            var self = this;

            function loaded(e) {
                res.result = e;
                res.state = 'loaded';
                self.onLoaded.call(self, res);
            }

            function failed(e) {
                res.result = e;
                res.state = 'failed';
                self.onFailed.call(self, res);
            }

            res.url = this.url.call(this, res);

            var req = new XMLHttpRequest();
            req.onload = loaded;
            req.onerror = failed;
            req.open("GET", res.url, true);
            req.send();
        },
        injector: function (res, success, failure) {
            var script = window.document.createElement("script");

            script.setAttribute("data-id", res.id);
            script.type = res.schema.mime;
            script.textContent = res.value;

            script.onload = function(e){
                script.onload = script.onerror = null;
                success(res);
            };
            script.onerror = function(e){
                script.onload = script.onerror = null;
                failure(res);
            };
            window.document.head.appendChild(script);
        },
        onLoaded: function (res) {
            var e = res.result;
            if (e) {
                if (e.srcElement || e.target) {
                    var src = (e.srcElement || e.target);
                    if (src.onload || src.onerror) {
                        src.onload = src.onerror = null;
                    }
                    if (src instanceof XMLHttpRequest) {
                        if (!(src.status === 200 || src.status === 304)) {
                            if (res.load()) {
                                return;
                            }
                            throw new Error("Unable to load following resource: '" + res.id + "' from: '" + res.url + "'");
                        }
                        res.value = src.responseText;

                        this.injector.call(this, res,
                            function (r){
                                r.state = 'injected';
                                r.result = undefined;
                                r.resolve();
                        },  function (r){
                                r.state = 'failed';
                        });
                    }
                }
            }
        },
        onFailed: function (res) {
            var e = res.result;
            if (e && (e.srcElement || e.target)) {
                var src = (e.srcElement || e.target);
                if (src.onload || src.onerror) {
                    src.onload = src.onerror = null;
                }
            }
            if (!res.load()) {
                console.error("Unable to load following resource: '" + res + "' from: '" + res.url + "'", res, this);
            }
        }
    };
    Schema.findById = function (id) {
        for (var i = 0; i < schemas.length; i++) {
            var schema = schemas[i];
            if (schema.id === id) {
                return schema;
            }
        }
        return null;
    };
    Schema.list = function () {
        return schemas;
    };
    //------------------------------------------------------------------------------------------------------
    function extract(id){
        var val = {id: id, alias: '', type: '', namespace: null};

        var idx = id.indexOf(':');
        if (~idx) { //NOT(-1) => ZERO
            val.type = id.substr(0, idx);
            id = id.substr(idx + 1);
        }
        //Extract namespace and alias
        idx = id.lastIndexOf('.');
        if (~idx) {
            val.alias = id.substr(idx + 1);
            val.namespace = id.substr(0, idx);
            val.namespace = namespace(val.namespace);
        }
        val.id = id;
        return val;
    }
    //------------------------------------------------------------------------------------------------------
    function Resource(o) {
        if (!(this instanceof Resource)) {
            return new Resource(o);
        }

        o = isString(o)? {id: o} : isObject(o)? o : {};

        var id = o.id || '';
        this.alias = o.alias || '';
        this.namespace = o.namespace || o.ns || '';
        this.dependencies = o.dependencies || o.requires || [];
        this.dependenciesHash = {};
        this.factory = o.factory || noop;

        this.url = o.url || '';
        this.type = o.type || '';

        this.result = undefined;
        this.value = undefined;

        this.state = 'defined';
        this.schema = undefined;

        this.waiting = [];
        this.attempt = 0;

        var info = extract(id);

        this.id = info.id;
        this.type = info.type || this.type;
        this.alias = info.alias || this.alias;
        this.namespace = info.namespace || this.namespace;
    };
    /**
     * @returns {boolean}
     */
    Resource.prototype.load = function () {
        this.schema = findSchema(this, this.schema || this.type);
        if (this.schema) {

            this.result = undefined;

            var found = 0, deps = this.dependencies;

            for (var i = 0; i < deps.length; i++) {

                var res = Resource(deps[i]), id = res.id;

                if (id in registry) {
                    found++;
                }
                else {
                    pending[id] = res = pending[id] || res;
                    res.waiting.push(this);
                    res.load();
                }
            }
            if(found < deps.length){
                this.attempt++;
                this.state = 'pending';
                this.schema.loader.call(this.schema, this);
            }
            else{
                this.resolve();
            }
        }
        return this.schema != null;
    };
    /**
     * @returns {Array}
     */
    Resource.prototype.inject = function () {
        var args = [], deps = this.dependencies;
        for (var i = 0; i < deps.length; i++) {
            var d = deps[i]; //TODO escape not injectable
            if (d in registry) {
                args.push(registry[d]);
            }
            else {
                throw new Error("Unable to inject resource: '" + d + "' to build: '" + this + "'");
            }
        }
        return args;
    };
    /**
     */
    Resource.prototype.create = function () {
        return this.factory.apply(null, this.inject());
    };
    /**
     */
    Resource.prototype.resolve = function () {
        if (this.state == 'resolved') {
            return;
        }
        if (length(this.dependenciesHash)) {
            return;
        }
        this.state = 'resolved';

        provide(this, this.create());

        this.release();
    };
    /**
     */
    Resource.prototype.release = function () {
        var waiting = this.waiting;
        outer:
            for (var i = waiting.length - 1; i >= 0; i--) {
                var waiter = waiting[i];
                delete waiter.dependenciesHash[this.id];
                for (var key in waiter.dependenciesHash) {
                    continue outer;
                }
                waiter.resolve();
            }
    };

    Resource.prototype.toString = function () {
        return this.id;
    };
    function findSchema(res, schema) {
        if (isString(schema)) {
            schema = Schema.findById(schema);
            if (schema.matcher.call(schema, res)) {
                return schema;
            }
        }
        if (!(schema instanceof Schema)) {
            return null;
        }
        var i = schemas.indexOf(schema);
        if (i > -1) {
            for (i += 1; i < schemas.length; i++) {
                var schema = schemas[i];
                if (schema.matcher.call(schema, res)) {
                    return schema;
                }
            }
        }
        return null;
    }

    //------------------------------------------------------------------------------------------------------

    var root = new Namespace('', null);

    //------------------------------------------------------------------------------------------------------

    function namespace(ns) {
        return root.namespace(ns);
    };
    function provide(id, value) {
        if(!isString(id) || value === undefined){
            throw new Error('Invalid parameters: ('+id+','+value+')');
        }
        var info = extract(id), alias = info.alias, ns = info.namespace;
        ns.element(alias, value);
        //use cleaned ID
        id = info.id;

        if (id in pending) {
            var res = pending[id];
            delete pending[id];

            res.resolve();
        }
    };
    function define(id, dependencies, factory) {
        var a = id, b = dependencies, c = factory;

        if(isArray(id) && isFunction(dependencies)){
            a = '';
            b = id;
            c = dependencies;
        }
        else if(isString(id) && isFunction(dependencies)){
            a = id;
            b = [];
            c = dependencies;
        }

        if(isString(a) && isArray(b) && isFunction(c)){
            var res = new Resource({id: a, dependencies: b, factory: c}).load();
            if(!res.schema){
                console.warn("Unable to find a compatible schema for: '"+a+"'");
            }
        }
        else{
            throw new Error('Invalid parameters: ('+id+','+dependencies+','+factory+')');
        }
        return target;
    };
    function require(id, callback) {

    };
    //------------------------------------------------------------------------------------------------------
    target[rootNs] = root;
    target.namespace = namespace;
    target.provide = provide;
    target.require = require;
    target.define = define;

    //------------------------------------------------------------------------------------------------------
})(window, 'mix');
