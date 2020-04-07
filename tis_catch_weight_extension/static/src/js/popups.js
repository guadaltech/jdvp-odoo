odoo.define('tis_catch_weight_extension.popups', function (require) {
"use strict";

var popups = require('point_of_sale.popups');
var gui = require('point_of_sale.gui');

var CwQtyLineWidget = popups.extend({
    template: 'CwQtyLineWidget',

    show: function(options) {
        this._super(options);
    },

    click_confirm: function(){
        var order_line = this.options.order_line;
        order_line.set_quantity_popup(this.$('.cwqty-line-input')[0].value);
//        order_line.product_cw_uom = this.pos.units_by_id[parseInt(this.$('.cw_uom-lines')[0].value)];
        this.options.order.save_to_db();
        this.options.order_line.trigger('change', this.options.order_line);
        this.gui.close_popup();
    },
});

gui.define_popup({name: 'cwqtyline', widget: CwQtyLineWidget});

return { //Making the widget accessible from the outside
    CwQtyLineWidget: CwQtyLineWidget,
};

});