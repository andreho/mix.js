/**
 * Created by A.Hofmann on 21.02.2015.
 */
mix.config("mix.core", {
	baseUrl: "/Example/Mx",
	schemas: {
		external: mix.Schema({
			url: {
				jQuery: "http://code.jquery.com/jquery-2.1.3.min.js"
			},
			mime: {
				"default": "text/javascript"
			}
		}),
		library: mix.Schema({
			mime: {
				"default": "text/javascript"
			},
			path: "/libs",
			suffix: ".js",
			injector: function(dep, src)
			{
				"use strict";
				var script = window.document.createElement("script");
				script.type = dep.mime;
				script.setAttribute("data-alias", dep.key);
				script.textContent = src;
				window.document.head.appendChild(script);
				dep.resolve();
			}
		})
	}
});
_mix_.resource().alias("test_lib").type("library").requires("jQuery", "test_lib2").build(function()
{
	"use strict";
	var category = {
		name: "people",
		members: []
	}
	var anna = {
		category: category,
		sex: "female",
		name: "Anna",
		age: 27,
		height: 177.5,
		married: true,
		skills: ["psychologist", "write", "speak"],
		partner: undefined
	}
	var andre = {
		category: category,
		sex: "male",
		name: "Andre",
		age: 30,
		height: 178.5,
		married: true,
		skills: ["drink", "code", "sleep"],
		partner: anna
	}
	anna.partner = andre;
	category.members.push(anna, andre);
	return andre;
}).resource({alias: "jQuery", type: "external", requires: "test_lib2"}).build(function()
{
	"use strict";
	var counter = 1;
	window.out = function(val)
	{
		$("#out").prepend('<div>' + (counter++) + ': ' + val + '</div>');
	};
	return jQuery;
}).resource({alias: "test_lib2", type: "library"}).build(function()
{
	"use strict";
	return "bla2";
});