# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api
from odoo import models


class MrpProduction(models.Model):
    _inherit = 'mrp.production'

    @api.model
    def create(self, values):
        if 'origin' in values:
            # Checking first if this comes from a 'sale.order'
            dom = [('name', '=', values['origin'])]
            sale_id = self.env['sale.order'].search(dom, limit=1)
            if not sale_id:
                # Checking if this production comes from a route
                dom = [('name', '=', values['origin'])]
                production_id = self.env['mrp.production'].search(dom)
                # If so, use the 'sale_order_id' from the parent production
                sale_id = production_id.sale_order_id.id
            if sale_id:
                line_id = sale_id.order_line
                line_id = line_id.filtered(lambda a:
                                           a.product_id.id == values.get(
                                               'product_id') and
                                           a.product_uom_qty == values.get(
                                               'product_qty'))
                if line_id and line_id.bom_id:
                    values['bom_id'] = line_id.bom_id.id
        return super(MrpProduction, self).create(values)

    @api.onchange('product_id', 'picking_type_id',
                  'company_id', 'sale_order_id')
    def onchange_product_id(self):
        if not self.product_id:
            self.bom_id = False
        else:
            if not self.sale_order_id:
                bom_obj = self.env['mrp.bom']
                bom = bom_obj._bom_find(product=self.product_id,
                                        picking_type=self.picking_type_id,
                                        company_id=self.company_id.id)
            else:
                line_id = self.sale_order_id
                line_id = \
                    line_id.filtered(lambda a:
                                     a.product_id.id == self.product_id.id and
                                     a.product_uom_qty == self.product_qty)
                bom = line_id.bom_id
            if bom.type == 'normal':
                self.bom_id = bom.id
                self.product_qty = self.bom_id.product_qty
                self.product_uom_id = self.bom_id.product_uom_id.id
            else:
                self.bom_id = False
                self.product_uom_id = self.product_id.uom_id.id
            dom = [('category_id', '=',
                    self.product_id.uom_id.category_id.id)]
            return {'domain': {'product_uom_id': dom}}
