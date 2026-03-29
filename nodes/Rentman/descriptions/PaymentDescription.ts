import type { INodeProperties } from 'n8n-workflow';

export const paymentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['payment'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a payment',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many payments',
				routing: { request: { method: 'GET', url: '/payments' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a payment',
				routing: { request: { method: 'PUT' } },
			},
		],
		default: 'getAll',
	},
];

export const paymentFields: INodeProperties[] = [
	{
		displayName: 'Payment ID',
		name: 'paymentId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['payment'], operation: ['get', 'update'] } },
		default: '',
		routing: { request: { url: '=/payments/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['payment'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['payment'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: { show: { resource: ['payment'], operation: ['getAll'] } },
		default: {},
		options: [
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '-created',
				routing: { request: { qs: { sort: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['payment'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				routing: { request: { body: { amount: '={{ $value }}' } } },
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { date: '={{ $value }}' } } },
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
