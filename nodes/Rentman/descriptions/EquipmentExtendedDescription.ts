import type { INodeProperties } from 'n8n-workflow';

const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];

const deletePostReceive = [
	{
		type: 'set' as const,
		properties: { value: '={{ { "deleted": true } }}' },
	},
];

const standardFilterOptions = (extra: INodeProperties['options'] = []): INodeProperties['options'] => [
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
	...(extra ?? []),
];

const customQueryParamsOption = (resourceValue: string): INodeProperties => ({
	displayName: 'Custom Query Parameters',
	name: 'customQueryParams',
	type: 'fixedCollection',
	placeholder: 'Add Parameter',
	displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
	default: {},
	typeOptions: { multipleValues: true },
	description: 'Add custom query parameters for field-value filtering (e.g. country=nl) or relational operators (e.g. modified[gt]=2024-01-01).',
	options: [
		{
			name: 'params',
			displayName: 'Parameter',
			values: [
				{
					displayName: 'Key',
					name: 'key',
					type: 'string',
					default: '',
					placeholder: 'e.g. country or modified[gt]',
					description: 'Query parameter key. Use field[gt] or field[lt] for relational operators.',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
					placeholder: 'e.g. nl or 2024-01-01',
					routing: {
						send: {
							type: 'query',
							property: '={{$parent.key}}',
							value: '={{$value}}',
							propertyInDotNotation: false,
						},
					},
				},
			],
		},
	],
});

/**
 * Helper to build a minimal read-only (Get + Get Collection) resource description.
 * Used for equipment sub-resources that are GET-only.
 */
function buildReadOnly(
	resourceValue: string,
	apiPath: string,
	idLabel: string,
	extraFilters: INodeProperties['options'] = [],
): { operations: INodeProperties[]; fields: INodeProperties[] } {
	const label = idLabel.toLowerCase();

	const operations: INodeProperties[] = [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resourceValue] } },
			options: [
				{
					name: 'Get',
					value: 'get',
					action: `Get a ${label}`,
					description: `Get a single ${label} by ID`,
					routing: { request: { method: 'GET' }, output: { postReceive } },
				},
				{
					name: 'Get Collection',
					value: 'getAll',
					action: `Get collection of ${label}s`,
					description: `Get a list of ${label}s`,
					routing: { request: { method: 'GET', url: `/${apiPath}` }, output: { postReceive } },
				},
			],
			default: 'getAll',
		},
	];

	const fields: INodeProperties[] = [
		{
			displayName: `${idLabel} ID`,
			name: `${resourceValue}Id`,
			type: 'string',
			required: true,
			displayOptions: { show: { resource: [resourceValue], operation: ['get'] } },
			default: '',
			description: `The ID of the ${label}`,
			routing: { request: { url: `=/${apiPath}/{{$value}}` } },
		},
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
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
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
			typeOptions: { minValue: 1 },
			default: 50,
			routing: { request: { qs: { limit: '={{ $value }}' } } },
		},
		{
			displayName: 'Offset',
			name: 'offset',
			type: 'number',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
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
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
			default: {},
			options: standardFilterOptions(extraFilters),
		},
		customQueryParamsOption(resourceValue),
	];

	return { operations, fields };
}

/**
 * Helper to build a CRUD resource description for equipment sub-resources.
 * Supports: Get, Get Collection, Create (POST /equipment/{id}/{subPath}), Update (PUT), Delete (DELETE).
 *
 * @param resourceValue The internal resource value (e.g. 'accessory')
 * @param apiPath The top-level path of the resource (e.g. 'accessories')
 * @param subPath The sub-path under /equipment/{id}/ used for POST (e.g. 'accessories'); often equal to apiPath
 * @param idLabel Display label
 * @param createBodyFields Fields for the Create operation (rendered inline as a collection)
 * @param updateBodyFields Fields for the Update operation (rendered inline as a collection); typically same as createBodyFields
 * @param extraFilters Extra filter options to merge into the standard filter set
 */
