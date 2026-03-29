import type { INodeProperties } from 'n8n-workflow';

export const equipmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['equipment'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a piece of equipment',
				description: 'Get a single equipment item by ID',
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
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many equipment items',
				description: 'Get a list of equipment',
				routing: {
					request: {
						method: 'GET',
						url: '/equipment',
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

export const equipmentFields: INodeProperties[] = [
	{
		displayName: 'Equipment ID',
		name: 'equipmentId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['equipment'],
				operation: ['get'],
			},
		},
		default: '',
		description: 'The ID of the equipment item',
		routing: {
			request: {
				url: '=/equipment/{{$value}}',
			},
		},
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['equipment'],
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
				resource: ['equipment'],
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
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['equipment'],
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
				resource: ['equipment'],
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
				description: 'Filter by equipment code',
				routing: {
					request: {
						qs: {
							code: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'In Archive',
				name: 'in_archive',
				type: 'boolean',
				default: false,
				description: 'Whether to include archived items',
				routing: {
					request: {
						qs: {
							in_archive: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'In Planner',
				name: 'in_planner',
				type: 'boolean',
				default: true,
				description: 'Whether to filter items visible in the planner',
				routing: {
					request: {
						qs: {
							in_planner: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by equipment name',
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
					'Sort field with direction prefix: + for ascending, - for descending',
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
					{ name: 'Normal', value: 'normal' },
					{ name: 'Set', value: 'set' },
					{ name: 'Consumable', value: 'consumable' },
				],
				default: 'normal',
				description: 'Filter by equipment type',
				routing: {
					request: {
						qs: {
							type: '={{ $value }}',
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
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: '',
				placeholder: 'id,displayname,modified',
				description: 'Comma-separated list of fields to return. Leave empty for all fields.',
				routing: {
					request: {
						qs: {
							fields: '={{ $value || undefined }}',
						},
					},
				},
			},
		],
	},
];
