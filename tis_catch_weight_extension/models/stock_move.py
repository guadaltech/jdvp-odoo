from odoo import models, api


class StockMove(models.Model):
    _inherit = "stock.move"

    def _action_assign(self):
        for res in self:
            dom = [('order_id.picking_id', '=', res.picking_id.id),
                   ('product_id', '=', res.product_id.id),
                   ('qty', '=', res.product_uom_qty)]
            pol = self.env['pos.order.line']
            for pol_id in pol.search(dom):
                res.write({'product_cw_uom_qty': pol_id.product_cw_uom_qty,
                           'product_cw_uom': pol_id.product_cw_uom.id})
        return super(StockMove, self)._action_assign()
