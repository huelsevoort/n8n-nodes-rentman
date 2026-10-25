import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, idSegment, rentmanPagination, toId } from './shared';

/** Project ID of the Set operations as a URL segment: an ID (42) or a path (/projects/42). */
const PROJECT_ID = idSegment('projects', 'projectId');

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
				name: 'Create From Template',
				value: 'createFromTemplate',
				action: 'Create a project from a template',
				description: 'Create a new project based on a project template (API v1.18.0)',
				routing: {
					request: {
						method: 'POST',
						url: '/projects/:createFromTemplate',
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
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many projects',
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
			{
				name: 'Set Client',
				value: 'setClient',
				action: 'Set the client of a project',
				description: 'Set the client (customer) of an existing project (API v1.19.0)',
				routing: {
					request: {
						method: 'POST',
						url: `=/projects/${PROJECT_ID}/:setClient`,
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
				action: 'Set the location of a project',
				description: 'Set the location of an existing project (API v1.19.0)',
				routing: {
					request: {
						method: 'POST',
						url: `=/projects/${PROJECT_ID}/:setLocation`,
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
				name: 'Set Type',
				value: 'setType',
				action: 'Set the project type of a project',
				description: 'Set the project type of an existing project (API v1.19.0)',
				routing: {
					request: {
						method: 'POST',
						url: `=/projects/${PROJECT_ID}/:setType`,
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
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['setClient', 'setLocation', 'setType'],
			},
		},
		default: '',
		description: 'ID (42) or path (/projects/42) of the project, e.g. the path Create From Template answers with',
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
				description: 'Project number, digits only. Leave empty to let Rentman assign the next number; Rentman also does that for a number with other characters.',
				routing: { request: { body: { number: '={{ $value }}' } } },
			},
		],
	},

	// ─── CREATE FROM TEMPLATE (API v1.18.0) ──────────────────────────────────
	{
		displayName: 'Project Template',
		name: 'template',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['createFromTemplate'],
			},
		},
		default: '',
		placeholder: '/projecttemplates/13',
		description: 'ID (13) or path (/projecttemplates/13) of the project template. Templates are listed under Project Template → Get Many. A path is sent as its ID: Rentman answers HTTP 400 to a path here.',
		routing: {
			request: {
				body: {
					template: toId('projecttemplates'),
				},
			},
		},
	},
	{
		displayName: 'Start Date',
		name: 'start_date',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['project'],
				operation: ['createFromTemplate'],
			},
		},
		default: '',
		description: 'First date of the new project. Only the date counts, as written (a value without a date-time format is read in the workflow timezone); the template sets the times. Rentman answers with the path of the new project, e.g. {"path": "/projects/42"}.',
		routing: {
			request: {
				body: {
					start_date: '={{ $value }}',
				},
			},
		},
	},

	// ─── SET CLIENT / LOCATION / TYPE (API v1.19.0) ──────────────────────────
	{
		displayName: 'Client',
		name: 'client',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['project'], operation: ['setClient'] } },
		default: '',
		placeholder: '/contacts/12',
		description: 'ID (12) or path (/contacts/12) of the contact to set as client. A path is sent as its ID: Rentman answers HTTP 400 to a path here.',
		routing: { request: { body: { client: toId('contacts') } } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: { resource: ['project'], operation: ['setClient'] } },
		default: {},
		options: [
			{
				displayName: 'Contact Person',
				name: 'contact_person',
				type: 'string',
				default: '',
				placeholder: '/contactpersons/7',
				description: 'ID or path of the contact person. Must belong to the client.',
				routing: { request: { body: { contact_person: toId('contactpersons', true) } } },
			},
			{
				displayName: 'Copy Data',
				name: 'copy_data',
				type: 'boolean',
				default: false,
				description: "Whether to copy the client's tax schema, invoice moment, discounts and insurance percentage onto the project",
				routing: { request: { body: { copy_data: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['project'], operation: ['setLocation'] } },
		default: '',
		placeholder: '/contacts/12',
		description: 'ID (12) or path (/contacts/12) of the contact to set as location. A path is sent as its ID: Rentman answers HTTP 400 to a path here.',
		routing: { request: { body: { location: toId('contacts') } } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: { resource: ['project'], operation: ['setLocation'] } },
		default: {},
		options: [
			{
				displayName: 'Apply Distances',
				name: 'apply_distances',
				type: 'boolean',
				default: false,
				description: 'Whether to re-derive the crew travel time and distance from the location',
				routing: { request: { body: { apply_distances: '={{ $value }}' } } },
			},
			{
				displayName: 'Contact Person',
				name: 'contact_person',
				type: 'string',
				default: '',
				placeholder: '/contactpersons/7',
				description: "ID or path of the contact person. Must belong to the location. Without it Rentman uses the location's default contact person.",
				routing: { request: { body: { contact_person: toId('contactpersons', true) } } },
			},
			{
				displayName: 'Copy Data',
				name: 'copy_data',
				type: 'boolean',
				default: false,
				description: "Whether to copy the location's tax schema onto the project",
				routing: { request: { body: { copy_data: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Project Type',
		name: 'type',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['project'], operation: ['setType'] } },
		default: '',
		placeholder: '/projecttypes/3',
		description: 'ID (3) or path (/projecttypes/3) of the project type. Types are listed under Project Type → Get Many. A path is sent as its ID: Rentman answers HTTP 400 to a path here.',
		routing: { request: { body: { type: toId('projecttypes') } } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: { resource: ['project'], operation: ['setType'] } },
		default: {},
		options: [
			{
				displayName: 'Copy Terms and Conditions',
				name: 'copy_terms_and_conditions',
				type: 'boolean',
				default: false,
				description: "Whether to replace the project's terms and conditions with the type's default ones",
				routing: { request: { body: { copy_terms_and_conditions: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('project'),
];
