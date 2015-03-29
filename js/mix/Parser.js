/**
 * Created by A.Hofmann on 17.03.2015 at 23:33.
 */
mix.declare("mix.Parser", ["mix.Utils", "mix.xml.Node", "mix.xml.Attr", "mix.xml.Text"],
	function(Utils, Node, Attr, Text)
{
	"use strict";
    function Parser(input, resultType)
	{
		if(!(this instanceof Parser))
		{
            return new Parser(input, resultType);
		}

		this.resultType = resultType || Parser.XML;

		this.result = null;

        if (Utils.isString(input))
		{
			switch(this.resultType)
			{
				case "XML":
				{
                    this.result = Parser.parseXML(input);
				}
                    break;
                case "JSON":
                {
                    this.result = Parser.parseJSON(input);
                }
				case "XML2JSON":
				{
					this.result = Parser.parseXML2JSON(input);
				}
                    break;
                default:
                {
                    throw new Error("Unsupported result type: " + resultType);
                }
			}
		}
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

    Parser.parseJSON = (function () {
        if (Utils.isFunction(window.JSON) && Utils.isFunction(window.JSON.parse)) {
            return function toJSON(str) {
                return JSON.parse(str);
            }
        }
        return function (str) {
            throw new Error("Please provide a JSON parser (you need to redefine Parser.parseJSON and provide a JSON parser).");
        }
    })();

	//-----------------------------------------------------------------------------------------------------------------------

	Parser.parseXML2JSON = function (str) {
		var xml = Utils.isString(str)? Parser.parseXML(str) : str;

		if(xml.nodeType === window.Node.DOCUMENT_NODE){
			xml = xml.childNodes[0];
		}

		var res = new Node();


	};

	//-----------------------------------------------------------------------------------------------------------------------

    Parser.XML = "XML";
    Parser.JSON = "JSON";
    Parser.XML2JSON = "XML2JSON";
	//	Parser.HTML = "HTML";

    return Parser;
});

//-----------------------------------------------------------------------------------------------------------------------

