/**
 * Created by A.Hofmann on 17.03.2015 at 23:33.
 */
mix.declare("mix.Parser", ["mix.Utils"], function(Utils)
{
	"use strict";
	function Parser(xml, resultType)
	{
		if(!(this instanceof Parser))
		{
			return new Parser(xml);
		}
		this.resultType = resultType || Parser.XML;
		this.result = null;
		if(Utils.isString(xml))
		{
			switch(this.resultType)
			{
				case "XML":
				{
					this.result = this.toXml(str);
				}
					break;
			}
		}
	}

	//-----------------------------------------------------------------------------------------------------------------------
	function Node()
	{
		this.parent = null;
		this.ns = "";
		this.type = 0;
		this.prefix = "";
		this.name = ""
		this.before = "";
		this.after = "";
		this.children = [];
		this.attributes = {}
	}

	//-----------------------------------------------------------------------------------------------------------------------
	Parser.parseXML = (function()
	{
		if(Utils.isFunction(window.DOMParser))
		{
			return function toXML(str)
			{
				return new DOMParser().parseFromString(str, "application/xml");
			}
		}
		return function toXML(str)
		{
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = false;
			xmlDoc.loadXML(str);
			return xmlDoc;
		}
	})();
	//-----------------------------------------------------------------------------------------------------------------------
	Parser.XML = "XML";
	//	Parser.HTML = "HTML";
	//	Parser.JSON = "JSON";
	//-----------------------------------------------------------------------------------------------------------------------
	return Parser;
});