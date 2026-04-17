import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

export const timeRegistrationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['timeRegistration'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a time registration',
				description: 'Create a new time registration entry',
				routing: {
					request: {
						method: 'POST',
						url: '/timeregistration',
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
				name: 'Delete',
				value: 'delete',
				action: 'Delete a time registration',
				description: 'Delete a time registration by ID',
				routing: {
					request: {
						method: 'DELETE',
					},
					output: {
						postReceive: [
							{
								type: 'set',
								properties: {
									value: '={{ { "deleted": true } }}',
								},
							},
						],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a time registration',
				description: 'Get a single time registration by ID',
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
				action: 'Get collection of time registrations',
				description: 'Get a list of time registrations',
				routing: {
					request: {
						method: 'GET',
						url: '/timeregistration',
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
				name: 'Update',
				value: 'update',
				action: 'Update a time registration',
				description: 'Update an existing time registration',
				routing: {
					request: {
						method: 'PUT',
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

export const timeRegistrationFields: INodeProperties[] = [
	// ─── GET / UPDATE / DELETE ───────────────────────────────────────────────
	{
		displayName: 'Time Registration ID',
		name: 'timeRegId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['timeRegistration'],
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
		description: 'The ID of the time registration entry',
		routing: {
			request: {
				url: '=/timeregistration/{{$value}}',
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
				resource: ['timeRegistration'],
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
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url && $parameter["returnAll"] }}',
						request: {
							url: '={{ $response.body?.next_page_url ?? $request.url }}',
						},
					},
				},
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['timeRegistration'],
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
				resource: ['timeRegistration'],
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
				resource: ['timeRegistration'],
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
				description: 'Comma-separated list of fields to return. Leave empty for all fields.',
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
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '-start',
				placeholder: '+start or -modified',
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
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Open', value: 'open' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: 'open',
				description: 'Filter by approval status',
				routing: {
					request: {
						qs: {
							status: '={{ $value }}',
						},
					},
				},
			},
		],
	},

	// ─── CREATE ───────────────────────────────────────────────────────────────
	{
		displayName: 'Crew Member (Path)',
		name: 'crewmember',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['timeRegistration'],
				operation: ['create'],
			},
		},
		default: '',
		placeholder: '/crew/42',
		description: 'Resource path of the crew member, e.g. /crew/42',
		routing: {
			request: {
				body: {
					crewmember: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'Start Date/Time',
		name: 'start',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['timeRegistration'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Start of the time registration period',
		routing: {
			request: {
				body: {
					start: '={{ $value }}',
				},
			},
		},
	},
	{
		displayName: 'End Date/Time',
		name: 'end',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['timeRegistration'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'End of the time registration period',
		routing: {
			request: {
				body: {
					end: '={{ $value }}',
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
				resource: ['timeRegistration'],
				operation: ['create'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Break Duration (Minutes)',
				name: 'break_duration',
				type: 'number',
				default: 0,
				description: 'Break duration in minutes',
				routing: {
					request: {
						body: {
							break_duration: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Distance (Km)',
				name: 'distance',
				type: 'number',
				default: 0,
				description: 'Distance traveled in km',
				routing: {
					request: {
						body: {
							distance: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Leave Type (Path)',
				name: 'leavetype',
				type: 'string',
				default: '',
				placeholder: '/leavetypes/1',
				description: 'Resource path of the leave type if applicable',
				routing: {
					request: {
						body: {
							leavetype: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Remark',
				name: 'remark',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				routing: {
					request: {
						body: {
							remark: '={{ $value }}',
						},
					},
				},
			},
		],
	},

	// ─── UPDATE ───────────────────────────────────────────────────────────────
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['timeRegistration'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Break Duration (Minutes)',
				name: 'break_duration',
				type: 'number',
				default: 0,
				routing: {
					request: {
						body: {
							break_duration: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Distance (Km)',
				name: 'distance',
				type: 'number',
				default: 0,
				routing: {
					request: {
						body: {
							distance: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'End Date/Time',
				name: 'end',
				type: 'dateTime',
				default: '',
				routing: {
					request: {
						body: {
							end: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Remark',
				name: 'remark',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				routing: {
					request: {
						body: {
							remark: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Start Date/Time',
				name: 'start',
				type: 'dateTime',
				default: '',
				routing: {
					request: {
						body: {
							start: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Open', value: 'open' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: 'open',
				routing: {
					request: {
						body: {
							status: '={{ $value }}',
						},
					},
				},
			},
		],
	},
	customQueryParamsField('timeRegistration'),
];
