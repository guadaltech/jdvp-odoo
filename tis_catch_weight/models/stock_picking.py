# -*- coding: utf-8 -*-
# Copyright (C) 2017-Today  Technaureus Info Solutions(<http://technaureus.com/>).
from odoo import models, fields, api, _
from odoo.tools.float_utils import float_is_zero
from odoo.exceptions import UserError, ValidationError


class StockPicking(models.Model):
    _inherit = 'stock.picking'

    @api.multi
    def button_validate(self):
        precision_digits = self.env['decimal.precision'].precision_get(
            'Product Unit of Measure')
        no_qty = all(float_is_zero(move_line.product_cw_uom_qty,
                                   precision_digits=precision_digits)
                     for move_line in self.move_line_ids.filtered(
            lambda m: m.state not in ('done', 'cancel')))
        # if no_qty:
        #     raise UserError(_('You cannot validate a transfer if no CW Done.'))
        return super(StockPicking, self).button_validate()
