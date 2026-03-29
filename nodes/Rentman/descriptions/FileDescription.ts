import type { INodeProperties } from 'n8n-workflow';

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
		],
		fields: [
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
				],
			},
		],
	};
}

const files = buildReadOnly('file', 'files', 'File');
const fileFolders = buildReadOnly('fileFolder', 'file_folders', 'File Folder');
const folders = buildReadOnly('folder', 'folders', 'Folder');

export const fileOperations = files.operations;
export const fileFields = files.fields;

export const fileFolderOperations = fileFolders.operations;
export const fileFolderFields = fileFolders.fields;

export const folderOperations = folders.operations;
export const folderFields = folders.fields;
