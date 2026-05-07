import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

export const supplierOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['supplier'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a supplier',
				description: 'Create a supplier relationship between a contact and an equipment item',
				routing: {
					request: { method: 'POST' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a supplier',
				description: 'Delete a supplier by ID',
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
				action: 'Get a supplier',
				description: 'Get a single supplier by ID',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of suppliers',
				description: 'Get a list of suppliers',
				routing: {
					request: { method: 'GET', url: '/suppliers' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get File Folders',
				value: 'getFileFolders',
				action: 'Get supplier file folders',
				description: 'Get the file folders attached to a supplier',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Files',
				value: 'getFiles',
				action: 'Get supplier files',
				description: 'Get the files attached to a supplier',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get For Equipment',
				value: 'getForEquipment',
				action: 'Get suppliers for an equipment item',
				description: 'Get all supplier links for a specific equipment item',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a supplier',
				description: 'Update an existing supplier',
				routing: {
					request: { method: 'PUT' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getAll',
	},
];

export const supplierFields: INodeProperties[] = [
	// ── Path: supplier ID for get/update/delete/getFiles/getFileFolders ──────
	{
		displayName: 'Supplier ID',
		name: 'supplierId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['supplier'], operation: ['get', 'update', 'delete'] } },
		default: '',
		description: 'The ID of the supplier',
		routing: { request: { url: '=/suppliers/{{$value}}' } },
	},
	{
		displayName: 'Supplier ID',
		name: 'supplierId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['supplier'], operation: ['getFiles'] } },
		default: '',
		description: 'The ID of the supplier',
		routing: { request: { url: '=/suppliers/{{$value}}/files' } },
	},
	{
		displayName: 'Supplier ID',
		name: 'supplierId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['supplier'], operation: ['getFileFolders'] } },
		default: '',
		description: 'The ID of the supplier',
		routing: { request: { url: '=/suppliers/{{$value}}/file_folders' } },
	},
	// ── Path: equipment ID for create/getForEquipment ────────────────────────
	{
		displayName: 'Equipment ID',
		name: 'equipmentId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['supplier'], operation: ['create', 'getForEquipment'] } },
		default: '',
		description: 'The ID of the equipment item the supplier link belongs to',
		routing: { request: { url: '=/equipment/{{$value}}/suppliers' } },
	},
	// ── Body: required contact for create ────────────────────────────────────
	{
		displayName: 'Contact (Path)',
		name: 'contact',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['supplier'], operation: ['create'] } },
		default: '',
		placeholder: '/contacts/42',
		description: 'Resource path of the supplier contact',
		routing: { request: { body: { contact: '={{ $value }}' } } },
	},
	// ── Body: optional fields for create ─────────────────────────────────────
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['supplier'], operation: ['create'] } },
		default: {},
		options: [
			{
				displayName: 'Contact Person (Path)',
				name: 'contactperson',
				type: 'string',
				default: '',
				placeholder: '/contactpersons/42',
				description: 'Resource path of the contact person at the supplier',
				routing: { request: { body: { contactperson: '={{ $value }}' } } },
			},
			{
				displayName: 'Details',
				name: 'details',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Additional details about the supplier relationship',
				routing: { request: { body: { details: '={{ $value }}' } } },
			},
			{
				displayName: 'Price',
				name: 'price',
				type: 'number',
				default: 0,
				description: 'Purchase price for the equipment from this supplier',
				routing: { request: { body: { price: '={{ $value }}' } } },
			},
		],
	},
	// ── Body: update fields ──────────────────────────────────────────────────
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['supplier'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Contact (Path)',
				name: 'contact',
				type: 'string',
				default: '',
				placeholder: '/contacts/42',
				description: 'Resource path of the supplier contact',
				routing: { request: { body: { contact: '={{ $value }}' } } },
			},
			{
				displayName: 'Contact Person (Path)',
				name: 'contactperson',
				type: 'string',
				default: '',
				placeholder: '/contactpersons/42',
				description: 'Resource path of the contact person at the supplier',
				routing: { request: { body: { contactperson: '={{ $value }}' } } },
			},
			{
				displayName: 'Details',
				name: 'details',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Additional details about the supplier relationship',
				routing: { request: { body: { details: '={{ $value }}' } } },
			},
			{
				displayName: 'Price',
				name: 'price',
				type: 'number',
				default: 0,
				description: 'Purchase price for the equipment from this supplier',
				routing: { request: { body: { price: '={{ $value }}' } } },
			},
		],
	},
	// ── Pagination & filters ─────────────────────────────────────────────────
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['supplier'],
				operation: ['getAll', 'getForEquipment', 'getFiles', 'getFileFolders'],
			},
		},
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
		displayOptions: {
			show: {
				resource: ['supplier'],
				operation: ['getAll', 'getForEquipment', 'getFiles', 'getFileFolders'],
				returnAll: [false],
			},
		},
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['supplier'],
				operation: ['getAll', 'getForEquipment', 'getFiles', 'getFileFolders'],
				returnAll: [false],
			},
		},
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
		displayOptions: {
			show: {
				resource: ['supplier'],
				operation: ['getAll', 'getForEquipment', 'getFiles', 'getFileFolders'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Contact (Path)',
				name: 'contact',
				type: 'string',
				default: '',
				placeholder: '/contacts/42',
				description: 'Filter by contact resource path',
				routing: { request: { qs: { contact: '={{ $value }}' } } },
			},
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
	customQueryParamsField('supplier'),
];
