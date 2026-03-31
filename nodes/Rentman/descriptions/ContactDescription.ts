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
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url && $parameter["returnAll"] }}',
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
			description: 'Comma-separated list of fields to return. Leave empty for all fields.',
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
					{ name: 'Company', value: 'company' },
					{ name: 'Private', value: 'private' },
				],
				default: 'company',
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
					{ name: 'Company', value: 'company' },
					{ name: 'Private', value: 'private' },
				],
				default: 'company',
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
