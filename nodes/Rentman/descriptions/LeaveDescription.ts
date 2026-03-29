import type { INodeProperties } from 'n8n-workflow';

// ─── LEAVE MUTATION ───────────────────────────────────────────────────────────

export const leaveMutationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['leaveMutation'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a leave mutation',
				routing: {
					request: { method: 'POST', url: '/leavemutation' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a leave mutation',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many leave mutations',
				routing: {
					request: { method: 'GET', url: '/leavemutation' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getAll',
	},
];

export const leaveMutationFields: INodeProperties[] = [
	{
		displayName: 'Leave Mutation ID',
		name: 'leaveMutationId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['get'] } },
		default: '',
		routing: { request: { url: '=/leavemutation/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['getAll'] } },
		default: {},
		options: [
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '-created',
				routing: { request: { qs: { sort: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Crew Member (Path)',
		name: 'crewmember',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['create'] } },
		default: '',
		placeholder: '/crew/42',
		routing: { request: { body: { crewmember: '={{ $value }}' } } },
	},
	{
		displayName: 'Leave Type (Path)',
		name: 'leavetype',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['create'] } },
		default: '',
		placeholder: '/leavetypes/1',
		routing: { request: { body: { leavetype: '={{ $value }}' } } },
	},
	{
		displayName: 'Hours',
		name: 'hours',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['create'] } },
		default: 0,
		routing: { request: { body: { hours: '={{ $value }}' } } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['leaveMutation'], operation: ['create'] } },
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

// ─── LEAVE REQUEST ────────────────────────────────────────────────────────────

export const leaveRequestOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['leaveRequest'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a leave request',
				routing: {
					request: { method: 'POST', url: '/leaverequest' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a leave request',
				routing: {
					request: { method: 'GET' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many leave requests',
				routing: {
					request: { method: 'GET', url: '/leaverequest' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a leave request',
				routing: {
					request: { method: 'PUT' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getAll',
	},
];

export const leaveRequestFields: INodeProperties[] = [
	{
		displayName: 'Leave Request ID',
		name: 'leaveRequestId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['get', 'update'] } },
		default: '',
		routing: { request: { url: '=/leaverequest/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['getAll'] } },
		default: {},
		options: [
			{
				displayName: 'Crew Member (Path)',
				name: 'crewmember',
				type: 'string',
				default: '',
				placeholder: '/crew/42',
				routing: { request: { qs: { crewmember: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '-created',
				routing: { request: { qs: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Pending', value: 'pending' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: 'pending',
				routing: { request: { qs: { status: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Crew Member (Path)',
		name: 'crewmember',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['create'] } },
		default: '',
		placeholder: '/crew/42',
		routing: { request: { body: { crewmember: '={{ $value }}' } } },
	},
	{
		displayName: 'Leave Type (Path)',
		name: 'leavetype',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['create'] } },
		default: '',
		placeholder: '/leavetypes/1',
		routing: { request: { body: { leavetype: '={{ $value }}' } } },
	},
	{
		displayName: 'Start Date',
		name: 'start',
		type: 'dateTime',
		required: true,
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['create'] } },
		default: '',
		routing: { request: { body: { start: '={{ $value }}' } } },
	},
	{
		displayName: 'End Date',
		name: 'end',
		type: 'dateTime',
		required: true,
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['create'] } },
		default: '',
		routing: { request: { body: { end: '={{ $value }}' } } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['create'] } },
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
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['leaveRequest'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'End Date',
				name: 'end',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { end: '={{ $value }}' } } },
			},
			{
				displayName: 'Remark',
				name: 'remark',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				routing: { request: { body: { remark: '={{ $value }}' } } },
			},
			{
				displayName: 'Start Date',
				name: 'start',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { start: '={{ $value }}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Pending', value: 'pending' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: 'pending',
				routing: { request: { body: { status: '={{ $value }}' } } },
			},
		],
	},
];
