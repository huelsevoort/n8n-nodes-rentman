import type { INodeProperties } from 'n8n-workflow';

function buildReadOnly(
	resourceValue: string,
	apiPath: string,
	idLabel: string,
): { operations: INodeProperties[]; fields: INodeProperties[] } {
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
						action: `Get a ${idLabel.toLowerCase()}`,
						routing: { request: { method: 'GET' } },
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: `Get many ${idLabel.toLowerCase()}s`,
						routing: { request: { method: 'GET', url: `/${apiPath}` } },
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
				routing: { request: { url: `=/${apiPath}/{{$value}}` } },
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
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
				displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
				typeOptions: { minValue: 1, maxValue: 1500 },
				default: 100,
				routing: { request: { qs: { limit: '={{ $value }}' } } },
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
