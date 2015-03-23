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

        this.attributes = {}
        this.children = [];
    }

    //-----------------------------------------------------------------------------------------------------------------------

    Node.ELEMENT_NODE = 0;
    Node.TEXT_NODE = 1;
    Node.COMMENT_NODE = 2;
    Node.OTHER_NODE = 3;

    return Node;
});