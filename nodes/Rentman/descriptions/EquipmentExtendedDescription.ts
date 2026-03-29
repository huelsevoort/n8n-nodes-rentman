import type { INodeProperties } from 'n8n-workflow';

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
	const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];
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
					description: `Get a single ${label} by ID.`,
					routing: { request: { method: 'GET' }, output: { postReceive } },
				},
				{
					name: 'Get Collection',
					value: 'getAll',
					action: `Get collection of ${label}s`,
					description: `Get a list of ${label}s.`,
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
			description: `The ID of the ${label}.`,
			routing: { request: { url: `=/${apiPath}/{{$value}}` } },
		},
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			description: 'Whether to return all results or only up to a given limit.',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
			default: false,
			routing: {
				send: { paginate: '={{ $value }}' },
				operations: {
					pagination: {
						type: 'generic',
						properties: {
							continue: '={{ !!$response.body?.next_page_url }}',
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
			description: 'Max number of results to return.',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
			typeOptions: { minValue: 1, maxValue: 1500 },
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
			description: 'Number of results to skip for offset-based pagination.',
			routing: { request: { qs: { offset: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Filters',
			name: 'filters',
			type: 'collection',
			placeholder: 'Add Filter',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
			default: {},
			options: [
				{
					displayName: 'Sort',
					name: 'sort',
					type: 'string',
					default: '+id',
					placeholder: '+id or -modified',
					description: 'Sort field with direction prefix: + for ascending, - for descending.',
					routing: { request: { qs: { sort: '={{ $value }}' } } },
				},
				...extraFilters,
			],
		},
	];

	return { operations, fields };
}

const accessories = buildReadOnly('accessory', 'accessories', 'Accessory');
const actualContent = buildReadOnly('actualContent', 'actualcontent', 'Actual Content');
const equipmentAssignedSerials = buildReadOnly('equipmentAssignedSerial', 'equipmentassignedserials', 'Equipment Assigned Serial');
const equipmentSetsContent = buildReadOnly('equipmentSetsContent', 'equipmentsetscontent', 'Equipment Sets Content');
const repairs = buildReadOnly('repair', 'repairs', 'Repair');
const serialNumbers = buildReadOnly('serialNumber', 'serialnumbers', 'Serial Number');

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
