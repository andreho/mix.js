/**
 * Created by A.Hofmann on 21.02.2015.
 */
mix.extend("mix.Utils", ["mix.coll.SortedMap"], function(Utils, SortedMap)
{
	"use strict";
	console.log("Extend ok? : " + (Utils === mix.Utils && SortedMap === mix.coll.SortedMap));
});

mix.config("mix.core")
/**
 * Created by A.Hofmann on 21.02.2015.
 */
mix.extend("mix.template.Compiler", ["mix.Parser", "template:test"], function (Compiler, Parser, data) {
    "use strict";

    console.log(data);
});