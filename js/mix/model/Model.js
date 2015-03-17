/**
 * Created by Big on 06.03.2015.
 */
mix.declare("mix.model.Model", ["mix.model.Config", "mix.event.Dispatcher", "mix.Utils", "mix.Constants", "mix.Detector", "mix.model.Property"], function(ModelConfig, Dispatcher, Utils, Constants, Detector, Property)
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Model()
	{
		this.bindable = false;
		this.dataSymbol = ModelConfig.dataSymbol;
		this.dispatcherSymbol = ModelConfig.dispatcherSymbol;
	}

	/**
	 * Retrieves data that holds internal state of the given model
	 * @param val a model instance
	 * @return {Object} internal data storage
	 */
	Model.prototype.data = function data(val)
	{
		return val[this.dataSymbol];
	};
	/**
	 * Retrieves dispatcher of the given model instance
	 * @param val a model instance
	 * @return {mix.event.Dispatcher} internal dispatcher
	 */
	Model.prototype.dispatcher = function dispatcher(val)
	{
		return val[this.dispatcherSymbol];
	};
	//-----------------------------------------------------------------------------------------------------------------------
	Model.property = function()
	{
		return new Property();
	};
	/**
	 *
	 * @param cnstr
	 * @param parent
	 * @param def
	 * @returns {ExtendedModel}
	 */
	Model.extend = function extend(parent, def)
	{
		switch((parent ? 1 : 0) + (def ? 1 : 0))
		{
			case 1:
			{
				def = Utils.awaitObject(parent, 1);
				parent = Object;
			}
				break;
			case 2:
			{
				parent = Utils.awaitFunction(parent, 1);
				def = Utils.awaitObject(def, 2);
			}
				break;
			default:
			{
				throw new Error("Invalid parameter list.");
			}
		}
		var desc = {}, initLst = [], model = new Model(), isDispatcher = (parent instanceof Dispatcher);
		for(var name in def)
		{
			var member = def[name].name(name).freeze(model);
			if(member instanceof Property)
			{
				if(member._bindable)
				{
					model.bindable = true;
				}
				if(Utils.isFunction(member.factory()))
				{
					initLst.push(member);
				}
			}
			desc[name] = member.build();
		}
		function ExtendedModel()
		{
			parent.call(this);
			ModelConfig.dataSetup(this, {});
			if(model.bindable)
			{
				ModelConfig.dispatcherSetup(this, isDispatcher ? this : new Dispatcher(this));
			}
			for(var i = 0, l = initLst.length; i < l; i++)
			{
				var prop = initLst[i];
				prop._factory.call(prop, this);
			}
		}

		ExtendedModel.prototype = Object.create(parent.prototype, desc);
		ExtendedModel.prototype.constructor = ExtendedModel;
		ExtendedModel.model = model;
		return ExtendedModel;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	return Model;
});