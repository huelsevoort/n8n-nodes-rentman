import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

export const stockMovementOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stockMovement'],
			},
		},
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a stock movement',
				description: 'Delete a stock movement by ID',
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
				action: 'Get a stock movement',
				description: 'Get a single stock movement by ID',
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
				action: 'Get collection of stock movements',
				description: 'Get a list of stock movements',
				routing: {
					request: {
						method: 'GET',
						url: '/stockmovements',
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
				action: 'Update a stock movement',
				description: 'Update an existing stock movement',
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

export const stockMovementFields: INodeProperties[] = [
	{
		displayName: 'Stock Movement ID',
		name: 'stockMovementId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['stockMovement'],
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
		description: 'The ID of the stock movement',
		routing: {
			request: {
				url: '=/stockmovements/{{$value}}',
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['stockMovement'],
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
				resource: ['stockMovement'],
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
				resource: ['stockMovement'],
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
				resource: ['stockMovement'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '-created',
				placeholder: '+created or -modified',
				description:
					'Sort field with direction prefix: + for ascending, - for descending',
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
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['stockMovement'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				default: 0,
				routing: {
					request: {
						body: {
							quantity: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Remark',
				name: 'remark',
				type: 'string',
				typeOptions: {
					rows: 3,
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
		],
	},
	customQueryParamsField('stockMovement'),
];
