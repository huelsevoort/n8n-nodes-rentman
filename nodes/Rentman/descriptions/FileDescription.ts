import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, rentmanPagination } from './shared';

function buildReadOnly(
	resourceValue: string,
	apiPath: string,
	idLabel: string,
): { operations: INodeProperties[]; fields: INodeProperties[] } {
	const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];
	const label = idLabel.toLowerCase();
	return {
		operations: [
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
		],
		fields: [
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
						pagination: rentmanPagination,
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
						displayName: 'Fields',
						name: 'fields',
						type: 'string',
						default: '',
						placeholder: 'ID,displayname,modified',
						description: 'Comma-separated list of fields to return. Custom fields can be requested as custom_N. Leave empty for all fields.',
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
			customQueryParamsField(resourceValue),
		],
	};
}

const files = buildReadOnly('file', 'files', 'File');
const fileFolders = buildReadOnly('fileFolder', 'file_folders', 'File Folder');

export const fileOperations = files.operations;
export const fileFields = files.fields;

export const fileFolderOperations = fileFolders.operations;
export const fileFolderFields = fileFolders.fields;

// ─── FOLDER (CRUD) ───────────────────────────────────────────────────────────
const folderPostReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];

const folderBodyFields: INodeProperties['options'] = [
	{
		displayName: 'Item Type',
		name: 'itemtype',
		type: 'options',
		options: [
			{ name: 'Contact', value: 'contact' },
			{ name: 'Container', value: 'container' },
			{ name: 'Default Function', value: 'default function' },
			{ name: 'Equipment', value: 'equipment' },
			{ name: 'Project Template', value: 'project template' },
			{ name: 'User', value: 'user' },
			{ name: 'Vehicle', value: 'vehicle' },
		],
		default: 'equipment',
		description: 'The type of item this folder contains',
		routing: { request: { body: { itemtype: '={{ $value }}' } } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		routing: { request: { body: { name: '={{ $value }}' } } },
	},
	{
		displayName: 'Order',
		name: 'order',
		type: 'string',
		default: '',
		routing: { request: { body: { order: '={{ $value }}' } } },
	},
	{
		displayName: 'Parent (Path)',
		name: 'parent',
		type: 'string',
		default: '',
		placeholder: '/folders/0',
		description: 'Resource path of the parent folder',
		routing: { request: { body: { parent: '={{ $value }}' } } },
	},
];

export const folderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['folder'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a folder',
				description: 'Create a new folder',
				routing: {
					request: { method: 'POST', url: '/folders' },
					output: { postReceive: folderPostReceive },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a folder',
				description: 'Get a single folder by ID',
				routing: { request: { method: 'GET' }, output: { postReceive: folderPostReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of folders',
				description: 'Get a list of folders',
				routing: { request: { method: 'GET', url: '/folders' }, output: { postReceive: folderPostReceive } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a folder',
				description: 'Update an existing folder',
				routing: { request: { method: 'PUT' }, output: { postReceive: folderPostReceive } },
			},
		],
		default: 'getAll',
	},
];

export const folderFields: INodeProperties[] = [
	{
		displayName: 'Folder ID',
		name: 'folderId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['folder'], operation: ['get', 'update'] } },
		default: '',
		description: 'The ID of the folder',
		routing: { request: { url: '=/folders/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['folder'], operation: ['getAll'] } },
		default: false,
		routing: {
			send: { paginate: true },
			operations: {
				pagination: rentmanPagination,
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['folder'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['folder'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['folder'], operation: ['getAll'] } },
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
				displayName: 'Fields',
				name: 'fields',
				type: 'string',
				default: '',
				placeholder: 'ID,displayname,modified',
				description: 'Comma-separated list of fields to return. Custom fields can be requested as custom_N. Leave empty for all fields.',
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
	customQueryParamsField('folder'),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['folder'], operation: ['create', 'update'] } },
		default: {},
		options: folderBodyFields,
	},
];
