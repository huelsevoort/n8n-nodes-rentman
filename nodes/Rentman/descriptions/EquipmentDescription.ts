import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

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
				name: 'Create',
				value: 'create',
				action: 'Create a piece of equipment',
				description: 'Create a new equipment item',
				routing: {
					request: {
						method: 'POST',
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
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of equipment items',
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
			{
				name: 'Update',
				value: 'update',
				action: 'Update a piece of equipment',
				description: 'Update an existing equipment item',
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

export const equipmentFields: INodeProperties[] = [
	{
		displayName: 'Equipment ID',
		name: 'equipmentId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['equipment'],
				operation: ['get', 'update'],
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
				resource: ['equipment'],
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
	customQueryParamsField('equipment'),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['equipment'],
				operation: ['create', 'update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
				routing: { request: { body: { code: '={{ $value }}' } } },
			},
			{
				displayName: 'Critical Stock Level',
				name: 'critical_stock_level',
				type: 'number',
				default: 0,
				routing: { request: { body: { critical_stock_level: '={{ $value }}' } } },
			},
			{
				displayName: 'External Remark',
				name: 'external_remark',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Note on financial documents',
				routing: { request: { body: { external_remark: '={{ $value }}' } } },
			},
			{
				displayName: 'Factor Group (Path)',
				name: 'factor_group',
				type: 'string',
				default: '',
				placeholder: '/factorgroups/0',
				routing: { request: { body: { factor_group: '={{ $value }}' } } },
			},
			{
				displayName: 'Folder (Path)',
				name: 'folder',
				type: 'string',
				default: '',
				placeholder: '/folders/0',
				routing: { request: { body: { folder: '={{ $value }}' } } },
			},
			{
				displayName: 'Image (Path)',
				name: 'image',
				type: 'string',
				default: '',
				placeholder: '/files/0',
				routing: { request: { body: { image: '={{ $value }}' } } },
			},
			{
				displayName: 'In Planner',
				name: 'in_planner',
				type: 'boolean',
				default: true,
				routing: { request: { body: { in_planner: '={{ $value }}' } } },
			},
			{
				displayName: 'In Shop',
				name: 'in_shop',
				type: 'boolean',
				default: false,
				routing: { request: { body: { in_shop: '={{ $value }}' } } },
			},
			{
				displayName: 'Internal Remark',
				name: 'internal_remark',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Note on packing lists',
				routing: { request: { body: { internal_remark: '={{ $value }}' } } },
			},
			{
				displayName: 'Is Combination',
				name: 'is_combination',
				type: 'boolean',
				default: false,
				routing: { request: { body: { is_combination: '={{ $value }}' } } },
			},
			{
				displayName: 'Is Physical',
				name: 'is_physical',
				type: 'options',
				options: [
					{ name: 'Physical Equipment', value: 'Physical equipment' },
					{ name: 'Virtual Package', value: 'Virtual package' },
				],
				default: 'Physical equipment',
				routing: { request: { body: { is_physical: '={{ $value }}' } } },
			},
			{
				displayName: 'Ledger (Path)',
				name: 'ledger',
				type: 'string',
				default: '',
				placeholder: '/ledgercodes/0',
				routing: { request: { body: { ledger: '={{ $value }}' } } },
			},
			{
				displayName: 'List Price',
				name: 'list_price',
				type: 'number',
				default: 0,
				routing: { request: { body: { list_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{ $value }}' } } },
			},
			{
				displayName: 'Price',
				name: 'price',
				type: 'number',
				default: 0,
				description: 'Default rental price per period',
				routing: { request: { body: { price: '={{ $value }}' } } },
			},
			{
				displayName: 'Rental / Sales',
				name: 'rental_sales',
				type: 'options',
				options: [
					{ name: 'Rental', value: 'Rental' },
					{ name: 'Sale', value: 'Sale' },
				],
				default: 'Rental',
				routing: { request: { body: { rental_sales: '={{ $value }}' } } },
			},
			{
				displayName: 'Stock Management',
				name: 'stock_management',
				type: 'options',
				options: [
					{ name: 'Exclude From Stock Tracking', value: 'Exclude from stock tracking' },
					{ name: 'Track Stock', value: 'Track stock' },
				],
				default: 'Track stock',
				routing: { request: { body: { stock_management: '={{ $value }}' } } },
			},
			{
				displayName: 'Strict Container Content',
				name: 'strict_container_content',
				type: 'options',
				options: [
					{ name: 'Unrestricted', value: 'Unrestricted' },
					{ name: 'Strict', value: 'Strict' },
				],
				default: 'Unrestricted',
				description: 'Whether a combination can contain actual content that is not part of the default content',
				routing: { request: { body: { strict_container_content: '={{ $value }}' } } },
			},
			{
				displayName: 'Tax Class (Path)',
				name: 'taxclass',
				type: 'string',
				default: '',
				placeholder: '/taxclasses/0',
				routing: { request: { body: { taxclass: '={{ $value }}' } } },
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
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Unit',
				name: 'unit',
				type: 'string',
				default: '',
				routing: { request: { body: { unit: '={{ $value }}' } } },
			},
		],
	},
];
