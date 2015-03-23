/**
 * Created by A.Hofmann on 17.03.2015 at 23:25.
 */
mix.declare("mix.template.Compiler", ["mix.Utils"], function (Utils) {
    function Compiler(xmlTemplate) {
        if (!(this instanceof Compiler)) {
            return new Compiler(xmlTemplate);
        }

        this.template = xmlTemplate;
        this.value = "";
    }

    Compiler.prototype.compile = function () {

    };

    Compiler.prototype.toString = function () {
        return this.value;
    };

    return Compiler;
});