import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, rentmanPagination } from './shared';

export const contactOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a contact',
				description: 'Create a new contact',
				routing: {
					request: {
						method: 'POST',
						url: '/contacts',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: { property: 'data' },
							},
						],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a contact',
				description: 'Delete a contact by ID',
				routing: {
					request: {
						method: 'DELETE',
					},
					output: {
						postReceive: [
							{
								type: 'set',
								properties: {
									value: '={{ { "deleted": true } }}',
								},
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a contact',
				description: 'Get a single contact by ID',
				routing: {
					request: {
						method: 'GET',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: { property: 'data' },
							},
						],
					},
				},
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of contacts',
				description: 'Get a list of contacts',
				routing: {
					request: {
						method: 'GET',
						url: '/contacts',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: { property: 'data' },
							},
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description: 'Update an existing contact',
				routing: {
					request: {
						method: 'PUT',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: { property: 'data' },
							},
						],
					},
				},
			},
		],
		default: 'getAll',
	},
];

const contactBodyFields: INodeProperties['options'] = [
	{
		displayName: 'Accounting Code',
		name: 'accounting_code',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					accounting_code: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Admin Contact Person (Path)',
		name: 'admin_contactperson',
		type: 'string',
		default: '',
		placeholder: '/contactpersons/0',
		description: 'This contact person is automatically selected when creating invoices',
		routing: { request: { body: { admin_contactperson: '={{ $value }}' } } },
	},
	{
		displayName: 'Bank Account',
		name: 'bank_account',
		type: 'string',
		default: '',
		routing: { request: { body: { bank_account: '={{ $value }}' } } },
	},
	{
		displayName: 'BIC',
		name: 'bic',
		type: 'string',
		default: '',
		routing: { request: { body: { bic: '={{ $value }}' } } },
	},
	{
		displayName: 'City (Invoice)',
		name: 'invoice_city',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_city: '={{ $value }}' } } },
	},
	{
		displayName: 'City (Mailing)',
		name: 'mailing_city',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					mailing_city: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'City (Visit)',
		name: 'visit_city',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					visit_city: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Code',
		name: 'code',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					code: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Commerce Code',
		name: 'commerce_code',
		type: 'string',
		default: '',
		routing: { request: { body: { commerce_code: '={{ $value }}' } } },
	},
	{
		displayName: 'Contact Warning',
		name: 'contact_warning',
		type: 'string',
		default: '',
		description: 'This warning is shown when this contact is selected as a client in a project',
		routing: { request: { body: { contact_warning: '={{ $value }}' } } },
	},
	{
		displayName: 'Country (Invoice)',
		name: 'invoice_country',
		type: 'string',
		placeholder: 'de',
		description: 'Two-letter ISO country code in lowercase',
		default: '',
		routing: { request: { body: { invoice_country: '={{ $value }}' } } },
	},
	{
		displayName: 'Country (Mailing)',
		name: 'mailing_country',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					mailing_country: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Country (Visit)',
		name: 'visit_country',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					country: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Custom Fields',
		name: 'custom',
		type: 'json',
		default: '{}',
		description: 'Custom fields as JSON object, e.g. {"custom_1": "text", "custom_2": 5}. The field names are listed under Extra Input Field.',
		routing: { request: { body: { custom: "={{ typeof $value === 'string' ? JSON.parse($value || '{}') : $value }}" } } },
	},
	{
		displayName: 'Default Person (Path)',
		name: 'default_person',
		type: 'string',
		default: '',
		placeholder: '/contactpersons/0',
		description: 'This contact person is automatically selected if you choose this contact in a project or subrental',
		routing: { request: { body: { default_person: '={{ $value }}' } } },
	},
	{
		displayName: 'Discount Crew',
		name: 'discount_crew',
		type: 'number',
		default: 0,
		description: 'Discount applied to the \'crew\' category upon selecting this contact as a client in a project',
		routing: { request: { body: { discount_crew: '={{ $value }}' } } },
	},
	{
		displayName: 'Discount Rental',
		name: 'discount_rental',
		type: 'number',
		default: 0,
		description: 'Discount applied to the \'rental\' category upon selecting this contact as a client in a project',
		routing: { request: { body: { discount_rental: '={{ $value }}' } } },
	},
	{
		displayName: 'Discount Sale',
		name: 'discount_sale',
		type: 'number',
		default: 0,
		description: 'Discount applied to the \'sales\' category upon selecting this contact as a client in a project',
		routing: { request: { body: { discount_sale: '={{ $value }}' } } },
	},
	{
		displayName: 'Discount Subrent',
		name: 'discount_subrent',
		type: 'number',
		default: 0,
		description: 'Discount applied to rental equipment upon selecting this contact as a supplier in a subrental',
		routing: { request: { body: { discount_subrent: '={{ $value }}' } } },
	},
	{
		displayName: 'Discount Total',
		name: 'discount_total',
		type: 'number',
		default: 0,
		description: 'Discount applied to the total (sub)project upon selecting this contact as a client in a project',
		routing: { request: { body: { discount_total: '={{ $value }}' } } },
	},
	{
		displayName: 'Discount Transport',
		name: 'discount_transport',
		type: 'number',
		default: 0,
		description: 'Discount applied to the \'transport\' category upon selecting this contact as a client in a project',
		routing: { request: { body: { discount_transport: '={{ $value }}' } } },
	},
	{
		displayName: 'Distance',
		name: 'distance',
		type: 'number',
		default: 0,
		description: 'Distance from warehouse to visiting address',
		routing: { request: { body: { distance: '={{ $value }}' } } },
	},
	{
		displayName: 'District (Invoice)',
		name: 'invoice_district',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_district: '={{ $value }}' } } },
	},
	{
		displayName: 'District (Mailing)',
		name: 'mailing_district',
		type: 'string',
		default: '',
		routing: { request: { body: { mailing_district: '={{ $value }}' } } },
	},
	{
		displayName: 'District (Visit)',
		name: 'visit_district',
		type: 'string',
		default: '',
		routing: { request: { body: { visit_district: '={{ $value }}' } } },
	},
	{
		displayName: 'Email',
		name: 'email_1',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		routing: {
			request: {
				body: {
					email_1: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Email 2',
		name: 'email_2',
		type: 'string',
		default: '',
		routing: { request: { body: { email_2: '={{ $value }}' } } },
	},
	{
		displayName: 'Extra Address Line (Invoice)',
		name: 'invoice_extra_address_line',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_extra_address_line: '={{ $value }}' } } },
	},
	{
		displayName: 'Extra Address Line (Mailing)',
		name: 'mailing_extra_address_line',
		type: 'string',
		default: '',
		routing: { request: { body: { mailing_extra_address_line: '={{ $value }}' } } },
	},
	{
		displayName: 'Extra Address Line (Visit)',
		name: 'visit_extra_address_line',
		type: 'string',
		default: '',
		routing: { request: { body: { visit_extra_address_line: '={{ $value }}' } } },
	},
	{
		displayName: 'Extra Name Line',
		name: 'ext_name_line',
		type: 'string',
		default: '',
		routing: { request: { body: { ext_name_line: '={{ $value }}' } } },
	},
	{
		displayName: 'First Name',
		name: 'firstname',
		type: 'string',
		default: '',
		description: 'Only for private contacts. Rentman clears it when Type is Company.',
		routing: {
			request: {
				body: {
					firstname: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Fiscal Code',
		name: 'fiscal_code',
		type: 'string',
		default: '',
		description: 'This number is used in file exports of invoices',
		routing: { request: { body: { fiscal_code: '={{ $value }}' } } },
	},
	{
		displayName: 'Folder (Path)',
		name: 'folder',
		type: 'string',
		default: '',
		placeholder: '/folders/0',
		routing: { request: { body: { folder: '={{ $value }}' } } },
	},
	{
		displayName: 'Gender',
		name: 'gender',
		type: 'string',
		default: '',
		routing: { request: { body: { gender: '={{ $value }}' } } },
	},
	{
		displayName: 'House Number (Invoice)',
		name: 'invoice_number',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_number: '={{ $value }}' } } },
	},
	{
		displayName: 'House Number (Mailing)',
		name: 'mailing_number',
		type: 'string',
		default: '',
		routing: { request: { body: { mailing_number: '={{ $value }}' } } },
	},
	{
		displayName: 'House Number (Visit)',
		name: 'visit_number',
		type: 'string',
		default: '',
		routing: { request: { body: { visit_number: '={{ $value }}' } } },
	},
	{
		displayName: 'Image (Path)',
		name: 'image',
		type: 'string',
		default: '',
		placeholder: '/files/0',
		routing: { request: { body: { image: '={{ $value }}' } } },
	},
	{
		displayName: 'Last Name',
		name: 'surname',
		type: 'string',
		default: '',
		description: 'Only for private contacts. Rentman clears it when Type is Company.',
		routing: {
			request: {
				body: {
					surname: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		default: 0,
		routing: { request: { body: { latitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		default: 0,
		routing: { request: { body: { longitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Company name. Rentman clears it when Type is Private.',
		routing: {
			request: {
				body: {
					name: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Phone',
		name: 'phone_1',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					phone_1: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Phone 2',
		name: 'phone_2',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					phone_2: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Postal Code (Invoice)',
		name: 'invoice_postalcode',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_postalcode: '={{ $value }}' } } },
	},
	{
		displayName: 'Postal Code (Mailing)',
		name: 'mailing_postalcode',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					mailing_postalcode: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Postal Code (Visit)',
		name: 'visit_postalcode',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					visit_postalcode: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Project Note',
		name: 'projectnote',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		routing: {
			request: {
				body: {
					projectnote: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Project Note Title',
		name: 'projectnote_title',
		type: 'string',
		default: '',
		description: 'This remark is automatically added to projects upon selecting this contact as client or location',
		routing: { request: { body: { projectnote_title: '={{ $value }}' } } },
	},
	{
		displayName: 'Purchase Number',
		name: 'purchase_number',
		type: 'string',
		default: '',
		routing: { request: { body: { purchase_number: '={{ $value }}' } } },
	},
	{
		displayName: 'State (Invoice)',
		name: 'invoice_state',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_state: '={{ $value }}' } } },
	},
	{
		displayName: 'State (Mailing)',
		name: 'mailing_state',
		type: 'string',
		default: '',
		routing: { request: { body: { mailing_state: '={{ $value }}' } } },
	},
	{
		displayName: 'State (Visit)',
		name: 'visit_state',
		type: 'string',
		default: '',
		routing: { request: { body: { visit_state: '={{ $value }}' } } },
	},
	{
		displayName: 'Street (Invoice)',
		name: 'invoice_street',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_street: '={{ $value }}' } } },
	},
	{
		displayName: 'Street (Mailing)',
		name: 'mailing_street',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					mailing_street: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Street (Visit)',
		name: 'visit_street',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					visit_street: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Surname Prefix',
		name: 'surfix',
		type: 'string',
		default: '',
		description: 'Only for private contacts. Rentman clears it when Type is Company.',
		routing: { request: { body: { surfix: '={{ $value }}' } } },
	},
	{
		displayName: 'Travel Time (Minutes)',
		name: 'travel_time',
		type: 'number',
		default: 0,
		description: 'Travel time (in minutes) from warehouse to visiting address',
		routing: { request: { body: { travel_time: '={{ $value }}' } } },
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Company', value: 'company' },
			{ name: 'Private', value: 'private' },
		],
		default: 'company',
		description: 'Company contacts use Name, private contacts use First Name, Surname Prefix and Last Name. Rentman clears the fields of the other type.',
		routing: {
			request: {
				body: {
					type: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Unit Number (Invoice)',
		name: 'invoice_unit_number',
		type: 'string',
		default: '',
		routing: { request: { body: { invoice_unit_number: '={{ $value }}' } } },
	},
	{
		displayName: 'Unit Number (Mailing)',
		name: 'mailing_unit_number',
		type: 'string',
		default: '',
		routing: { request: { body: { mailing_unit_number: '={{ $value }}' } } },
	},
	{
		displayName: 'Unit Number (Visit)',
		name: 'visit_unit_number',
		type: 'string',
		default: '',
		routing: { request: { body: { visit_unit_number: '={{ $value }}' } } },
	},
	{
		displayName: 'VAT Code',
		name: 'VAT_code',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					VAT_code: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Vendor Accounting Code',
		name: 'vendor_accounting_code',
		type: 'string',
		default: '',
		description: 'External identifier used for integrations with accounting software',
		routing: { request: { body: { vendor_accounting_code: '={{ $value }}' } } },
	},
	{
		displayName: 'Website',
		name: 'website',
		type: 'string',
		default: '',
		routing: {
			request: {
				body: {
					website: '={{ $value }}',
				},
			},
		},
	},
];

export const contactFields: INodeProperties[] = [
	// ─── GET / UPDATE / DELETE ───────────────────────────────────────────────
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
		description: 'The ID of the contact',
		routing: {
			request: {
				url: '=/contacts/{{$value}}',
			},
		},
	},

	// ─── GET ALL ─────────────────────────────────────────────────────────────
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		routing: {
			send: {
				paginate: true,
			},
			operations: {
				pagination: rentmanPagination,
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
		routing: {
			request: {
				qs: {
					limit: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Number of results to skip for offset-based pagination',
		routing: {
			request: {
				qs: {
					offset: '={{ $value > 0 ? $value : undefined }}',
				},
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
			displayName: 'Code',
			name: 'code',
			type: 'string',
			default: '',
			description: 'Filter by contact code',
			routing: {
			request: {
			qs: {
			code: '={{ $value }}',
			},
			},
			},
			},
			{
			displayName: 'Created After',
			name: 'created_gt',
			type: 'dateTime',
			default: '',
			description: 'Return only records created after this date',
			routing: {
			request: {
			qs: {
			'created[gt]': '={{ $value }}',
			},
			},
			},
			},
			{
			displayName: 'Fields',
			name: 'fields',
			type: 'string',
			default: '',
			placeholder: 'ID,displayname,modified',
			description: 'Comma-separated list of fields to return. Custom fields can be requested as custom_N. Leave empty for all fields.',
			routing: {
			request: {
			qs: {
			fields: '={{ $value || undefined }}',
			},
			},
			},
			},
			{
			displayName: 'ID Greater Than',
			name: 'id_gt',
			type: 'number',
			default: 0,
			description: 'Return only records with ID greater than this value (useful for incremental sync)',
			routing: {
			request: {
			qs: {
			'id[gt]': '={{ $value > 0 ? $value : undefined }}',
			},
			},
			},
			},
			{
			displayName: 'Modified After',
			name: 'modified_gt',
			type: 'dateTime',
			default: '',
			description: 'Return only records modified after this date',
			routing: {
			request: {
			qs: {
			'modified[gt]': '={{ $value }}',
			},
			},
			},
			},
			{
			displayName: 'Modified Before',
			name: 'modified_lt',
			type: 'dateTime',
			default: '',
			description: 'Return only records modified before this date',
			routing: {
			request: {
			qs: {
			'modified[lt]': '={{ $value }}',
			},
			},
			},
			},
			{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			default: '',
			description: 'Filter by contact name',
			routing: {
			request: {
			qs: {
			name: '={{ $value }}',
			},
			},
			},
			},
			{
			displayName: 'Sort',
			name: 'sort',
			type: 'string',
			default: '+id',
			placeholder: '+name or -modified',
			description:
			'Sort field with direction prefix: + for ascending, - for descending. E.g. +name,-modified',
			routing: {
			request: {
			qs: {
			sort: '={{ $value }}',
			},
			},
			},
			},
			{
			displayName: 'Type',
			name: 'type',
			type: 'options',
			options: [
			{ name: 'Company', value: 'company' },
			{ name: 'Private', value: 'private' },
			{ name: 'Other', value: 'other' },
			],
			default: 'company',
			routing: {
			request: {
			qs: {
			type: '={{ $value }}',
			},
			},
			},
			},
		],
	},

	// ─── CREATE ───────────────────────────────────────────────────────────────
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Full name of the contact (company or person)',
		routing: {
			request: {
				body: {
					name: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['create'],
			},
		},
		default: {},
		options: contactBodyFields.filter((field) => field.name !== 'name'),
	},

	// ─── UPDATE ───────────────────────────────────────────────────────────────
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['update'],
			},
		},
		default: {},
		options: contactBodyFields,
	},
	customQueryParamsField('contact'),
];
