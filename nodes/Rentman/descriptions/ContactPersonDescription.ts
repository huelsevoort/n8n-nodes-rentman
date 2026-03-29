import type { INodeProperties } from 'n8n-workflow';

export const contactPersonOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['contactPerson'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a contact person',
				routing: { request: { method: 'DELETE' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a contact person',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many contact persons',
				routing: { request: { method: 'GET', url: '/contactpersons' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact person',
				routing: { request: { method: 'PUT' } },
			},
		],
		default: 'getAll',
	},
];

export const contactPersonFields: INodeProperties[] = [
	{
		displayName: 'Contact Person ID',
		name: 'contactPersonId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['contactPerson'], operation: ['get', 'update', 'delete'] } },
		default: '',
		routing: { request: { url: '=/contactpersons/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['contactPerson'], operation: ['getAll'] } },
		default: false,
		routing: {
			send: { paginate: '={{ $value }}' },
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url }}',
						request: { url: '={{ $response.body?.next_page_url ?? $request.url }}' },
					},
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['contactPerson'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: { show: { resource: ['contactPerson'], operation: ['getAll'] } },
		default: {},
		options: [
			{
				displayName: 'Contact (Path)',
				name: 'contact',
				type: 'string',
				default: '',
				placeholder: '/contacts/42',
				routing: { request: { qs: { contact: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '+id',
				routing: { request: { qs: { sort: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['contactPerson'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { request: { body: { email: '={{ $value }}' } } },
			},
			{
				displayName: 'First Name',
				name: 'firstname',
				type: 'string',
				default: '',
				routing: { request: { body: { firstname: '={{ $value }}' } } },
			},
			{
				displayName: 'Last Name',
				name: 'surname',
				type: 'string',
				default: '',
				routing: { request: { body: { surname: '={{ $value }}' } } },
			},
			{
				displayName: 'Mobile',
				name: 'mobile',
				type: 'string',
				default: '',
				routing: { request: { body: { mobile: '={{ $value }}' } } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				routing: { request: { body: { phone: '={{ $value }}' } } },
			},
			{
				displayName: 'Remark',
				name: 'remark',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				routing: { request: { body: { remark: '={{ $value }}' } } },
			},
		],
	},
];
