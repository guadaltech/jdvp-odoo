# -*- coding: utf-8 -*-
{
    'name': "SPSI External layout background",
    'version': '0.1',

    'summary': """
        Remove default background from 1st Document Template""",

    'description': """
        Remove default background from Document Template (header and footer layout)
    """,

    'author': 'SPSI Sistemas',
    'company': 'SPSI Sistemas',

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/12.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',

    # any module necessary for this one to work correctly
    'depends': ['base', 'web'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        # 'views/views.xml',
        'views/external_layout_background_view.xml',
    ],
    'images': ['static/description/Logo-256.png'],
    'demo': [],
    'installable': True,
    'auto_install': False,
    'application': False,
}
