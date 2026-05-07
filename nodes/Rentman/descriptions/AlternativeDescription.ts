import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

export const alternativeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['alternative'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an alternative',
				description: 'Create an equipment alternative (alternative for an equipment item)',
				routing: {
					request: { method: 'POST' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an alternative',
				description: 'Delete an alternative by ID',
				routing: {
					request: { method: 'DELETE' },
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
				action: 'Get an alternative',
				description: 'Get a single alternative by ID',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of alternatives',
				description: 'Get a list of alternatives',
				routing: {
					request: { method: 'GET', url: '/alternatives' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get For Equipment',
				value: 'getForEquipment',
				action: 'Get alternatives for an equipment item',
				description: 'Get all alternatives linked to a specific equipment item',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an alternative',
				description: 'Update an existing alternative',
				routing: {
					request: { method: 'PUT' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getAll',
	},
];

export const alternativeFields: INodeProperties[] = [
	// ── Path: alternative ID for get/update/delete ───────────────────────────
	{
		displayName: 'Alternative ID',
		name: 'alternativeId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['alternative'], operation: ['get', 'update', 'delete'] } },
		default: '',
		description: 'The ID of the alternative',
		routing: { request: { url: '=/alternatives/{{$value}}' } },
	},
	// ── Path: equipment ID for create/getForEquipment ────────────────────────
	{
		displayName: 'Equipment ID',
		name: 'equipmentId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['alternative'], operation: ['create', 'getForEquipment'] } },
		default: '',
		description: 'The ID of the equipment item the alternative belongs to',
		routing: { request: { url: '=/equipment/{{$value}}/alternatives' } },
	},
	// ── Body: alternative path for create/update ─────────────────────────────
	{
		displayName: 'Alternative Equipment (Path)',
		name: 'alternative',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['alternative'], operation: ['create', 'update'] } },
		default: '',
		placeholder: '/equipment/42',
		description: 'Resource path of the equipment item that should serve as the alternative',
		routing: { request: { body: { alternative: '={{ $value }}' } } },
	},
	// ── Pagination & filters for getAll/getForEquipment ──────────────────────
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['alternative'], operation: ['getAll', 'getForEquipment'] } },
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
		displayOptions: { show: { resource: ['alternative'], operation: ['getAll', 'getForEquipment'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['alternative'], operation: ['getAll', 'getForEquipment'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['alternative'], operation: ['getAll', 'getForEquipment'] } },
		default: {},
		options: [
			{
				displayName: 'Created After',
				name: 'created_gt',
				type: 'dateTime',
				default: '',
				description: 'Return only records created after this date',
				routing: { request: { qs: { 'created[gt]': '={{ $value }}' } } },
			},
			{
				displayName: 'Equipment (Path)',
				name: 'equipment',
				type: 'string',
				default: '',
				placeholder: '/equipment/42',
				description: 'Filter by equipment resource path',
				routing: { request: { qs: { equipment: '={{ $value }}' } } },
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: '',
				placeholder: 'ID,displayname,modified',
				description: 'Comma-separated list of fields to return. Leave empty for all fields.',
				routing: { request: { qs: { fields: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'ID Greater Than',
				name: 'id_gt',
				type: 'number',
				default: 0,
				description: 'Return only records with ID greater than this value. Useful for incremental sync.',
				routing: { request: { qs: { 'id[gt]': '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Modified After',
				name: 'modified_gt',
				type: 'dateTime',
				default: '',
				description: 'Return only records modified after this date',
				routing: { request: { qs: { 'modified[gt]': '={{ $value }}' } } },
			},
			{
				displayName: 'Modified Before',
				name: 'modified_lt',
				type: 'dateTime',
				default: '',
				description: 'Return only records modified before this date',
				routing: { request: { qs: { 'modified[lt]': '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '+id',
				placeholder: '+ID or -modified',
				description: 'Sort field with direction prefix: + for ascending, - for descending',
				routing: { request: { qs: { sort: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('alternative'),
];
