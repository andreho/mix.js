/**
 * Created by A.Hofmann on 13.03.2015.
 */
mix.declare("mix.template.Template",
    ["mix.Utils", "mix.template.Config"],
    function (Utils, Config)
{
	"use strict";
    function Template(xml, config)
	{
        this.xml = xml;
        this.parts = [];
        this.parameters = {};
        this.parametersIndices = [];
	}

    //------------------------------------------------------------------------------------------------------

    function visitAll(template, xml){

        var parts = template.parts,
            nodeType = template.nodeType,
            tagName = template.tagName,
            prefix = template.prefix,
            nsUri = template.namespaceURI,
            attributes = template.attributes,
            child, attr, i, l, mark = parts.length;

        switch (nodeType)
        {
            case 1: /*ELEMENT*/
            {
                if(Config.hasTag(tagName, nsUri)){
                    return; //Custom handling
                }

                parts.push("<");
                if(prefix){
                    parts.push(prefix, ":");
                }
                parts.push(tagName);

                if((l = attributes.length) > 0){
                    for(i = 0; i<l; i++){
                        parts.push(" ");
                        attr = attributes.item(i);
                        if(Config.hasAttribute(attr.localName, attr.namespaceURI)){

                        }
                        else {
                            if(attr.prefix){
                                parts.push(prefix, ":");
                            }
                            parts.push(attr.localName,"=","\"",attr.textContent,"\"");
                        }
                    }
                }
                if((l = xml.childElementCount) > 0){
                    for(i = 0; i<l; i++){
                        child = xml.childNodes[0];
                        visitAll(template, child);
                    }
                }

                parts.push("</");
                if(prefix){
                    parts.push(prefix, ":");
                }
                parts.push(tagName, ">");
            }
                break;
            case 2: /*ATTRIBUTE*/
            case 3: /*TEXT*/
            case 4: /*CDATA*/
        }


    }

    //------------------------------------------------------------------------------------------------------

    Template.prototype.parse = function()
    {
        var xml = this.xml;
        if(xml.nodeType == Element.DOCUMENT_NODE){
            xml = xml.childNodes[0];
        }
        visitAll(this, xml);
    };

    //------------------------------------------------------------------------------------------------------

    return Template;
});