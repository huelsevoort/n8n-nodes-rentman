import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, rentmanPagination } from './shared';

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
				pagination: rentmanPagination,
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
			description: 'Comma-separated list of fields to return. Custom fields can be requested as custom_N; together with Expand, dot notation limits an expanded record (e.g. equipment.name). Leave empty for all fields.',
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
			in_archive: '={{ $value ? 1 : 0 }}',
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
			in_planner: '={{ $value ? 1 : 0 }}',
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
			{ name: 'Case', value: 'case' },
			{ name: 'Item', value: 'item' },
			{ name: 'Set', value: 'set' },
			],
			default: 'item',
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
				displayName: 'Can Edit Content During Planning',
				name: 'can_edit_content_during_planning',
				type: 'boolean',
				default: false,
				description: 'Whether equipment can be added to or removed from this combination, and its quantities changed, during planning. Rentman stores it through the API only for virtual packages (sets).',
				routing: { request: { body: { can_edit_content_during_planning: '={{ $value }}' } } },
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
				routing: { request: { body: { code: '={{ $value }}' } } },
			},
			{
				displayName: 'Country of Origin',
				name: 'country_of_origin',
				type: 'string',
				placeholder: 'de',
				default: '',
				description: 'Two-letter ISO code (lowercase) of the country where the equipment was manufactured, used e.g. for carnet exports',
				routing: { request: { body: { country_of_origin: '={{ $value }}' } } },
			},
			{
				displayName: 'Critical Stock Level',
				name: 'critical_stock_level',
				type: 'number',
				default: 0,
				routing: { request: { body: { critical_stock_level: '={{ $value }}' } } },
			},
			{
				displayName: 'Current (Ampere)',
				name: 'current',
				type: 'number',
				default: 0,
				routing: { request: { body: { current: '={{ $value }}' } } },
			},
			{
				displayName: 'Custom Fields',
				name: 'custom',
				type: 'json',
				default: '{}',
				description: 'Custom fields as JSON object, e.g. {"custom_1": "text", "custom_2": 5}. The field names are listed under Extra Input Field.',
				routing: { request: { body: { custom: "={{ typeof $value === 'string' ? JSON.parse($value || '{}') : $value }}" } } },
			},
			{
				displayName: 'Default Group',
				name: 'defaultgroup',
				type: 'string',
				default: '',
				description: 'Equipment group the item is placed in automatically when planning',
				routing: { request: { body: { defaultgroup: '={{ $value }}' } } },
			},
			{
				displayName: 'Empty Weight',
				name: 'empty_weight',
				type: 'number',
				default: 0,
				routing: { request: { body: { empty_weight: '={{ $value }}' } } },
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
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				routing: { request: { body: { height: '={{ $value }}' } } },
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
				displayName: 'In Archive',
				name: 'in_archive',
				type: 'boolean',
				default: false,
				routing: { request: { body: { in_archive: '={{ $value }}' } } },
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
				displayName: 'Ledger Debit (Path)',
				name: 'ledger_debit',
				type: 'string',
				default: '',
				placeholder: '/ledgercodes/0',
				description: 'Resource path of a debit ledger code (one with is_debit); Rentman rejects credit ledger codes here',
				routing: { request: { body: { ledger_debit: '={{ $value }}' } } },
			},
			{
				displayName: 'Length',
				name: 'length',
				type: 'number',
				default: 0,
				routing: { request: { body: { length: '={{ $value }}' } } },
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
				displayName: 'Packed Per',
				name: 'packed_per',
				type: 'number',
				default: 0,
				routing: { request: { body: { packed_per: '={{ $value }}' } } },
			},
			{
				displayName: 'Power (Watt)',
				name: 'power',
				type: 'number',
				default: 0,
				routing: { request: { body: { power: '={{ $value }}' } } },
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
				displayName: 'Shop Description Long',
				name: 'shop_description_long',
				type: 'string',
				default: '',
				routing: { request: { body: { shop_description_long: '={{ $value }}' } } },
			},
			{
				displayName: 'Shop Description Short',
				name: 'shop_description_short',
				type: 'string',
				default: '',
				routing: { request: { body: { shop_description_short: '={{ $value }}' } } },
			},
			{
				displayName: 'Shop Featured',
				name: 'shop_featured',
				type: 'boolean',
				default: false,
				routing: { request: { body: { shop_featured: '={{ $value }}' } } },
			},
			{
				displayName: 'Shop SEO Description',
				name: 'shop_seo_description',
				type: 'string',
				default: '',
				routing: { request: { body: { shop_seo_description: '={{ $value }}' } } },
			},
			{
				displayName: 'Shop SEO Keyword',
				name: 'shop_seo_keyword',
				type: 'string',
				default: '',
				routing: { request: { body: { shop_seo_keyword: '={{ $value }}' } } },
			},
			{
				displayName: 'Shop SEO Title',
				name: 'shop_seo_title',
				type: 'string',
				default: '',
				routing: { request: { body: { shop_seo_title: '={{ $value }}' } } },
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
				description: 'Whether a combination can contain actual content that is not part of the default content. Rentman currently ignores this value when it is sent through the API.',
				routing: { request: { body: { strict_container_content: '={{ $value }}' } } },
			},
			{
				displayName: 'Subrental Costs',
				name: 'subrental_costs',
				type: 'number',
				default: 0,
				routing: { request: { body: { subrental_costs: '={{ $value }}' } } },
			},
			{
				displayName: 'Surface Article',
				name: 'surface_article',
				type: 'boolean',
				default: false,
				description: 'Whether the price is calculated per square meter (width x height), with dimensions entered per project',
				routing: { request: { body: { surface_article: '={{ $value }}' } } },
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
				displayName: 'Temporary',
				name: 'temporary',
				type: 'boolean',
				default: false,
				description: 'Whether the equipment is temporary. Rentman then sets its code to TEMP and hides it from every read (Get answers 404) until Temporary is set back to false.',
				routing: { request: { body: { temporary: '={{ $value }}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Case', value: 'case' },
					{ name: 'Item', value: 'item' },
					{ name: 'Set', value: 'set' },
				],
				default: 'item',
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Unit',
				name: 'unit',
				type: 'string',
				default: '',
				routing: { request: { body: { unit: '={{ $value }}' } } },
			},
			{
				displayName: 'Volume',
				name: 'volume',
				type: 'number',
				default: 0,
				routing: { request: { body: { volume: '={{ $value }}' } } },
			},
			{
				displayName: 'Weight',
				name: 'weight',
				type: 'number',
				default: 0,
				routing: { request: { body: { weight: '={{ $value }}' } } },
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				routing: { request: { body: { width: '={{ $value }}' } } },
			},
		],
	},
];