function buildCrud(
	resourceValue: string,
	apiPath: string,
	subPath: string,
	idLabel: string,
	createBodyFields: INodeProperties['options'],
	updateBodyFields: INodeProperties['options'],
	extraFilters: INodeProperties['options'] = [],
): { operations: INodeProperties[]; fields: INodeProperties[] } {
	const label = idLabel.toLowerCase();

	const operations: INodeProperties[] = [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resourceValue] } },
			options: [
				{
					name: 'Create',
					value: 'create',
					action: `Create a ${label}`,
					description: `Create a new ${label} for an equipment item`,
					routing: { request: { method: 'POST' }, output: { postReceive } },
				},
				{
					name: 'Delete',
					value: 'delete',
					action: `Delete a ${label}`,
					description: `Delete a ${label} by ID`,
					routing: { request: { method: 'DELETE' }, output: { postReceive: deletePostReceive } },
				},
				{
					name: 'Get',
					value: 'get',
					action: `Get a ${label}`,
					description: `Get a single ${label} by ID`,
					routing: { request: { method: 'GET' }, output: { postReceive } },
				},
				{
					name: 'Get Collection',
					value: 'getAll',
					action: `Get collection of ${label}s`,
					description: `Get a list of ${label}s`,
					routing: { request: { method: 'GET', url: `/${apiPath}` }, output: { postReceive } },
				},
				{
					name: 'Update',
					value: 'update',
					action: `Update a ${label}`,
					description: `Update an existing ${label}`,
					routing: { request: { method: 'PUT' }, output: { postReceive } },
				},
			],
			default: 'getAll',
		},
	];

	const fields: INodeProperties[] = [
		// ID for get/update/delete
		{
			displayName: `${idLabel} ID`,
			name: `${resourceValue}Id`,
			type: 'string',
			required: true,
			displayOptions: { show: { resource: [resourceValue], operation: ['get', 'update', 'delete'] } },
			default: '',
			description: `The ID of the ${label}`,
			routing: { request: { url: `=/${apiPath}/{{$value}}` } },
		},
		// Equipment ID for create (POST /equipment/{id}/{subPath})
		{
			displayName: 'Equipment ID',
			name: 'equipmentId',
			type: 'string',
			required: true,
			displayOptions: { show: { resource: [resourceValue], operation: ['create'] } },
			default: '',
			description: `The ID of the equipment item the ${label} belongs to`,
			routing: { request: { url: `=/equipment/{{$value}}/${subPath}` } },
		},
		// Pagination
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
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
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
			typeOptions: { minValue: 1 },
			default: 50,
			routing: { request: { qs: { limit: '={{ $value }}' } } },
		},
		{
			displayName: 'Offset',
			name: 'offset',
			type: 'number',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
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
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
			default: {},
			options: standardFilterOptions(extraFilters),
		},
		customQueryParamsOption(resourceValue),
		// Create body fields
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			displayOptions: { show: { resource: [resourceValue], operation: ['create'] } },
			default: {},
			options: createBodyFields,
		},
		// Update body fields
		{
			displayName: 'Update Fields',
			name: 'updateFields',
			type: 'collection',
			placeholder: 'Add Field',
			displayOptions: { show: { resource: [resourceValue], operation: ['update'] } },
			default: {},
			options: updateBodyFields,
		},
	];

	return { operations, fields };
}

