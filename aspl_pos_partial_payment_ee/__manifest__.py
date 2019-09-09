# -*- coding: utf-8 -*-
#################################################################################
# Author      : Acespritech Solutions Pvt. Ltd. (<www.acespritech.com>)
# Copyright(c): 2012-Present Acespritech Solutions Pvt. Ltd.
# All Rights Reserved.
#
# This program is copyright property of the author mentioned above.
# You can`t redistribute it and/or modify it.
#
#################################################################################
{
    'name': 'POS Partial Payment with Reorder, Reprint order (Enterprise)',
    'summary': 'POS Reorder, Reprint',
    'version': '1.0',
    'description': """ This module use mainly to do the partial payment for pos orders eg.
   Let say customer comes to the shop and he purchase order total $200,
   but if he want to pay only $100 as half payment and remaining due amounts pay to next day. 
   as well as POS Reorder, Reprint. """,
    'author': 'Acespritech Solutions Pvt. Ltd.',
    'category': 'Point of Sale',
    'website': 'http://www.acespritech.com',
    'depends': ['sale', 'point_of_sale'],
    'price': 35.00,
    'currency': 'EUR',
    'data': [
        'views/aces_pos_partial.xml',
        'views/pos_order_view.xml',
        'data/product.xml'
    ],
    'qweb': [
        'static/src/xml/pos.xml'
    ],
    'images': [
        'static/description/main_screenshot.png',
    ],
    'installable': True,
    'auto_install': False,
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
