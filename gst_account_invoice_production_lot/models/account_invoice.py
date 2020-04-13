# -*- coding: utf-8 -*-
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import _, api, fields, models


class AccountInvoiceLine(models.Model):
    _inherit = "account.invoice.line"

    prod_lot_ids = fields.Many2many(
        comodel_name='stock.production.lot',
        compute='_compute_prod_lots',
        string="Production Lots",
    )

    lot_formatted_note = fields.Html(
        string='Formatted Note',
        compute='_compute_line_lots',
    )

    @api.multi
    def _compute_prod_lots(self):
        for line in self:
            line.prod_lot_ids = line.mapped(
                'move_line_ids.move_line_ids.lot_id'
            )

    @api.multi
    def _compute_line_lots(self):
        """Depending on traceability, render one lot by line, or serials
           separated by commas"""
        for line in self.filtered('prod_lot_ids'):
            if line.product_id.tracking == 'serial':
                line.lot_formatted_note = (
                    line.prod_lot_ids and '{}: {}'.format(
                        _('S/N'), ', '.join(line.prod_lot_ids.mapped('name'))
                    ))
                continue
            note = '<ul>'
            lot_strings = []
            for sml in line.mapped('move_line_ids.move_line_ids'):
                lot_strings.append('<li>%s %s (%s)</li>' % (
                    _('Lot'), sml.lot_id.name, sml.qty_done,
                ))
            if lot_strings:
                note += ' '.join(lot_strings)
                note += '</ul>'
                line.lot_formatted_note = note
