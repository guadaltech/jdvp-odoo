## -*- coding: utf-8 -*-
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "GST Invoice Production Lots",
    "version": "12.0.0.0.1",
    "author": "Guadaltech Soluciones tecnológicas S.L.",
    "summary": "Display delivered serial numbers in invoice",
    'license': 'AGPL-3',
    'category': 'Accounting & Finance',
    "depends": ["account",
                "sale_stock",
                "stock_picking_invoice_link",
    ],
    'data': [
        'views/account_invoice_views.xml',
        'report/report_invoice.xml',
    ],
    'installable': True,
}
