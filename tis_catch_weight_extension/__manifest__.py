# -*- coding: utf-8 -*-

{
    'name': 'Catch Weight Management Extension',
    'version': '12.0.0.1',
    'author': 'Guadaltech Soluciones Tecnológicas S.L',
    'depends': [
        'tis_catch_weight',
        'point_of_sale'
    ],
    'data': [
        'views/view_pos_pos_form.xml',
        'views/assets.xml'
    ],
    'qweb': [
        'static/src/xml/pos.xml',
        'static/src/xml/cw_qty_widget.xml'
    ],
    'installable': True,
    'auto_install': False,
    'application': True
}

