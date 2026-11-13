import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, idSegment, rentmanPagination, toId } from './shared';

/** Subproject ID of the API v1.20.0 operations as a URL segment: an ID (42) or a path (/subprojects/42). */
const SUBPROJECT_ID = idSegment('subprojects', 'subprojectId');
const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];

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
				name: 'Put In Planning',
				value: 'putInPlanning',
				action: 'Put a subproject into planning',
				description: 'Put an existing subproject into planning (API v1.20.0)',
				routing: { request: { method: 'POST', url: `=/subprojects/${SUBPROJECT_ID}/:putInPlanning` }, output: { postReceive } },
			},
			{
				name: 'Set In Financial',
				value: 'setInFinancial',
				action: 'Set whether a subproject counts towards financials',
				description: 'Set whether an existing subproject counts towards the financial overview (API v1.20.0)',
				routing: { request: { method: 'POST', url: `=/subprojects/${SUBPROJECT_ID}/:setInFinancial` }, output: { postReceive } },
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
			{
				name: 'Take Out of Planning',
				value: 'takeOutOfPlanning',
				action: 'Take a subproject out of planning',
				description: 'Take an existing subproject out of planning (API v1.20.0)',
				routing: { request: { method: 'POST', url: `=/subprojects/${SUBPROJECT_ID}/:takeOutOfPlanning` }, output: { postReceive } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a subproject',
				description: 'Update the name or custom fields of an existing subproject (API v1.20.0)',
				routing: { request: { method: 'PUT', url: `=/subprojects/${SUBPROJECT_ID}` }, output: { postReceive } },
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
		description: 'ID (42) or path (/subprojects/42) of the subproject',
		routing: { request: { url: `=/subprojects/${idSegment('subprojects', 'subprojectId')}/:setLocation` } },
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
		routing: { request: { body: { location: toId('contacts') } } },
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
				routing: { request: { body: { contact_person: toId('contactpersons', true) } } },
			},
		],
	},
	// ─── UPDATE / PLANNING / FINANCIAL (API v1.20.0) ─────────────────────────
	{
		displayName: 'Subproject ID',
		name: 'subprojectId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['subproject'], operation: ['putInPlanning', 'setInFinancial', 'takeOutOfPlanning', 'update'] } },
		default: '',
		description: 'ID (42) or path (/subprojects/42) of the subproject',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['subproject'], operation: ['update'] } },
		default: {},
		description: 'Only the fields added here are changed. Rentman lets the API change only the name and custom fields of a subproject.',
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
				description: 'Name of the subproject',
				routing: { request: { body: { name: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'In Financial Overview',
		name: 'inFinancial',
		type: 'boolean',
		required: true,
		displayOptions: { show: { resource: ['subproject'], operation: ['setInFinancial'] } },
		default: true,
		description: 'Whether the subproject counts towards the financial overview',
		routing: { request: { body: { in_financial: '={{ $value }}' } } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: { show: { resource: ['subproject'], operation: ['takeOutOfPlanning'] } },
		default: {},
		description: 'Without options Rentman cleans up nothing: planned crew, invitations and connected subrents stay, but no longer count',
		options: [
			{
				displayName: 'Cancel Subrents',
				name: 'cancel_subrents',
				type: 'boolean',
				default: false,
				description: 'Whether to set every subrent connected to the subproject to cancelled',
				routing: { request: { body: { cancel_subrents: '={{ $value }}' } } },
			},
			{
				displayName: 'Notification Text',
				name: 'notification_text',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Extra text for the email to the crew members (with Notify Crew Members)',
				routing: { request: { body: { notification_text: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Notify Crew Members',
				name: 'notify_crew_members',
				type: 'boolean',
				default: false,
				description: 'Whether to email the removed crew members their changed schedule. Only together with Remove Planned Crew.',
				routing: { request: { body: { notify_crew_members: '={{ $value }}' } } },
			},
			{
				displayName: 'Remove Planned Crew',
				name: 'remove_planned_crew',
				type: 'boolean',
				default: false,
				description: "Whether to delete the crew and transport planning of the subproject's functions",
				routing: { request: { body: { remove_planned_crew: '={{ $value }}' } } },
			},
			{
				displayName: 'Withdraw Invitations',
				name: 'withdraw_invitations',
				type: 'boolean',
				default: false,
				description: "Whether to expire the open invitations of the subproject's functions and delete the ones not sent yet",
				routing: { request: { body: { withdraw_invitations: '={{ $value }}' } } },
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
