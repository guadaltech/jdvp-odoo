# -*- coding: utf-8 -*-
from odoo import http

# class SpsiExternalLayoutBackground(http.Controller):
#     @http.route('/spsi_external_layout_background/spsi_external_layout_background/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/spsi_external_layout_background/spsi_external_layout_background/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('spsi_external_layout_background.listing', {
#             'root': '/spsi_external_layout_background/spsi_external_layout_background',
#             'objects': http.request.env['spsi_external_layout_background.spsi_external_layout_background'].search([]),
#         })

#     @http.route('/spsi_external_layout_background/spsi_external_layout_background/objects/<model("spsi_external_layout_background.spsi_external_layout_background"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('spsi_external_layout_background.object', {
#             'object': obj
#         })