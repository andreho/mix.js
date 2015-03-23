/**
 * Created by a.hofmann on 22.03.2015.
 */
mix.declare("mix.xml.Text", function () {
    function Text(value) {
        this.type = Node.TEXT_NODE;
        this.value = value || "";
    }

    Text.prototype.toString = function () {
        return this.value;
    };

    return Text;
});