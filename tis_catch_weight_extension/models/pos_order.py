from odoo import models


class PosOrder(models.Model):
    _inherit = "pos.order"

    def _action_create_invoice_line(self, line=False, invoice_id=False):
        InvoiceLine = self.env['account.invoice.line']
        inv_name = line.product_id.name_get()[0][1]
        inv_line = {
            'invoice_id': invoice_id,
            'product_id': line.product_id.id,
            'quantity': line.qty if self.amount_total >= 0 else -line.qty,
            'account_analytic_id': self._prepare_analytic_account(line),
            'name': inv_name,
            'product_cw_uom': line.product_cw_uom.id,
            'product_cw_uom_qty': line.product_cw_uom_qty
        }
        invoice_line = InvoiceLine.sudo().new(inv_line)
        invoice_line._onchange_product_id()
        invoice_line.invoice_line_tax_ids = [(6, False, line.tax_ids_after_fiscal_position.filtered(lambda t: t.company_id.id == line.order_id.company_id.id).ids)]
        inv_line = invoice_line._convert_to_write({name: invoice_line[name] for name in invoice_line._cache})
        inv_line.update(price_unit=line.price_unit, discount=line.discount)
        return InvoiceLine.sudo().create(inv_line)
