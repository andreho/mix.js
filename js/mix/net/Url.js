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