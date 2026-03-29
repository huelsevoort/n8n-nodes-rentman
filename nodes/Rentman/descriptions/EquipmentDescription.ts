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
		],
	},
];
