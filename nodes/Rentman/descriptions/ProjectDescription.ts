import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, rentmanPagination } from './shared';

export const projectOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['project'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a project',
				description: 'Create a new project',
				routing: {
					request: {
						method: 'POST',
						url: '/projects',
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
				action: 'Get a project',
				description: 'Get a single project by ID',
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
				action: 'Get collection of projects',
				description: 'Get a list of projects',
				routing: {
					request: {
						method: 'GET',
						url: '/projects',
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

export const projectFields: INodeProperties[] = [
	// ─── GET / ───────────────────────────────────────────────────────────────
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['get'],
			},
		},
		default: '',
		description: 'The ID of the project',
		routing: {
			request: {
				url: '=/projects/{{$value}}',
			},
		},
	},

	// ─── GET ALL ─────────────────────────────────────────────────────────────
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['project'],
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
				resource: ['project'],
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
				resource: ['project'],
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
				resource: ['project'],
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
			description: 'Comma-separated list of fields to return. Custom fields can be requested as custom_N. Leave empty for all fields.',
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
			description: 'Filter by project name',
			routing: {
			request: {
			qs: {
			name: '={{ $value }}',
			},
			},
			},
			},
			{
			displayName: 'Number',
			name: 'number',
			type: 'number',
			default: 0,
			description: 'Filter by project number',
			routing: {
			request: {
			qs: {
			number: '={{ $value }}',
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

	// ─── CREATE ───────────────────────────────────────────────────────────────
	{
		displayName: 'Project Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the new project',
		routing: {
			request: {
				body: {
					name: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['create'],
			},
		},
		default: {},
		description: 'Rentman accepts only name, reference and number when creating a project. Customer, status, project type and similar fields are managed in Rentman itself and are rejected by the API.',
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
				displayName: 'Custom Reference',
				name: 'reference',
				type: 'string',
				default: '',
				description: 'Custom reference field for the project',
				routing: { request: { body: { reference: '={{ $value }}' } } },
			},
			{
				displayName: 'Number',
				name: 'number',
				type: 'string',
				default: '',
				description: 'Project number. Leave empty to let Rentman assign the next number.',
				routing: { request: { body: { number: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('project'),
];
