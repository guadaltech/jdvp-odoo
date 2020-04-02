# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging
from datetime import timedelta
from functools import partial

import psycopg2
import pytz

from odoo import api, fields, models, tools, _
from odoo.tools import float_is_zero
from odoo.exceptions import UserError
from odoo.http import request
from odoo.addons import decimal_precision as dp

_logger = logging.getLogger(__name__)


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    partner_id = fields.Many2one(
        comodel_name='res.partner',
        string='Partner',
        related='order_id.partner_id'
    )
    date_order = fields.Datetime(
        string='Order Date',
        related='order_id.date_order'
    )
    uom_id = fields.Many2one(
        comodel_name='uom.uom',
        string="Product Uom",
        related='product_id.uom_id'
    )
