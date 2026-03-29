import type { INodeProperties } from 'n8n-workflow';

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
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many contacts',
				description: 'Get a list of contacts',
				routing: {
					request: {
						method: 'GET',
						url: '/contacts',
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
				},
			},
		],
		default: 'getAll',
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
				paginate: '={{ $value }}',
			},
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url }}',
						request: {
							url: '={{ $response.body?.next_page_url ?? $request.url }}',
						},
					},
				},
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
			maxValue: 1500,
		},
		default: 100,
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
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Customer', value: 'customer' },
					{ name: 'Supplier', value: 'supplier' },
					{ name: 'Other', value: 'other' },
				],
				default: 'customer',
				routing: {
					request: {
						qs: {
							type: '={{ $value }}',
						},
					},
				},
			},
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
		options: [
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
							visit_country: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: {
					request: {
						body: {
							email: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Fax',
				name: 'fax',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							fax: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'First Name',
				name: 'firstname',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							firstname: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Last Name',
				name: 'surname',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							surname: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Mobile',
				name: 'mobile',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							mobile: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							phone: '={{ $value }}',
						},
					},
				},
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
				displayName: 'Remarks',
				name: 'remark',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				routing: {
					request: {
						body: {
							remark: '={{ $value }}',
						},
					},
				},
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
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Customer', value: 'customer' },
					{ name: 'Supplier', value: 'supplier' },
					{ name: 'Other', value: 'other' },
				],
				default: 'customer',
				routing: {
					request: {
						body: {
							type: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'VAT Code',
				name: 'vat_code',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							vat_code: '={{ $value }}',
						},
					},
				},
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
		],
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
		options: [
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
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: {
					request: {
						body: {
							email: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'First Name',
				name: 'firstname',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							firstname: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Last Name',
				name: 'surname',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							surname: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Mobile',
				name: 'mobile',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							mobile: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
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
				name: 'phone',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							phone: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Remarks',
				name: 'remark',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				routing: {
					request: {
						body: {
							remark: '={{ $value }}',
						},
					},
				},
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
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Customer', value: 'customer' },
					{ name: 'Supplier', value: 'supplier' },
					{ name: 'Other', value: 'other' },
				],
				default: 'customer',
				routing: {
					request: {
						body: {
							type: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'VAT Code',
				name: 'vat_code',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							vat_code: '={{ $value }}',
						},
					},
				},
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
		],
	},
];
