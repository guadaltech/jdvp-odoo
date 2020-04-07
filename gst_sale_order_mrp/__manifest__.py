# -*- coding: utf-8 -*-
# © 2015 Agile Business Group
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).


{
    'name': 'GST Sale Order MRP',
    'version': '12.0.1',
    'category': 'Sales Management',
    'author': "Guadaltech S.L",
    'website': 'http://www.guadaltech.es',
    'license': 'AGPL-3',
    'depends': ['sale_mrp_link'],
    'data': ['security/ir.model.access.csv',
             'views/res_partner_view.xml',
             'views/sale_view.xml'],
    'installable': True,
}
