/**
 * Created by a.hofmann on 22.03.2015.
 */
mix.declare("mix.xml.Attr", function () {
    function Attr(name, value, ns, prefix) {
        this.name = name;
        this.value = value;

        if (ns) {
            this.ns = ns;
            this.prefix = prefix || "";
        }
        else {
            this.ns = this.prefix = "";
        }
    }

    Attr.prototype.toString = function () {
        return this.value;
    };

    return Attr;
});