// ─── ACCESSORY (CRUD) ────────────────────────────────────────────────────────
const accessoryBodyFields: INodeProperties['options'] = [
	{
		displayName: 'Add as New Line',
		name: 'add_as_new_line',
		type: 'boolean',
		default: false,
		description: 'Whether to always add the accessory as a new line in the project (instead of merging with the same accessory)',
		routing: { request: { body: { add_as_new_line: '={{ $value }}' } } },
	},
	{
		displayName: 'Automatic',
		name: 'automatic',
		type: 'boolean',
		default: false,
		description: 'Whether to automatically add the accessory as soon as the equipment is added to the project',
		routing: { request: { body: { automatic: '={{ $value }}' } } },
	},
	{
		displayName: 'Equipment (Path)',
		name: 'equipment',
		type: 'string',
		default: '',
		placeholder: '/equipment/0',
		description: 'Resource path of the equipment that is represented by this accessory',
		routing: { request: { body: { equipment: '={{ $value }}' } } },
	},
	{
		displayName: 'Is Free',
		name: 'is_free',
		type: 'boolean',
		default: false,
		description: 'Whether to add the accessory to the project with zero as price',
		routing: { request: { body: { is_free: '={{ $value }}' } } },
	},
	{
		displayName: 'Order',
		name: 'order',
		type: 'string',
		default: '',
		routing: { request: { body: { order: '={{ $value }}' } } },
	},
	{
		displayName: 'Quantity',
		name: 'quantity',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 0 },
		routing: { request: { body: { quantity: '={{ $value }}' } } },
	},
	{
		displayName: 'Skip',
		name: 'skip',
		type: 'boolean',
		default: false,
		description: 'Whether to skip adding this accessory if it is already present in the project',
		routing: { request: { body: { skip: '={{ $value }}' } } },
	},
];
const accessories = buildCrud(
	'accessory',
	'accessories',
	'accessories',
	'Accessory',
	accessoryBodyFields,
	accessoryBodyFields,
);

// ─── EQUIPMENT SETS CONTENT (CRUD) ───────────────────────────────────────────
const equipmentSetsContentBodyFields: INodeProperties['options'] = [
	{
		displayName: 'Equipment (Path)',
		name: 'equipment',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/equipment/0',
		description: 'Resource path of the equipment item that is part of this set',
		routing: { request: { body: { equipment: '={{ $value }}' } } },
	},
	{
		displayName: 'Is Fixed',
		name: 'is_fixed',
		type: 'options',
		options: [
			{ name: 'Available Outside This Combination', value: 'Available outside this combination' },
			{ name: 'Reserved From Stock', value: 'Reserved from stock' },
		],
		default: 'Available outside this combination',
		description: 'Whether to permanently reduce the stock by the amount from this combination',
		routing: { request: { body: { is_fixed: '={{ $value }}' } } },
	},
	{
		displayName: 'Is Physically Connected',
		name: 'is_physically_connected',
		type: 'options',
		options: [
			{ name: 'Will Be Removed When Emptying Combinations', value: 'Will be removed when emptying combinations' },
			{ name: 'Will Remain in the Combination When Emptying Combinations', value: 'Will remain in the combination when emptying combinations' },
		],
		default: 'Will be removed when emptying combinations',
		description: 'Whether the equipment will stay inside the combination when emptying it in the warehouse',
		routing: { request: { body: { is_physically_connected: '={{ $value }}' } } },
	},
	{
		displayName: 'Order',
		name: 'order',
		type: 'string',
		default: '',
		routing: { request: { body: { order: '={{ $value }}' } } },
	},
	{
		displayName: 'Quantity',
		name: 'quantity',
		type: 'string',
		default: '1',
		description: 'Quantity in this combination',
		routing: { request: { body: { quantity: '={{ $value }}' } } },
	},
];
const equipmentSetsContent = buildCrud(
	'equipmentSetsContent',
	'equipmentsetscontent',
	'equipmentsetscontent',
	'Equipment Sets Content',
	equipmentSetsContentBodyFields,
	equipmentSetsContentBodyFields.filter((f) => 'name' in (f as INodeProperties) ? (f as INodeProperties).name !== 'equipment' : true),
);

