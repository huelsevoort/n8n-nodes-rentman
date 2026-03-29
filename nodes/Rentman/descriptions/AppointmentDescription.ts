import type { INodeProperties } from 'n8n-workflow';

export const appointmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['appointment'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an appointment',
				description: 'Create a new appointment',
				routing: {
					request: {
						method: 'POST',
						url: '/appointments',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an appointment',
				description: 'Delete an appointment by ID',
				routing: {
					request: {
						method: 'DELETE',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an appointment',
				description: 'Get a single appointment by ID',
				routing: {
					request: {
						method: 'GET',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many appointments',
				description: 'Get a list of appointments',
				routing: {
					request: {
						method: 'GET',
						url: '/appointments',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an appointment',
				description: 'Update an existing appointment',
				routing: {
					request: {
						method: 'PUT',
					},
				},
			},
		],
		default: 'getAll',
	},
];

export const appointmentFields: INodeProperties[] = [
	// ─── GET / UPDATE / DELETE ───────────────────────────────────────────────
	{
		displayName: 'Appointment ID',
		name: 'appointmentId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['get', 'update', 'delete'],
			},
		},
		default: '',
		description: 'The ID of the appointment',
		routing: {
			request: {
				url: '=/appointments/{{$value}}',
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
				resource: ['appointment'],
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		routing: {
			send: {
				paginate: '={{ $value }}',
			},
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url }}',
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
				resource: ['appointment'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 1500,
		},
		default: 100,
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
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['getAll'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '+id',
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
		],
	},

	// ─── CREATE ───────────────────────────────────────────────────────────────
	{
		displayName: 'Start Date/Time',
		name: 'start',
		type: 'dateTime',
		required: true,
		displayOptions: {
			show: {
				resource: ['appointment'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Start date and time of the appointment',
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
				resource: ['appointment'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'End date and time of the appointment',
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
				resource: ['appointment'],
				operation: ['create'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name/title of the appointment',
				routing: {
					request: {
						body: {
							name: '={{ $value }}',
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
				resource: ['appointment'],
				operation: ['update'],
			},
		},
		default: {},
		options: [
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: {
					request: {
						body: {
							name: '={{ $value }}',
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
		],
	},
];
