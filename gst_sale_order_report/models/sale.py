# -*- coding: utf-8 -*-
from odoo import fields, models, api


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def _get_taxes(self):
        """
        Retrieves the taxes of an SO.
        """
        res_taxes = {}
        for line in self.order_line:
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            taxes = line.tax_id.compute_all(price, line.order_id.currency_id, line.product_uom_qty,
                                            product=line.product_id, partner=line.order_id.partner_shipping_id)
            for res in taxes.get('taxes', []):
                if res_taxes.get(res['name'], False):
                    res_taxes[res['name']][1] += res['amount']
                else:
                    res_taxes[res['name']] = [res['name'], res['amount']]
        return res_taxes.values()

