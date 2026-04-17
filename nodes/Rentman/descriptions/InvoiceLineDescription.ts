import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

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
				description: 'Get a single invoice line by ID',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of invoice lines',
				description: 'Get a list of invoice lines. Lines are generated based on tax rates and ledgers and sum up to the invoice total.',
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
			send: { paginate: true },
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url && $parameter["returnAll"] }}',
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
				description: 'Return only records with ID greater than this value. Useful for incremental sync.',
				routing: {
					request: {
						qs: {
							'id[gt]': '={{ $value > 0 ? $value : undefined }}',
						},
					},
				},
			},
			{
				displayName: 'Invoice (Path)',
				name: 'invoice',
				type: 'string',
				default: '',
				placeholder: '/invoices/42',
				routing: { request: { qs: { invoice: '={{ $value }}' } } },
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
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '+id',
				routing: { request: { qs: { sort: '={{ $value }}' } } },
			},
			],
	},
	customQueryParamsField('invoiceLine'),
];
