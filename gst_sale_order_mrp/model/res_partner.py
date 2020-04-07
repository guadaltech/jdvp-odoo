# -*- coding: utf-8 -*-
# © 2015 Agile Business Group
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).


from odoo import api, fields, models, _


class ResPartnerBom(models.Model):
    _name = 'res.partner.bom'

    product_tmpl_id = fields.Many2one(
        comodel_name='product.template',
        string='Product',
        required=True
    )
    bom_id = fields.Many2one(
        comodel_name='mrp.bom',
        string='BoM',
        required=True
    )
    partner_id = fields.Many2one(
        comodel_name='res.partner',
        string='Partner'
    )

    @api.multi
    @api.onchange('product_tmpl_id')
    def product_tmpl_id_change(self):
        self.bom_id = False


class ResPartner(models.Model):
    _inherit = 'res.partner'

    partner_bom_ids = fields.One2many(
        comodel_name='res.partner.bom',
        inverse_name='partner_id',
        string='Partner Bom'
    )