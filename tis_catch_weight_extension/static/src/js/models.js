odoo.define('tis_catch_weight_extension.models', function (require) {
"use strict";

var models = require('point_of_sale.models');
var superOrderline = models.Orderline.prototype;
var superOrder = models.Order.prototype;
var field_utils = require('web.field_utils');
var utils = require('web.utils');
var round_pr = utils.round_precision;

//Adding the sale_price_base boolean and the product_cw_uom_qty fields
models.load_fields('product.product', ['sale_price_base','product_cw_uom_qty','cw_uom_id']);

//      PRIMERA FORMA //
//Setting the has_product_cw property
models.Orderline = models.Orderline.extend({
    initialize: function(attr,options){
        var self = this;
        superOrderline.initialize.apply(this,arguments);
        this.set_product_cw_uom(this.product);
    },

    set_product_cw_uom: function(product){
        this.has_product_cw = product.sale_price_base == 'cwuom';
    },

    init_from_JSON: function(json) {
        var self = this;
        superOrderline.init_from_JSON.apply(this,arguments);
        this.product = this.pos.db.get_product_by_id(json.product_id);
        this.set_product_cw_uom(this.product);
    },

    export_as_JSON: function() {
        var self = this;
        var res = superOrderline.export_as_JSON.apply(this,arguments);
        if(this.has_product_cw) {
            res['product_cw_uom_qty'] = this.quantityCustom;
        }

        return res;
    },

    get_quantity_custom: function() {
        return this.quantityCustom;
    },

    get_quantity_custom_str: function(){
        return this.quantityCustomStr;
    },

    get_unit_custom: function() {
        var unit_id = this.product.cw_uom_id;
        if(!unit_id){
            return undefined;
        }
        if(!this.pos){
            return undefined;
        }
        return this.pos.units_by_id[unit_id[0]];
    },

    get_sale_price_base: function() {
        return this.product.sale_price_base == 'cwuom';
    },

    set_quantity: function(quantity, keep_price){
        this.order.assert_editable();
        if(quantity === 'remove'){
            this.order.remove_orderline(this);
            return;
        }else{
            var quant = parseFloat(quantity) || 0;
            if(this.get_sale_price_base()) {
                var unit = this.get_unit_custom();

            } else {
                var unit = this.get_unit();
            }
            if(unit){
                if (unit.rounding) {
                    var decimals = this.pos.dp['Product Unit of Measure'];
                    var rounding = Math.max(unit.rounding, Math.pow(10, -decimals));
                    if (this.get_sale_price_base()) {
                        this.quantityCustom = round_pr(quant, rounding);
                        this.quantityCustomStr = field_utils.format.float(this.quantityCustom, {digits: [69, decimals]});
                        if(this.quantity == null) {
                            this.quantity    = round_pr(parseFloat(1) || 0, rounding);
                            this.quantityStr = field_utils.format.float(this.quantity, {digits: [69, decimals]});
                        }
                    } else {
                        this.quantity    = round_pr(quant, rounding);
                        this.quantityStr = field_utils.format.float(this.quantity, {digits: [69, decimals]});
                    }
                } else {
                    if (this.get_sale_price_base()) {
                        this.quantityCustom = round_pr(quant, 1);
                        this.quantityCustomStr = this.quantityCustom.toFixed(0);
                        if(this.quantity == null) {
                            this.quantity    = round_pr(parseFloat(1) || 0, 1);
                            this.quantityStr = this.quantity.toFixed(0);
                        }
                    } else {
                        this.quantity    = round_pr(quant, 1);
                        this.quantityStr = this.quantity.toFixed(0);
                    }
                }
            }else{
                if(this.get_sale_price_base()) {
                    this.quantityCustom    = quant;
                    this.quantityCustomStr = '' + this.quantityCustom;
                    if(this.quantity == null) {
                        this.quantity    = parseFloat(1) || 0;
                        this.quantityStr = '' + this.quantity;
                    }
                } else {
                    this.quantity    = quant;
                    this.quantityStr = '' + this.quantity;
                }

            }
        }

        // just like in sale.order changing the quantity will recompute the unit price
        if(! keep_price && ! this.price_manually_set){
            if(this.get_sale_price_base()) {
                this.set_unit_price(this.product.get_price(this.order.pricelist, this.get_quantity_custom()));
                this.order.fix_tax_included_price(this);
            } else {
                this.set_unit_price(this.product.get_price(this.order.pricelist, this.get_quantity()));
                this.order.fix_tax_included_price(this);
            }

        }
        this.trigger('change', this);
    },

    set_quantity_popup: function(quantity, keep_price){
        this.order.assert_editable();
        if(quantity === 'remove'){
            this.order.remove_orderline(this);
            return;
        }else{
            var quant = parseFloat(quantity) || 0;
            var unit = this.get_unit();
            if(unit){
                if (unit.rounding) {
                    var decimals = this.pos.dp['Product Unit of Measure'];
                    var rounding = Math.max(unit.rounding, Math.pow(10, -decimals));
                    this.quantity    = round_pr(quant, rounding);
                    this.quantityStr = field_utils.format.float(this.quantity, {digits: [69, decimals]});
                } else {
                    this.quantity    = round_pr(quant, 1);
                    this.quantityStr = this.quantity.toFixed(0);
                }
            }else{
                this.quantity    = quant;
                this.quantityStr = '' + this.quantity;
            }
        }

        this.trigger('change', this);
    },

    get_all_prices: function(){
        var price_unit = this.get_unit_price() * (1.0 - (this.get_discount() / 100.0));
        var taxtotal = 0;

        var product =  this.get_product();
        var taxes_ids = product.taxes_id;
        var taxes =  this.pos.taxes;
        var taxdetail = {};
        var product_taxes = [];

        _(taxes_ids).each(function(el){
            product_taxes.push(_.detect(taxes, function(t){
                return t.id === el;
            }));
        });

        if(this.get_sale_price_base()) {
            var all_taxes = this.compute_all(product_taxes, price_unit, this.get_quantity_custom(), this.pos.currency.rounding);
            _(all_taxes.taxes).each(function(tax) {
            taxtotal += tax.amount;
            taxdetail[tax.id] = tax.amount;
            });
        } else {
            var all_taxes = this.compute_all(product_taxes, price_unit, this.get_quantity(), this.pos.currency.rounding);
            _(all_taxes.taxes).each(function(tax) {
            taxtotal += tax.amount;
            taxdetail[tax.id] = tax.amount;
            });
        }


        return {
            "priceWithTax": all_taxes.total_included,
            "priceWithoutTax": all_taxes.total_excluded,
            "tax": taxtotal,
            "taxDetails": taxdetail,
        };
    },

    get_base_price:    function(){
        var rounding = this.pos.currency.rounding;
        if(this.get_sale_price_base()) {
            return round_pr(this.get_unit_price() * this.get_quantity_custom() * (1 - this.get_discount()/100), rounding);
        } else {
            return round_pr(this.get_unit_price() * this.get_quantity() * (1 - this.get_discount()/100), rounding);
        }

    },

});

});