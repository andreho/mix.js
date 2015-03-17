/**
 * Created by A.Hofmann on 06.03.2015.
 */
mix.declare("mix.event.PropertyChangeEvent", ["mix.event.Event"], function(Event)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function PropertyChangeEvent(type, source, property, oldValue, newValue)
	{
		Event.call(this, type, source);
		this.property = property;
		this.oldValue = oldValue;
		this.newValue = newValue;
	}

	PropertyChangeEvent.prototype = Object.create(Event.prototype);
	PropertyChangeEvent.prototype.constructor = PropertyChangeEvent;
	//-----------------------------------------------------------------------------------------------------------------------
	return PropertyChangeEvent;
});
