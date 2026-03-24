# Ticket setup functions - isolated to minimize changes to core install.py
# Import and call from install.py's after_install()
# Uses HD Ticket doctype from Helpdesk app

import frappe


def get_ticket_quick_entry_layouts():
	return {
		"HD Ticket-Quick Entry": {
			"doctype": "HD Ticket",
			"layout": '[{"name": "ticket_section", "columns": [{"name": "column_tkt1", "fields": ["subject", "status"]}, {"name": "column_tkt2", "fields": ["raised_by", "priority"]}, {"name": "column_tkt3", "fields": ["ticket_type", "agent_group"]}]}, {"name": "custom_fields_section", "columns": [{"name": "column_tkt_c1", "fields": ["source", "lob", "category", "sub_category"]}, {"name": "column_tkt_c2", "fields": ["resolution_type", "primary_owner", "pod"]}]}, {"name": "description_section", "columns": [{"name": "column_tkt4", "fields": ["description"]}]}]',
		},
	}


def get_ticket_sidebar_layouts():
	return {
		"HD Ticket-Side Panel": {
			"doctype": "HD Ticket",
			"layout": '[{"label": "Details", "name": "details_section", "opened": true, "columns": [{"name": "column_tkt_s1", "fields": ["subject", "ticket_type", "status", "priority", "agent_group"]}]}, {"label": "Ticket Info", "name": "ticket_info_section", "opened": true, "columns": [{"name": "column_tkt_s3", "fields": ["source", "lob", "category", "sub_category", "resolution_type", "primary_owner", "pod"]}]}, {"label": "Contact", "name": "contact_section", "opened": true, "columns": [{"name": "column_tkt_s2", "fields": ["raised_by", "contact", "customer"]}]}]',
		},
	}


def get_ticket_data_fields_layouts():
	return {
		"HD Ticket-Data Fields": {
			"doctype": "HD Ticket",
			"layout": '[{"label": "Details", "name": "details_section", "opened": true, "columns": [{"name": "column_tkt_d1", "fields": ["subject", "status"]}, {"name": "column_tkt_d2", "fields": ["ticket_type", "priority", "agent_group"]}]}, {"label": "Ticket Info", "name": "ticket_info_section", "opened": true, "columns": [{"name": "column_tkt_d3a", "fields": ["source", "lob", "category", "sub_category"]}, {"name": "column_tkt_d3b", "fields": ["resolution_type", "primary_owner", "pod"]}]}, {"label": "Contact Info", "name": "contact_section", "opened": true, "columns": [{"name": "column_tkt_d3", "fields": ["raised_by", "customer"]}, {"name": "column_tkt_d4", "fields": ["contact"]}]}, {"label": "Description", "name": "description_section", "opened": true, "columns": [{"name": "column_tkt_d5", "fields": ["description"]}]}]',
		},
	}
