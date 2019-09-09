odoo.define('aspl_pos_partial_payment_ee.popups', function (require) {
	"use strict";
	var gui = require('point_of_sale.gui');
	var keyboard = require('point_of_sale.keyboard').OnscreenKeyboardWidget;
	var rpc = require('web.rpc');
	var chrome = require('point_of_sale.chrome');
	var utils = require('web.utils');
	var PopupWidget = require('point_of_sale.popups');
	
	var core = require('web.core');
	var QWeb = core.qweb;
	var round_pr = utils.round_precision;
	var _t = core._t;

	var MaxCreditExceedPopupWidget = PopupWidget.extend({
	    template: 'MaxCreditExceedPopupWidget',
	    show: function(options){
	        var self = this;
	        this._super(options);
	    },
        events: _.extend({}, PopupWidget.prototype.events, {
            'click .button.override_payment':  'click_override_payment',
        }),
        click_override_payment: function(){
        	var self = this;
        	if(self.options.payment_obj){
            	this.options.payment_obj.finalize_validation();
            } else if(self.options.draft_order){
            	this.pos.push_order(this.pos.get_order());
            	self.gui.show_screen('receipt');
            }
            this.gui.close_popup();
        },
	});
	gui.define_popup({name:'max_limit', widget: MaxCreditExceedPopupWidget});

	var ProductPopup = PopupWidget.extend({
	    template: 'ProductPopup',
	    show: function(options){
	    	var self = this;
			this._super();
			this.order_lines = options.order_lines || false;
			this.order_id = options.order_id || false;
			this.state = options.state || false;
			this.order_screen_obj = options.order_screen_obj || false;
			this.renderElement();
	    },
	    click_confirm: function(){
	        if (this.state == "paid" || this.state == "done"){
	        	$("#re_order_duplicate[data-id='"+ this.order_id +"']").click();
	        } else if(this.state == "draft") {
	        	$("#edit_order[data-id='"+ this.order_id +"']").click();
			}
			this.gui.close_popup();
	    },
    	click_cancel: function(){
    		this.gui.close_popup();
    	}
	    
	});
	gui.define_popup({name:'product_popup', widget: ProductPopup});

});