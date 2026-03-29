import type { INodeProperties } from 'n8n-workflow';

export const invoiceLineOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['invoiceLine'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an invoice line',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of invoice lines',
				routing: {
					request: { method: 'GET', url: '/invoicelines' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getAll',
	},
];

export const invoiceLineFields: INodeProperties[] = [
	{
		displayName: 'Invoice Line ID',
		name: 'invoiceLineId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['invoiceLine'], operation: ['get'] } },
		default: '',
		routing: { request: { url: '=/invoicelines/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['invoiceLine'], operation: ['getAll'] } },
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
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['invoiceLine'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['invoiceLine'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 0 },
		default: 0,
		description: 'Number of results to skip for offset-based pagination',
		routing: { request: { qs: { offset: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: { show: { resource: ['invoiceLine'], operation: ['getAll'] } },
		default: {},
		options: [
			{
				displayName: 'Invoice (Path)',
				name: 'invoice',
				type: 'string',
				default: '',
				placeholder: '/invoices/42',
				routing: { request: { qs: { invoice: '={{ $value }}' } } },
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
];