// ─── SERIAL NUMBER (CRUD) ────────────────────────────────────────────────────
const serialNumberBodyFields: INodeProperties['options'] = [
	{
		displayName: 'Active',
		name: 'active',
		type: 'boolean',
		default: true,
		routing: { request: { body: { active: '={{ $value }}' } } },
	},
	{
		displayName: 'Asset Location (Path)',
		name: 'asset_location',
		type: 'string',
		default: '',
		placeholder: '/stocklocations/0',
		description: 'Resource path of the asset stock location',
		routing: { request: { body: { asset_location: '={{ $value }}' } } },
	},
	{
		displayName: 'Book Value',
		name: 'book_value',
		type: 'number',
		default: 0,
		routing: { request: { body: { book_value: '={{ $value }}' } } },
	},
	{
		displayName: 'Depreciation Monthly',
		name: 'depreciation_monthly',
		type: 'number',
		default: 0,
		routing: { request: { body: { depreciation_monthly: '={{ $value }}' } } },
	},
	{
		displayName: 'Image (Path)',
		name: 'image',
		type: 'string',
		default: '',
		placeholder: '/files/0',
		description: 'Resource path of the image file',
		routing: { request: { body: { image: '={{ $value }}' } } },
	},
	{
		displayName: 'Purchase Costs',
		name: 'purchase_costs',
		type: 'number',
		default: 0,
		routing: { request: { body: { purchase_costs: '={{ $value }}' } } },
	},
	{
		displayName: 'Purchase Date',
		name: 'purchasedate',
		type: 'dateTime',
		default: '',
		routing: { request: { body: { purchasedate: '={{ $value }}' } } },
	},
	{
		displayName: 'Reference',
		name: 'ref',
		type: 'string',
		default: '',
		description: 'Internal reference of a specific serial number',
		routing: { request: { body: { ref: '={{ $value }}' } } },
	},
	{
		displayName: 'Remark',
		name: 'remark',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		routing: { request: { body: { remark: '={{ $value }}' } } },
	},
	{
		displayName: 'Residual Value',
		name: 'residual_value',
		type: 'number',
		default: 0,
		routing: { request: { body: { residual_value: '={{ $value }}' } } },
	},
	{
		displayName: 'Serial',
		name: 'serial',
		type: 'string',
		default: '',
		description: 'The manufacturer serial number of the equipment',
		routing: { request: { body: { serial: '={{ $value }}' } } },
	},
];
const serialNumbers = buildCrud(
	'serialNumber',
	'serialnumbers',
	'serialnumbers',
	'Serial Number',
	serialNumberBodyFields,
	serialNumberBodyFields,
);

// ─── READ-ONLY EQUIPMENT SUB-RESOURCES ───────────────────────────────────────
const actualContent = buildReadOnly('actualContent', 'actualcontent', 'Actual Content');
const equipmentAssignedSerials = buildReadOnly('equipmentAssignedSerial', 'equipmentassignedserials', 'Equipment Assigned Serial');
const repairs = buildReadOnly('repair', 'repairs', 'Repair', [
	{
		displayName: 'Repair Status',
		name: 'repair_status',
		type: 'options',
		default: 'in-progress',
		options: [
			{ name: 'In Progress', value: 'in-progress' },
			{ name: 'Completed', value: 'completed' },
			{ name: 'Unrepairable', value: 'unrepairable' },
		],
		description: 'Filter by repair status',
		routing: { request: { qs: { repair_status: '={{ $value }}' } } },
	},
]);

export const accessoryOperations = accessories.operations;
export const accessoryFields = accessories.fields;

export const actualContentOperations = actualContent.operations;
export const actualContentFields = actualContent.fields;

export const equipmentAssignedSerialOperations = equipmentAssignedSerials.operations;
export const equipmentAssignedSerialFields = equipmentAssignedSerials.fields;

export const equipmentSetsContentOperations = equipmentSetsContent.operations;
export const equipmentSetsContentFields = equipmentSetsContent.fields;

export const repairOperations = repairs.operations;
export const repairFields = repairs.fields;

export const serialNumberOperations = serialNumbers.operations;
export const serialNumberFields = serialNumbers.fields;
