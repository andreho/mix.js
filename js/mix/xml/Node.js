/**
 * Created by a.hofmann on 22.03.2015.
 */
mix.declare("mix.xml.Node", ["mix.Utils", "mix.xml.Attr", "mix.xml.Text"], function (Utils, Attr, Text) {
    function Node(name, type, ns, prefix) {
        this.parent = null;
        this.type = type || Node.ELEMENT_NODE;

        this.name = name;

        this.ns = ns || "";
        this.prefix = prefix || "";

        this.attributes = {};
        this.children = [];
    }

    //-----------------------------------------------------------------------------------------------------------------------

    Object.defineProperty(Node.prototype, "length", {
       get: function(){
           return this.children.length;
       },
       set: function(l){
           this.children.length = (0 | l);
       }
    });
    Node.prototype.getAttribute = function(name)
    {
        var hash = this.attributes[""];
        if(hash && hash.hasOwnProperty(name)){
            return hash[name].value;
        }
        return undefined;
    };
    Node.prototype.setAttribute = function(name, value)
    {
        var hash;
        if(!(hash = this.attributes[""])){
            this.attributes[""] = hash = {};
        }
        hash[name] = new Attr(name, value);
        return this;
    };
    Node.prototype.removeAttribute = function(name)
    {
        var hash;
        if((hash = this.attributes[""])){
            delete hash[name];
        }
        return this;
    };
    Node.prototype.hashAttribute = function(name)
    {
        var hash;
        return (hash = this.attributes[""]) && (name in hash);
    };
    Node.prototype.getAttributeNS = function(ns, name)
    {
        ns = ns || "";
        var hash = this.attributes[ns];
        if(hash && hash.hasOwnProperty(name)){
            return hash[name].value;
        }
        return undefined;
    };
    Node.prototype.setAttributeNS = function(name, value, ns, prefix)
    {
        var hash; ns = ns || "";
        if(!(hash = this.attributes[ns])){
            this.attributes[ns] = hash = {};
        }
        hash[name] = new Attr(name, value, ns, prefix);
        return this;
    };
    Node.prototype.removeAttributeNS = function(ns, name)
    {
        var hash; ns = ns || "";
        if((hash = this.attributes[ns])){
            delete hash[name];
        }
        return this;
    };
    Node.prototype.hashAttributeNS = function(ns, name)
    {
        var hash; ns = ns || "";
        return (hash = this.attributes[ns]) && (name in hash);
    };

    //------------------------------------------------------------------------------------------------------

    Node.prototype.append = function(o)
    {
        if(o instanceof Node)
        {
            o.parent = this;
            this.children[this.length] = o;
        }
        else if(o instanceof Attr)
        {
            this.setAttributeNS(o.name, o.value, o.ns, o.prefix);
        }
        else if(Utils.isString(o))
        {
            o.parent = this;
            this.children[this.length] = new Text(o);
        }
        return this;
    };

    Node.prototype.preAppend = function(o)
    {
        if(o instanceof Node || Utils.isString(o))
        {
            o.parent = this;
            this.children.unshift(o);
        }
        else if(o instanceof Attr)
        {
            this.setAttributeNS(o.name, o.value, o.ns, o.prefix);
        }
        return this;
    };

    //-----------------------------------------------------------------------------------------------------------------------

    Node.ELEMENT_NODE = 0;
    Node.TEXT_NODE = 1;

    return Node;
});