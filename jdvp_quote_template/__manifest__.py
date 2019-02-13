# -*- coding: utf-8 -*-
{
    'name': "jdvp_saleorder_template",

    'summary': """
        Sale Order Template for JdVP""",

    'description': """
        Ad-hoc sale order template to replace standard one
    """,

    'author': "SPSI",
    'website': "http://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/12.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    # 'category': 'Uncategorized',
    'category': 'Sales',
    'version': '0.1',

    # any module necessary for this one to work correctly
    # 'depends': ['base'],
    'depends': ['sale'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
