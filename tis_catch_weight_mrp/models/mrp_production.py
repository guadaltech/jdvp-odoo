# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class MrpProduction(models.Model):
    _inherit = 'mrp.production'

    product_cw_uom = fields.Many2one(
        comodel_name='uom.uom',
        string='CW-UOM',
        states={'done': [('readonly', True)]}
    )
    cw_qty = fields.Float(
        string='CW-Qty',
        states={'done': [('readonly', True)]}
    )

    @api.onchange('product_id', 'picking_type_id',
                  'company_id', 'sale_order_id')
    def onchange_product_id(self):
        res = super(MrpProduction, self).onchange_product_id()
        self.product_cw_uom = self.product_id.cw_uom_id.id
        return res

    @api.model
    def create(self, values):
        res = super(MrpProduction, self).create(values)
        if values.get('sale_order_id', False):
            order = self.env['sale.order'].browse(values.get('sale_order_id'))
            if order.exists():
                line_id = order.order_line
                line_id = line_id.filtered(lambda a:
                                           a.product_id.id == values.get(
                                               'product_id') and
                                           a.product_uom_qty == values.get(
                                               'product_qty'))
                if line_id and line_id.product_cw_uom_qty:
                    res.write({'cw_qty': line_id.product_cw_uom_qty,
                               'product_cw_uom': line_id.product_cw_uom.id})
        return res
