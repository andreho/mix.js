/**
 * Created by A.Hofmann on 17.03.2015 at 23:33.
 */
mix.declare("mix.xml.XmlParser", ["mix.Utils", "mix.Detector", "mix.Constants"], function(Utils, Detector, Constants)
{
	"use strict";
	function XmlParser(xml, resultType)
	{
		if(!(this instanceof XmlParser))
		{
			return new XmlParser(xml);
		}
		this.resultType = resultType || XmlParser.XML;
		this.result = null;
		if(Utils.isString(xml))
		{
			this.parse(xml);
		}
	}

	//-----------------------------------------------------------------------------------------------------------------------
	XmlParser.prototype.toXml = (function()
	{
		if(Utils.isFunction(window.DOMParser))
		{
			return function toXml(str)
			{
				new DOMParser().parseFromString(str, "text/xml");
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
	XmlParser.prototype.parse = function parse(str)
	{
		switch(this.resultType)
		{
			case "XML":
			{
				this.result = this.toXml(str);
			}
				break;
		}
	};
	//-----------------------------------------------------------------------------------------------------------------------
	XmlParser.HTML = "HTML";
	XmlParser.JSON = "JSON";
	XmlParser.XML = "XML";
	//-----------------------------------------------------------------------------------------------------------------------
	return XmlParser;
});