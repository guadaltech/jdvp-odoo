odoo.define('tis_catch_weight_extension.screens', function (require) {
"use strict";

var screens = require('point_of_sale.screens');
var gui = require('point_of_sale.gui');
var core = require("web.core");
var _t = core._t;

//      FORMA FINAL //
//Adding a click event to the new icon
screens.OrderWidget.include({
    render_orderline: function(orderline) {
        var self = this;
        var el_node = this._super(orderline);
        var el_custom_qty_icon = el_node.querySelector('.line-custom_qty-icon');
        if(el_custom_qty_icon) {
            el_custom_qty_icon.addEventListener('click', (function() {
                this.pos.gui.show_popup('cwqtyline', {
                    'title': _t('Change the cw qty'),
                    'order_line': orderline,
                    'order': this.pos.get_order(),
                });
            }.bind(this)));
        }
        return el_node;
    },
});

});