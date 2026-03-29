import type { INodeProperties } from 'n8n-workflow';

export const appointmentCrewOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['appointmentCrew'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an appointment crew entry',
				routing: { request: { method: 'DELETE' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an appointment crew entry',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many appointment crew entries',
				routing: { request: { method: 'GET', url: '/appointmentcrew' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an appointment crew entry',
				routing: { request: { method: 'PUT' } },
			},
		],
		default: 'getAll',
	},
];

export const appointmentCrewFields: INodeProperties[] = [
	{
		displayName: 'Appointment Crew ID',
		name: 'appointmentCrewId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['appointmentCrew'], operation: ['get', 'update', 'delete'] } },
		default: '',
		routing: { request: { url: '=/appointmentcrew/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['appointmentCrew'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['appointmentCrew'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: { show: { resource: ['appointmentCrew'], operation: ['getAll'] } },
		default: {},
		options: [
			{
				displayName: 'Appointment (Path)',
				name: 'appointment',
				type: 'string',
				default: '',
				placeholder: '/appointments/42',
				routing: { request: { qs: { appointment: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '+id',
				routing: { request: { qs: { sort: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['appointmentCrew'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Remark',
				name: 'remark',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				routing: { request: { body: { remark: '={{ $value }}' } } },
			},
		],
	},
];
