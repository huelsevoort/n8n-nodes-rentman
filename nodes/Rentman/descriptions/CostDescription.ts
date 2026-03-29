import type { INodeProperties } from 'n8n-workflow';

export const costOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['cost'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a cost',
				routing: { request: { method: 'DELETE' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a cost',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many costs',
				routing: { request: { method: 'GET', url: '/costs' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a cost',
				routing: { request: { method: 'PUT' } },
			},
		],
		default: 'getAll',
	},
];

export const costFields: INodeProperties[] = [
	{
		displayName: 'Cost ID',
		name: 'costId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['cost'], operation: ['get', 'update', 'delete'] } },
		default: '',
		routing: { request: { url: '=/costs/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['cost'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['cost'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: { show: { resource: ['cost'], operation: ['getAll'] } },
		default: {},
		options: [
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
		displayOptions: { show: { resource: ['cost'], operation: ['update'] } },
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{ $value }}' } } },
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
