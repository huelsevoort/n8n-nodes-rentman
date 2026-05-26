/**
 * Read-only Purchase Order resource family.
 *
 * Endpoints:
 *   GET /purchaseorders
 *   GET /purchaseorders/{id}
 *   GET /purchaseorders/{id}/files
 *   GET /purchaseorders/{id}/file_folders
 *   GET /purchaseorders/{id}/invoicelines
 *   GET /purchaseorders/{id}/purchaseordercosts
 *   GET /purchaseorders/{id}/purchaseorderglobalcosts
 *   GET /purchaseordercosts        + /purchaseordercosts/{id}
 *   GET /purchaseorderglobalcosts  + /purchaseorderglobalcosts/{id}
 *
 * Tasks attached to a purchase order are handled by the Task resource
 * (operations Get For Parent / Create For Parent with Parent Resource = Purchase Order).
 */
import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];

const standardFilters: INodeProperties['options'] = [
	{
		displayName: 'Created After',
		name: 'created_gt',
		type: 'dateTime',
		default: '',
		description: 'Return only records created after this date',
		routing: { request: { qs: { 'created[gt]': '={{ $value }}' } } },
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
];

// ─── PURCHASE ORDER ──────────────────────────────────────────────────────────

export const purchaseOrderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['purchaseOrder'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a purchase order',
				description: 'Get a single purchase order by ID',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of purchase orders',
				description: 'Get a list of purchase orders',
				routing: { request: { method: 'GET', url: '/purchaseorders' }, output: { postReceive } },
			},
			{
				name: 'Get File Folders',
				value: 'getFileFolders',
				action: 'Get purchase order file folders',
				description: 'Get file folders attached to a purchase order',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Files',
				value: 'getFiles',
				action: 'Get purchase order files',
				description: 'Get files attached to a purchase order',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Global Costs',
				value: 'getGlobalCosts',
				action: 'Get purchase order global costs',
				description: 'Get global costs linked to a purchase order',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Invoice Lines',
				value: 'getInvoiceLines',
				action: 'Get purchase order invoice lines',
				description: 'Get invoice lines linked to a purchase order',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Order Costs',
				value: 'getOrderCosts',
				action: 'Get purchase order costs',
				description: 'Get costs linked to a purchase order',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
		],
		default: 'getAll',
	},
];

const purchaseOrderIdField = (op: string, suffix: string): INodeProperties => ({
	displayName: 'Purchase Order ID',
	name: 'purchaseOrderId',
	type: 'string',
	required: true,
	displayOptions: { show: { resource: ['purchaseOrder'], operation: [op] } },
	default: '',
	description: 'The ID of the purchase order',
	routing: { request: { url: `=/purchaseorders/{{$value}}${suffix}` } },
});

