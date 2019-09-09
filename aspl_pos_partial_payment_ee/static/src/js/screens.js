odoo.define('aspl_pos_partial_payment_ee.screens', function (require) {
	var screens = require('point_of_sale.screens');
	var gui = require('point_of_sale.gui');
	var rpc = require('web.rpc');
	var utils = require('web.utils');
	var PopupWidget = require('point_of_sale.popups');
	var models = require('point_of_sale.models');
	
	var core = require('web.core');
	var QWeb = core.qweb;
	var round_pr = utils.round_precision;
	var _t = core._t;
	
	var ShowOrderList = screens.ActionButtonWidget.extend({
	    template : 'ShowOrderList',
	    button_click : function() {
	        self = this;
	        self.gui.show_screen('orderlist');
	    },
	});

	screens.define_action_button({
	    'name' : 'showorderlist',
	    'widget' : ShowOrderList,
	});
	
	var SaveDraftButton = screens.ActionButtonWidget.extend({
	    template : 'SaveDraftButton',
	    button_click : function() {
	        var self = this;
            var selectedOrder = this.pos.get_order();
            selectedOrder.initialize_validation_date();
            var currentOrderLines = selectedOrder.get_orderlines();
            var orderLines = [];
            var client = selectedOrder.get_client();
            _.each(currentOrderLines,function(item) {
                return orderLines.push(item.export_as_JSON());
            });
            if (orderLines.length === 0) {
                return alert ('Please select product !');
            } else {
            	if( this.pos.config.require_customer && !selectedOrder.get_client()){
            		self.gui.show_popup('error',{
                        message: _t('An anonymous order cannot be confirmed'),
                        comment: _t('Please select a client for this order. This can be done by clicking the order tab')
                    });
                    return;
            	}
                var credit = selectedOrder.get_total_with_tax() - selectedOrder.get_total_paid();
        		if (client && credit > client.remaining_credit_limit){
                    self.gui.show_popup('max_limit',{
                        remaining_credit_limit: client.remaining_credit_limit,
                        draft_order: true,
                    });
                    return
        	    }
                this.pos.push_order(selectedOrder);
                self.gui.show_screen('receipt');
            }
	    },
	});

	screens.define_action_button({
	    'name' : 'savedraftbutton',
	    'widget' : SaveDraftButton,
	});
	
	/* Order list screen */
	var OrderListScreenWidget = screens.ScreenWidget.extend({
	    template: 'OrderListScreenWidget',

	    init: function(parent, options){
	    	var self = this;
	        this._super(parent, options);
	        this.reload_btn = function(){
	        	$('.fa-refresh').toggleClass('rotate', 'rotate-reset');
	        	if($('#select_draft_orders').prop('checked')){
            		$('#select_draft_orders').click();
            	}
	        	self.reloading_orders();
	        };
	        if(this.pos.config.iface_vkeyboard && self.chrome.widget.keyboard){
            	self.chrome.widget.keyboard.connect(this.$('.searchbox input'));
            }
	    },
	    events: {
	    	'click .button.back':  'click_back',
	    	'click .button.draft':  'click_draft',
	        'click .button.paid': 'click_paid',
	        'click .button.posted': 'click_posted',
	        'click #print_order': 'click_reprint',
	        'click #edit_order': 'click_edit_or_duplicate_order',
	        'click #re_order_duplicate': 'click_edit_or_duplicate_order',
	        'click #view_lines': 'click_view_lines',
	        'click #pay_due_amt': 'pay_order_due',
	        'keyup .searchbox input': 'search_order',
	    	'click .searchbox .search-clear': 'clear_search',
	    	'click .order-line td:not(.order_operation_button)': 'click_line',
	    },
	    filter:"all",
        date: "all",
        get_orders: function(){
        	return this.pos.get('pos_order_list');
        },
        click_back: function(){
        	this.gui.show_screen('products');
        },
        click_draft: function(event){
        	var self = this;
        	if($(event.currentTarget).hasClass('selected')){
        		$(event.currentTarget).removeClass('selected');
        		self.filter = "all";
    		}else{
        		self.$('.button.paid').removeClass('selected');
        		self.$('.button.posted').removeClass('selected');
    			$(event.currentTarget).addClass('selected');
        		self.filter = "draft";
    		}
    		self.render_list(self.get_orders());
        },
        click_paid: function(event){
        	var self = this;
        	if($(event.currentTarget).hasClass('selected')){
        		$(event.currentTarget).removeClass('selected');
        		self.filter = "all";
    		}else{
        		self.$('.button.draft').removeClass('selected');
        		self.$('.button.posted').removeClass('selected');
        		$(event.currentTarget).addClass('selected');
        		self.filter = "paid";
    		}
        	self.render_list(self.get_orders());
        },
        click_posted: function(event){
        	var self = this;
        	if($(event.currentTarget).hasClass('selected')){
        		$(event.currentTarget).removeClass('selected');
        		self.filter = "all";
    		}else{
    			self.$('.button.paid').removeClass('selected');
    			self.$('.button.draft').removeClass('selected');
    			$(event.currentTarget).addClass('selected');
        		self.filter = "done";
    		}
        	self.render_list(self.get_orders());
        },
        clear_cart: function(){
        	var self = this;
        	var order = this.pos.get_order();
        	var currentOrderLines = order.get_orderlines();
        	if(currentOrderLines && currentOrderLines.length > 0){
        		_.each(currentOrderLines,function(item) {
        			order.remove_orderline(item);
                });
        	} else {
        		return
        	}
        },
        get_journal_from_order: function(statement_ids){
	    	var self = this;
	    	var order = this.pos.get_order();
	    	var params = {
	    		model: 'account.bank.statement.line',
	    		method: 'search_read',
	    		domain: [['id', 'in', statement_ids]],
	    	}
	    	rpc.query(params, {async: false}).then(function(statements){
	    		if(statements.length > 0){
	    			var order_statements = []
	    			_.each(statements, function(statement){
	    				if(statement.amount > 0){
	    					order_statements.push({
	    						amount: statement.amount,
	    						journal: statement.journal_id[1],
	    					})
	    				}
	    			});
	    			order.set_journal(order_statements);
	    		}
	    	});
	    },
	    get_orderlines_from_order: function(line_ids){
	    	var self = this;
	    	var order = this.pos.get_order();
	    	var orderlines = false;
	    	var params = {
	    		model: 'pos.order.line',
	    		method: 'search_read',
	    		domain: [['id', 'in', line_ids]],
	    	}
	    	rpc.query(params, {async: false}).then(function(order_lines){
	    		if(order_lines.length > 0){
	    			orderlines = order_lines;
	    		}
	    	});
	    	return orderlines
	    },
        click_reprint: function(event){
            alert("re print");
        	var self = this;
        	var selectedOrder = this.pos.get_order();
        	var order_id = parseInt($(event.currentTarget).data('id'));
        	
        	self.clear_cart();
        	selectedOrder.set_client(null);
        	var result = self.pos.db.get_order_by_id(order_id);
        	if (result && result.lines.length > 0) {
        		if (result.partner_id && result.partner_id[0]) {
                    var partner = self.pos.db.get_partner_by_id(result.partner_id[0])
                    if(partner){
                    	selectedOrder.set_client(partner);
                    }
                }
        		selectedOrder.set_amount_paid(result.amount_paid);
                selectedOrder.set_amount_return(Math.abs(result.amount_return));
                selectedOrder.set_amount_tax(result.amount_tax);
                selectedOrder.set_amount_total(result.amount_total);
                selectedOrder.set_company_id(result.company_id[1]);
                selectedOrder.set_date_order(result.date_order);
                selectedOrder.set_client(partner);
                selectedOrder.set_pos_reference(result.pos_reference);
                selectedOrder.set_user_name(result.user_id && result.user_id[1]);
                selectedOrder.set_date_order(result.date_order);
                if(result.statement_ids.length > 0){
                	self.get_journal_from_order(result.statement_ids);
                }
                if(result.lines.length > 0){
                	var order_lines = self.get_orderlines_from_order(result.lines);
                	if(order_lines.length > 0){
	                	_.each(order_lines, function(line){
		    				var product = self.pos.db.get_product_by_id(Number(line.product_id[0]));
		    				if(product){
		    					selectedOrder.add_product(product, {
		    						quantity: line.qty,
		    						discount: line.discount,
		    						price: line.price_unit,
		    					})
		    				}
		    			})
		    			var prd = self.pos.db.get_product_by_id(self.pos.config.prod_for_payment[0]);
                   		if(prd && result.amount_due > 0){
                     		var paid_amt = result.amount_total - result.amount_due;
                     		selectedOrder.add_product(prd,{'price':-paid_amt});
                     	}
                	}
                }
                selectedOrder.set_order_id(order_id);
                self.gui.show_screen('receipt');
        	}
        },
        click_view_lines: function(event){
        	var self = this;
        	var order_id = parseInt($(event.currentTarget).data('id'));
            var order = this.pos.get_order();
            var result = self.pos.db.get_order_by_id(order_id);
            if(result.lines.length > 0){
            	var order_lines = self.get_orderlines_from_order(result.lines);
            	if(order_lines){
            		self.gui.show_popup('product_popup', {
            			order_lines: order_lines,
            			order_id: order_id,
            			state: result.state,
            			order_screen_obj: self,
            		});
            	}
            }
        },
        click_edit_or_duplicate_order: function(event){
        	var self = this;
        	var order_id = parseInt($(event.currentTarget).data('id'));
            var selectedOrder = this.pos.get_order();
            var result = self.pos.db.get_order_by_id(order_id);
            if(result.lines.length > 0){
            	if($(event.currentTarget).data('operation') === "edit"){
	            	if(result.state == "paid"){
	                	alert("Sorry, This order is paid State");
	                	return
	                }
	                if(result.state == "done"){
	                	alert("Sorry, This Order is Done State");
	                	return
	                }
            	}
                self.clear_cart();
            	selectedOrder.set_client(null);
            	if (result.partner_id && result.partner_id[0]) {
                    var partner = self.pos.db.get_partner_by_id(result.partner_id[0])
                    if(partner){
                    	selectedOrder.set_client(partner);
                    }
                }
            	if($(event.currentTarget).data('operation') !== _t("reorder")){
	           	 	selectedOrder.set_pos_reference(result.pos_reference);
	           	 	selectedOrder.set_order_id(order_id);
	           	 	selectedOrder.set_sequence(result.name);
            	}
	           	if(result.lines.length > 0){
	            	var order_lines = self.get_orderlines_from_order(result.lines);
	            	if(order_lines.length > 0){
		               	_.each(order_lines, function(line){
			    			var product = self.pos.db.get_product_by_id(Number(line.product_id[0]));
			    			if(product){
			    				selectedOrder.add_product(product, {
			    					quantity: line.qty,
			    					discount: line.discount,
			    					price: line.price_unit,
			    				})
			    			}
			    		})
	            	}
	            }
	           	self.gui.show_screen('products');
            }
        },
        click_line: function(event){
        	var self = this;
        	var order_id = parseInt($(event.currentTarget).parent().data('id'));
            self.gui.show_screen('orderdetail', {'order_id': order_id});
        },
	    pay_order_due: function(event, order_id){
	        var self = this;
	        var order_id = event ? parseInt($(event.currentTarget).data('id')) : order_id;
	        var selectedOrder = this.pos.get_order();
	        var result = self.pos.db.get_order_by_id(order_id);
	        if(!result){
	        	var params = {
	        		model: 'pos.order', 
	        		method: 'search_read',
	        		domain: [['id', '=', order_id], ['state', 'not in', ['draft']]]
	        	}
	        	rpc.query(params, {async: false}).then(function(order){
	                if(order && order[0])
	                    result = order[0]
	            });
	        }
	        if(result){
	            if(result.state == "paid"){
	                alert("Sorry, This order is paid State");
	                return
	            }
	            if(result.state == "done"){
	                alert("Sorry, This Order is Done State");
	                return
	            }
	            if (result && result.lines.length > 0) {
	            	self.clear_cart();
	            	selectedOrder.set_client(null);
	            	if (result.partner_id && result.partner_id[0]) {
	                    var partner = self.pos.db.get_partner_by_id(result.partner_id[0])
	                    if(partner){
	                    	selectedOrder.set_client(partner);
	                    }
	                }
	                selectedOrder.set_pos_reference(result.pos_reference);
	                selectedOrder.set_paying_order(true);
	                selectedOrder.set_order_id(order_id);
	                selectedOrder.set_sequence(result.name);
	                if(result.lines.length > 0){
		            	var order_lines = self.get_orderlines_from_order(result.lines);
		            	if(order_lines.length > 0){
			               	_.each(order_lines, function(line){
				    			var product = self.pos.db.get_product_by_id(Number(line.product_id[0]));
				    			if(product){
				    				selectedOrder.add_product(product, {
				    					quantity: line.qty,
				    					discount: line.discount,
				    					price: line.price_unit,
				    				})
				    			}
				    		});
			               	var prd = self.pos.db.get_product_by_id(self.pos.config.prod_for_payment[0]);
	                        if(prd && result.amount_due > 0){
	                            var paid_amt = result.amount_total - result.amount_due;
	                            selectedOrder.add_product(prd,{'price':-paid_amt});
	                        }
	                        self.gui.show_screen('payment');
		            	}
		            }
	            }
	    	}
	    },
	    show: function(){
        	var self = this;
	        this._super();
	        if($('#select_draft_orders').prop('checked')){
        		$('#select_draft_orders').click();
        	}
	        this.reload_orders();
	        $('input#datepicker').datepicker({
           	    dateFormat: 'yy-mm-dd',
                autoclose: true,
                closeText: 'Clear',
                showButtonPanel: true,
                onSelect: function (dateText, inst) {
                	var date = $(this).val();
					if (date){
					    self.date = date;
					    self.render_list(self.get_orders());
					}
				},
				onClose: function(dateText, inst){
                    if( !dateText ){
                        self.date = "all";
                        self.render_list(self.get_orders());
                    }
                }
           }).focus(function(){
                var thisCalendar = $(this);
                $('.ui-datepicker-close').click(function() {
                    thisCalendar.val('');
                    self.date = "all";
                    self.render_list(self.get_orders());
                });
           });
	    },
	    search_order: function(event){
	    	var self = this;
	    	var search_timeout = null;
	    	clearTimeout(search_timeout);
            var query = $(event.currentTarget).val();
            search_timeout = setTimeout(function(){
                self.perform_search(query,event.which === 13);
            },70);
	    },
	    perform_search: function(query, associate_result){
	        var self = this;
            if(query){
                if (associate_result){
                    var domain = ['|', '|',['partner_id', 'ilike', query], ['name', 'ilike', query], ['pos_reference', 'ilike', query]];
                    var params = {
                    	model: 'pos.order',
                    	method: 'search_read',
                    	domain: [domain],
                    }
                    rpc.query(params, {async: false}).then(function(orders){
                    	self.render_list(orders);
                    })
                } else {
                    var orders = this.pos.db.search_order(query);
                    self.render_list(orders);
                }
            }else{
                var orders = self.pos.get('pos_order_list');
                this.render_list(orders);
            }
        },
        clear_search: function(){
            var orders = this.pos.get('pos_order_list');
            this.render_list(orders);
            this.$('.searchbox input')[0].value = '';
            this.$('.searchbox input').focus();
        },
        check_filters: function(orders){
        	var self = this;
        	var filtered_orders = false;
        	if(self.filter !== "" && self.filter !== "all"){
	            filtered_orders = $.grep(orders,function(order){
	            	return order.state === self.filter;
	            });
            }
        	return filtered_orders || orders;
        },
        check_date_filter: function(orders){
        	var self = this;
        	var date_filtered_orders = [];
        	if(self.date !== "" && self.date !== "all"){
            	
            	for (var i=0; i<orders.length;i++){
                    var date_order = $.datepicker.formatDate("yy-mm-dd",new Date(orders[i].date_order));
            		if(self.date === date_order){
            			date_filtered_orders.push(orders[i]);
            		}
            	}
            }
        	return date_filtered_orders;
        },
        render_list: function(orders){
        	var self = this;
        	if(orders){
	            var contents = this.$el[0].querySelector('.order-list-contents');
	            contents.innerHTML = "";
	            var temp = [];
	            orders = self.check_filters(orders);
	            if(self.date !== "" && self.date !== "all"){
	            	orders = self.check_date_filter(orders);
	            }
	            for(var i = 0, len = Math.min(orders.length,1000); i < len; i++){
	                var order    = orders[i];
	                order.amount_total = parseFloat(order.amount_total).toFixed(2); 
	            	var clientline_html = QWeb.render('OrderlistLine',{widget: this, order:order});
	                var clientline = document.createElement('tbody');
	                clientline.innerHTML = clientline_html;
	                clientline = clientline.childNodes[1];
	                contents.appendChild(clientline);
	            }
	            $("table.order-list").simplePagination({
					previousButtonClass: "btn btn-danger",
					nextButtonClass: "btn btn-danger",
					previousButtonText: '<i class="fa fa-angle-left fa-lg"></i>',
					nextButtonText: '<i class="fa fa-angle-right fa-lg"></i>',
					perPage:self.pos.config.record_per_page > 0 ? self.pos.config.record_per_page : 10
				});
        	}
        },
        reload_orders: function(){
        	var self = this;
            var orders = self.pos.get('pos_order_list');
            this.search_list = []
            _.each(self.pos.partners, function(partner){
                self.search_list.push(partner.name);
            });
            _.each(orders, function(order){
                self.search_list.push(order.display_name, order.pos_reference)
            });
            this.render_list(orders);
        },
        reloading_orders: function(){
	    	var self = this;
	    	var params = {
				model: 'pos.order',
				method: 'ac_pos_search_read',
				args: [{'domain': this.pos.domain_as_args}],
			}
			return rpc.query(params, {async: false}).then(function(orders){
                if(orders.length > 0){
                	self.pos.db.add_orders(orders);
                    self.pos.set({'pos_order_list' : orders});
                    self.reload_orders();
                }
            }).fail(function (type, error){
                if(error.code === 200 ){    // Business Logic Error, not a connection problem
                   self.gui.show_popup('error-traceback',{
                        'title': error.data.message,
                        'body':  error.data.debug
                   });
                }
            });
	    },
	    renderElement: function(){
	    	var self = this;
	    	self._super();
	    	self.el.querySelector('.button.reload').addEventListener('click',this.reload_btn);
	    },
	});
	gui.define_screen({name:'orderlist', widget: OrderListScreenWidget});
	
	screens.PaymentScreenWidget.include({
        partial_payment: function() {
            var self = this;
        	var currentOrder = this.pos.get_order();
        	console.log("current order========>",currentOrder);
        	var client = currentOrder.get_client() || false;
            console.log("client========>",client);
            console.log("get_total_paid===>",currentOrder.get_total_paid());
        	if(currentOrder.get_total_with_tax() > currentOrder.get_total_paid()
        			&& currentOrder.get_total_paid() != 0){
        		var credit = currentOrder.get_total_with_tax() - currentOrder.get_total_paid();
        		console.log("credit==========>",client.remaining_credit_limit)
        		if (client && credit > client.remaining_credit_limit && !currentOrder.get_paying_order()){
                    self.gui.show_popup('max_limit',{
                        remaining_credit_limit: client.remaining_credit_limit,
                        payment_obj: self,
                    });
                    return
        	    }
        		this.finalize_validation();
        	}
        },
        renderElement: function() {
            var self = this;
            this._super();
            this.$('#partial_pay').click(function(){
                self.partial_payment();
            });
        },
        order_changes: function(){
            var self = this;
            this._super();
            var order = this.pos.get_order();
            var total = order ? order.get_total_with_tax() : 0;
            if(!order){
            	return
            } else if(order.get_due() == 0 || order.get_due() == total ){
            	self.$('#partial_pay').removeClass('highlight');
            } else {
            	self.$('#partial_pay').addClass('highlight');
            }
        },
        click_back: function(){
	        var self = this;
	        var order = this.pos.get_order();
	        if(order.get_paying_order()){
                this.gui.show_popup('confirm',{
                    title: _t('Discard Sale Order'),
                    body:  _t('Do you want to discard the payment of POS '+ order.get_pos_reference() +' ?'),
                    confirm: function() {
                        order.finalize();
                    },
                });
	        } else {
	            self._super();
	        }
	    },
	    click_invoice: function(){
            var self = this;
	        var order = this.pos.get_order();
	        if(!order.get_paying_order()){
	            this._super();
	        }
	    },
	    click_set_customer: function(){
	        var self = this;
	        var order = this.pos.get_order();
	        if(!order.get_paying_order()){
	            self._super();
	        }
	    },
    });
	
	screens.OrderWidget.include({
		set_value: function(val) {
			var order = this.pos.get_order();
			var line = order.get_selected_orderline();
	    	if (line && line.get_product().id != this.pos.config.prod_for_payment[0]) {
	    		this._super(val)
	    	}
		},
	});

    var OrderDetailScreenWidget = screens.ScreenWidget.extend({
	    template: 'OrderDetailScreenWidget',
        show: function(){
            var self = this;
            self._super();
            var order = self.pos.get_order();
            var params = order.get_screen_data('params');
            var order_id = false;
            if(params){
                order_id = params.order_id;
            }
            if(order_id){
                self.clicked_order = self.pos.db.get_order_by_id(order_id)
                if(!self.clicked_order){
                	var detail_param = {
                		model: 'pos.order',
                		method: 'search_read',
                		domain: [['id', '=', order_id]],
                	}
                    rpc.query(detail_param, {async: false}).then(function(order){
                        if(order && order[0]){
                            self.clicked_order = order[0];
                        }
                    })
                }
            }
            this.renderElement();
            this.$('.back').click(function(){
                self.gui.back();
                if(params.previous){
                    self.pos.get_order().set_screen_data('previous-screen', params.previous);
                    if(params.partner_id){
                        $('.client-list-contents').find('.client-line[data-id="'+ params.partner_id +'"]').click();
                        $('#show_client_history').click();
                    }
                }

            });
            if(self.clicked_order){
                this.$('.pay').click(function(){
                	self.pos.gui.screen_instances.orderlist.pay_order_due(false, order_id)
                });
                var contents = this.$('.order-details-contents');
                contents.append($(QWeb.render('OrderDetails',{widget:this, order:self.clicked_order})));
                var params = {
                	model: 'account.bank.statement.line',
                	method: 'search_read',
                	domain: [['pos_statement_id', '=', order_id]],
                }
                rpc.query(params, {async: false}).then(function(statements){
                    if(statements){
                        self.render_list(statements);
                    }
                });
            }
        },
        render_list: function(statements){
        	if(statements){
	            var contents = this.$el[0].querySelector('.paymentline-list-contents');
	            contents.innerHTML = "";
	            for(var i = 0, len = Math.min(statements.length,1000); i < len; i++){
	                var statement = statements[i];
	                var paymentline_html = QWeb.render('PaymentLines',{widget: this, statement:statement});
	                var paymentline = document.createElement('tbody');
	                paymentline.innerHTML = paymentline_html;
	                paymentline = paymentline.childNodes[1];
	                contents.append(paymentline);
	            }
        	}
        },
	});
	gui.define_screen({name:'orderdetail', widget: OrderDetailScreenWidget});

	screens.ClientListScreenWidget.include({
        show: function(){
            var self = this;
            this._super();
            var $show_customers = $('#show_customers');
            var $show_client_history = $('#show_client_history');
            if (this.pos.get_order().get_client() || this.new_client) {
                $show_client_history.removeClass('oe_hidden');
            }
            $show_customers.off().on('click', function(e){
                $('.client-list').removeClass('oe_hidden');
                $('.customer_history').addClass('oe_hidden')
                $show_customers.addClass('oe_hidden');
                $show_client_history.removeClass('oe_hidden');
            })
        },
        toggle_save_button: function(){
            var self = this;
            this._super();
            var $show_customers = this.$('#show_customers');
            var $show_client_history = this.$('#show_client_history');
            var $customer_history = this.$('#customer_history');
            var client = this.new_client || this.pos.get_order().get_client();
            if (this.editing_client) {
                $show_customers.addClass('oe_hidden');
                $show_client_history.addClass('oe_hidden');
            } else {
                if(client){
                    $show_client_history.removeClass('oe_hidden');
                    $show_client_history.off().on('click', function(e){
                        self.render_client_history(client);
                        $('.client-list').addClass('oe_hidden');
                        $customer_history.removeClass('oe_hidden');
                        $show_client_history.addClass('oe_hidden');
                        $show_customers.removeClass('oe_hidden');
                    });
                } else {
                    $show_client_history.addClass('oe_hidden');
                    $show_client_history.off();
                }
            }
        },
        _get_customer_history: function(partner){
        	var self = this;
        	var domain = self.pos.domain_as_args.slice();
        	domain.push(['partner_id', '=', partner.id])
        	var params = {
        		model: 'pos.order',
        		method: 'search_read', 
        		domain: domain,
        	}
        	rpc.query(params, {async: false})
            .then(function(orders){
                if(orders){
                     var filtered_orders = orders.filter(function(o){return (o.amount_total - o.amount_paid) > 0})
                     partner['history'] = filtered_orders
                }

            })
        },
        render_client_history: function(partner){
            var self = this;
            var contents = this.$el[0].querySelector('#client_history_contents');
            contents.innerHTML = "";
            self._get_customer_history(partner);
            if(partner.history){
                for (var i=0; i < partner.history.length; i++){
                    var history = partner.history[i];
                    var history_line_html = QWeb.render('ClientHistoryLine', {
                        partner: partner,
                        order: history,
                        widget: self,
                    });
                    var history_line = document.createElement('tbody');
                    history_line.innerHTML = history_line_html;
                    history_line = history_line.childNodes[1];
                    history_line.addEventListener('click', function(e){
                        var order_id = $(this).data('id');
                        if(order_id){
                        	var previous = self.pos.get_order().get_screen_data('previous-screen');
                            self.gui.show_screen('orderdetail', {
                                order_id: order_id,
                                previous: previous,
                                partner_id: partner.id
                            });
                        }
                    })
                    contents.appendChild(history_line);
                }
            }
        },
        render_payment_history: function(){
            var self = this;
            var $client_details_box = $('.client-details-box');
            $client_details_box.addClass('oe_hidden');
        }
	});

});