# -*- coding: utf-8 -*-
# © 2015 Agile Business Group
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).


from odoo import api, fields, models, _
from odoo.exceptions import UserError


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    bom_id = fields.Many2one(
        comodel_name='mrp.bom',
        string='BoM'
    )
    bom_ids = fields.Many2many(
        comodel_name='mrp.bom',
        string='BoM',
        compute='_compute_bom_ids'
    )

    @api.depends('order_id.partner_id')
    def _compute_bom_ids(self):
        for line in self:
            part_id = line.order_id.partner_id
            if part_id:
                bom_ids = part_id.mapped('partner_bom_ids')
                bom_ids = bom_ids.filtered(lambda a:
                                           a.product_tmpl_id.id ==
                                           line.product_id.product_tmpl_id.id)
                line.bom_ids = bom_ids.mapped('bom_id')


    @api.multi
    @api.onchange('product_id')
    def product_id_change(self):
        partner_id = self.order_id.partner_id
        if not partner_id:
            raise UserError(_("Please, select the partner."))
        res = super(SaleOrderLine, self).product_id_change()
        if res.get('domain', False):
            bom_ids = partner_id.mapped('partner_bom_ids')
            bom_ids = bom_ids.filtered(lambda a:
                                       a.product_tmpl_id.id ==
                                       self.product_id.product_tmpl_id.id)
            res['domain'].update({'bom_id': [('id', 'in',
                                              bom_ids.mapped('bom_id').mapped('id'))]})
        return res
