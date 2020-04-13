from odoo import fields, models, api, _
from odoo.exceptions import UserError


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    product_cw_uom = fields.Many2one(
        related="product_id.cw_uom_id",
        string='CW-UOM')

    product_cw_uom_qty = fields.Float(
        string='CW-Qty',
        default=1.0
    )

    @api.onchange('price_unit', 'tax_ids', 'qty',
                  'discount', 'product_id', 'product_cw_uom_qty')
    def _onchange_amount_line_all(self):
        super(PosOrderLine, self)._onchange_amount_line_all()

    def _compute_amount_line_all(self):
        if not self.env.user.has_group(
                'tis_catch_weight.group_catch_weight') or self.product_id.sale_price_base != 'cwuom':
            return super(PosOrderLine, self)._compute_amount_line_all()
        self.ensure_one()
        fpos = self.order_id.fiscal_position_id
        tax_ids_after_fiscal_position = fpos.map_tax(self.tax_ids, self.product_id,
                                                     self.order_id.partner_id) if fpos else self.tax_ids
        price = self.price_unit * (1 - (self.discount or 0.0) / 100.0)
        qty = self.qty
        if self.product_id.sale_price_base == 'cwuom':
            qty = self.product_cw_uom_qty
        currency_id = self.order_id.pricelist_id.currency_id
        taxes = tax_ids_after_fiscal_position.compute_all(price,
                                                          currency_id,
                                                          qty,
                                                          product=self.product_id,
                                                          partner=self.order_id.partner_id)
        return {'price_subtotal_incl': taxes['total_included'],
                'price_subtotal': taxes['total_excluded']}

    @api.onchange('product_id')
    def _onchange_product_id(self):
        super(PosOrderLine, self)._onchange_product_id()
        if self.product_id and self.product_id.sale_price_base == 'cwuom':
            if not self.order_id.pricelist_id:
                raise UserError(
                    _('You have to select a pricelist in the sale form !\n'
                      'Please set one before choosing a product.'))
            pricelist_id = self.order_id.pricelist_id
            price = pricelist_id.get_product_price(self.product_id,
                                                   self.product_cw_uom_qty or 1.0,
                                                   self.order_id.partner_id)
            self._onchange_qty()
            self.tax_ids = self.product_id.taxes_id.filtered(
                lambda r: not self.company_id or r.company_id == self.company_id)
            fpos = self.order_id.fiscal_position_id
            tax_ids_after_fiscal_position = \
                fpos.map_tax(self.tax_ids, self.product_id,
                             self.order_id.partner_id) \
                    if fpos else self.tax_ids
            at = self.env['account.tax']
            self.price_unit = at._fix_tax_included_price_company(price,
                                                                 self.product_id.taxes_id,
                                                                 tax_ids_after_fiscal_position,
                                                                 self.company_id)

    @api.onchange('qty', 'product_cw_uom_qty', 'discount',
                  'price_unit', 'tax_ids')
    def _onchange_qty(self):
        super(PosOrderLine, self)._onchange_qty()
        if self.product_id and self.product_id.sale_price_base == 'cwuom':
            if not self.order_id.pricelist_id:
                raise UserError(
                    _('You have to select a pricelist in the sale form.'))
            price = self.price_unit * (1 - (self.discount or 0.0) / 100.0)
            self.price_subtotal = \
                self.price_subtotal_incl = price * self.product_cw_uom_qty
            if self.product_id.taxes_id:
                currency_id = self.order_id.pricelist_id.currency_id
                taxes = self.product_id.taxes_id.compute_all(price,
                                                             currency_id,
                                                             self.product_cw_uom_qty,
                                                             product=self.product_id,
                                                             partner=False)
                self.price_subtotal = taxes['total_excluded']
                self.price_subtotal_incl = taxes['total_included']
