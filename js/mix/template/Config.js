/**
 * Created by A.Hofmann on 17.03.2015 at 23:28.
 */
mix.declare("mix.template.Config", ["mix.Utils"], function(Utils)
{
	"use strict";

	var cfg = {
		tags:{
		},
		attributes:{
		}
	};

	return {
		config: cfg,
		hasTag: function(tagName, nsUri){
			nsUri = nsUri || "";
			var hash = cfg.tags[nsUri];
			return hash && tagName in hash;
		},
		hasAttribute: function(name, nsUri){
			nsUri = nsUri || "";
			var hash = cfg.attributes[nsUri];
			return hash && name in hash;
		}
	};
});