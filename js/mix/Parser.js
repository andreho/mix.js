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
	Parser.prototype.toXml = (function()
	{
		if(Utils.isFunction(window.DOMParser))
		{
			return function toXml(str)
			{
				return new DOMParser().parseFromString(str, "application/xml");
			}
		}
		return function toXml(str)
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