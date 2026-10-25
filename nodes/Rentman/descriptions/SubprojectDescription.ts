import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, rentmanPagination, TO_ID } from './shared';

export const subprojectOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['subproject'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a subproject',
				description: 'Create a subproject in a project (POST /projects/{ID}/subprojects)',
				routing: {
					request: { method: 'POST' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a subproject',
				description: 'Get a single subproject by ID',
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
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many subprojects',
				description: 'Get a list of subprojects',
				routing: {
					request: {
						method: 'GET',
						url: '/subprojects',
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
				name: 'Set Location',
				value: 'setLocation',
				action: 'Set the location of a subproject',
				description: 'Set the location of an existing subproject (API v1.19.0)',
				routing: {
					request: { method: 'POST' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getAll',
	},
];

export const subprojectFields: INodeProperties[] = [
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['subproject'], operation: ['create'] } },
		default: '',
		description: 'The ID of the project to add the subproject to',
		routing: { request: { url: '=/projects/{{$value}}/subprojects' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['subproject'], operation: ['create'] } },
		default: {},
		options: [
			{
				displayName: 'Custom Fields',
				name: 'custom',
				type: 'json',
				default: '{}',
				description: 'Custom fields as JSON object, e.g. {"custom_1": "text", "custom_2": 5}. The field names are listed under Extra Input Field.',
				routing: { request: { body: { custom: "={{ typeof $value === 'string' ? JSON.parse($value || '{}') : $value }}" } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Subproject ID',
		name: 'subprojectId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['subproject'],
				operation: ['get'],
			},
		},
		default: '',
		description: 'The ID of the subproject',
		routing: {
			request: {
				url: '=/subprojects/{{$value}}',
			},
		},
	},
	// ─── SET LOCATION (API v1.19.0) ──────────────────────────────────────────
	{
		displayName: 'Subproject ID',
		name: 'subprojectId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['subproject'], operation: ['setLocation'] } },
		default: '',
		description: 'The ID of the subproject. Rentman answers with its path, e.g. {"path": "/subprojects/42"}.',
		routing: { request: { url: '=/subprojects/{{$value}}/:setLocation' } },
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['subproject'], operation: ['setLocation'] } },
		default: '',
		placeholder: '/contacts/12',
		description: 'ID (12) or path (/contacts/12) of the contact to set as location. A path is sent as its ID: Rentman answers HTTP 400 to a path here.',
		routing: { request: { body: { location: `={{ ${TO_ID} }}` } } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: { resource: ['subproject'], operation: ['setLocation'] } },
		default: {},
		options: [
			{
				displayName: 'Contact Person',
				name: 'contact_person',
				type: 'string',
				default: '',
				placeholder: '/contactpersons/7',
				description: "ID or path of the contact person. Must belong to the location. Without it Rentman uses the location's default contact person.",
				routing: { request: { body: { contact_person: `={{ ${TO_ID} }}` } } },
			},
		],
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['subproject'],
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
				resource: ['subproject'],
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
				resource: ['subproject'],
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
				resource: ['subproject'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
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
				description: 'Return only records with ID greater than this value. Useful for incremental sync.',
				routing: {
					request: {
						qs: {
							'id[gt]': '={{ $value > 0 ? $value : undefined }}',
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
				displayName: 'Project (Path)',
				name: 'project',
				type: 'string',
				default: '',
				placeholder: '/projects/42',
				description: 'Filter by parent project path, e.g. /projects/42',
				routing: {
					request: {
						qs: {
							project: '={{ $value }}',
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
			],
	},
	customQueryParamsField('subproject'),
];
