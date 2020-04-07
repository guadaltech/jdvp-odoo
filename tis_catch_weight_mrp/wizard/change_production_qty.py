# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models
from odoo.addons import decimal_precision as dp


class ChangeProductionQty(models.TransientModel):
    _inherit = 'change.production.qty'

    cw_qty = fields.Float(
        string='Quantity CW To Produce',
        digits=dp.get_precision('Product Unit of Measure'),
        required=True
    )

    @api.model
    def default_get(self, fields):
        res = super(ChangeProductionQty, self).default_get(fields)
        if 'cw_qty' in fields and not res.get('cw_qty') and res.get('mo_id'):
            res['cw_qty'] = \
                self.env['mrp.production'].browse(res['mo_id']).cw_qty
        return res

    @api.multi
    def change_prod_qty(self):
        res = super(ChangeProductionQty, self).change_prod_qty()
        for wizard in self:
            production = wizard.mo_id
            production.write({'cw_qty': wizard.cw_qty})
        return res