export const purchaseOrderFields: INodeProperties[] = [
	purchaseOrderIdField('get', ''),
	purchaseOrderIdField('getFiles', '/files'),
	purchaseOrderIdField('getFileFolders', '/file_folders'),
	purchaseOrderIdField('getInvoiceLines', '/invoicelines'),
	purchaseOrderIdField('getOrderCosts', '/purchaseordercosts'),
	purchaseOrderIdField('getGlobalCosts', '/purchaseorderglobalcosts'),
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['purchaseOrder'],
				operation: ['getAll', 'getFiles', 'getFileFolders', 'getInvoiceLines', 'getOrderCosts', 'getGlobalCosts'],
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
				resource: ['purchaseOrder'],
				operation: ['getAll', 'getFiles', 'getFileFolders', 'getInvoiceLines', 'getOrderCosts', 'getGlobalCosts'],
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
				resource: ['purchaseOrder'],
				operation: ['getAll', 'getFiles', 'getFileFolders', 'getInvoiceLines', 'getOrderCosts', 'getGlobalCosts'],
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
				resource: ['purchaseOrder'],
				operation: ['getAll', 'getFiles', 'getFileFolders', 'getInvoiceLines', 'getOrderCosts', 'getGlobalCosts'],
			},
		},
		default: {},
		options: [
			...standardFilters,
			{
				displayName: 'Approval Status',
				name: 'approval_status',
				type: 'options',
				default: 'draft',
				options: [
					{ name: 'Approved', value: 'approved' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Completed', value: 'completed' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'Pending Approval', value: 'pending_approval' },
					{ name: 'Rejected', value: 'rejected' },
					{ name: 'Sent', value: 'sent' },
				],
				description: 'Filter purchase orders by approval status',
				routing: { request: { qs: { approval_status: '={{ $value }}' } } },
			},
			{
				displayName: 'Supplier (Path)',
				name: 'supplier',
				type: 'string',
				default: '',
				placeholder: '/contacts/0',
				description: 'Filter by supplier contact path',
				routing: { request: { qs: { supplier: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('purchaseOrder'),
];

// ─── PURCHASE ORDER COST (read-only) ─────────────────────────────────────────

export const purchaseOrderCostOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['purchaseOrderCost'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a purchase order cost',
				description: 'Get a single purchase order cost by ID',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of purchase order costs',
				description: 'Get a list of purchase order costs',
				routing: { request: { method: 'GET', url: '/purchaseordercosts' }, output: { postReceive } },
			},
		],
		default: 'getAll',
	},
];

export const purchaseOrderCostFields: INodeProperties[] = [
	{
		displayName: 'Purchase Order Cost ID',
		name: 'purchaseOrderCostId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['purchaseOrderCost'], operation: ['get'] } },
		default: '',
		description: 'The ID of the purchase order cost',
		routing: { request: { url: '=/purchaseordercosts/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['purchaseOrderCost'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['purchaseOrderCost'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['purchaseOrderCost'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['purchaseOrderCost'], operation: ['getAll'] } },
		default: {},
		options: [
			...standardFilters,
			{
				displayName: 'Purchase Order (Path)',
				name: 'purchase_order',
				type: 'string',
				default: '',
				placeholder: '/purchaseorders/0',
				routing: { request: { qs: { purchase_order: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('purchaseOrderCost'),
];

// ─── PURCHASE ORDER GLOBAL COST (read-only) ──────────────────────────────────

export const purchaseOrderGlobalCostOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['purchaseOrderGlobalCost'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a purchase order global cost',
				description: 'Get a single purchase order global cost by ID',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of purchase order global costs',
				description: 'Get a list of purchase order global costs',
				routing: { request: { method: 'GET', url: '/purchaseorderglobalcosts' }, output: { postReceive } },
			},
		],
		default: 'getAll',
	},
];

export const purchaseOrderGlobalCostFields: INodeProperties[] = [
	{
		displayName: 'Purchase Order Global Cost ID',
		name: 'purchaseOrderGlobalCostId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['purchaseOrderGlobalCost'], operation: ['get'] } },
		default: '',
		description: 'The ID of the purchase order global cost',
		routing: { request: { url: '=/purchaseorderglobalcosts/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['purchaseOrderGlobalCost'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['purchaseOrderGlobalCost'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['purchaseOrderGlobalCost'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['purchaseOrderGlobalCost'], operation: ['getAll'] } },
		default: {},
		options: [
			...standardFilters,
			{
				displayName: 'Purchase Order (Path)',
				name: 'purchase_order',
				type: 'string',
				default: '',
				placeholder: '/purchaseorders/0',
				routing: { request: { qs: { purchase_order: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('purchaseOrderGlobalCost'),
];

// ─── EXTRA INPUT FIELD (read-only) ───────────────────────────────────────────

export const extraInputFieldOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['extraInputField'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an extra input field',
				description: 'Get a single extra input field (custom field configuration) by ID',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of extra input fields',
				description: 'Get many custom field configurations',
				routing: { request: { method: 'GET', url: '/extrainputfields' }, output: { postReceive } },
			},
		],
		default: 'getAll',
	},
];

export const extraInputFieldFields: INodeProperties[] = [
	{
		displayName: 'Extra Input Field ID',
		name: 'extraInputFieldId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['extraInputField'], operation: ['get'] } },
		default: '',
		description: 'The ID of the extra input field',
		routing: { request: { url: '=/extrainputfields/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['extraInputField'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['extraInputField'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['extraInputField'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['extraInputField'], operation: ['getAll'] } },
		default: {},
		options: standardFilters,
	},
	customQueryParamsField('extraInputField'),
];
