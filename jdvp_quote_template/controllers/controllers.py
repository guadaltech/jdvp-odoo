# -*- coding: utf-8 -*-
from odoo import http

# class JdvpInvoiceTemplate(http.Controller):
#     @http.route('/jdvp_invoice_template/jdvp_invoice_template/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/jdvp_invoice_template/jdvp_invoice_template/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('jdvp_invoice_template.listing', {
#             'root': '/jdvp_invoice_template/jdvp_invoice_template',
#             'objects': http.request.env['jdvp_invoice_template.jdvp_invoice_template'].search([]),
#         })

#     @http.route('/jdvp_invoice_template/jdvp_invoice_template/objects/<model("jdvp_invoice_template.jdvp_invoice_template"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('jdvp_invoice_template.object', {
#             'object': obj
#         })