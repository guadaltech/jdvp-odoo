# -*- coding: utf-8 -*-
{
    'name': 'Catch Weight Management-MRP',
    'version': '12.0.0.4',
    'sequence': 1,
    'category': 'MRP',
    "author": "Guadaltech Soluciones tecnológicas S.L.",
    'depends': ['tis_catch_weight',
                'sale_mrp_link',
                'gst_sale_order_mrp'
    ],
    'data': ['views/mrp_production_views.xml',
             'wizard/change_production_qty_views.xml'],
    'installable': True,
    'auto_install': False,
    'application': True
}
