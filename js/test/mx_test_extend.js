/**
 * Created by Big on 21.02.2015.
 */
mix.extend("mix.Utils", ["mix.coll.SortedMap"], function(Utils, SortedMap)
{
	"use strict";
	console.log("Extend ok? : " + (Utils === mix.Utils && SortedMap === mix.coll.SortedMap));
});