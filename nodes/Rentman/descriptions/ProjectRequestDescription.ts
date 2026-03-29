import type { INodeProperties } from 'n8n-workflow';

// ─── PROJECT REQUESTS ─────────────────────────────────────────────────────────

export const projectRequestOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['projectRequest'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a project request',
				routing: { request: { method: 'POST', url: '/projectrequests' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a project request',
				routing: { request: { method: 'DELETE' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a project request',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many project requests',
				routing: { request: { method: 'GET', url: '/projectrequests' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a project request',
				routing: { request: { method: 'PUT' } },
			},
		],
		default: 'getAll',
	},
];

export const projectRequestFields: INodeProperties[] = [
	{
		displayName: 'Project Request ID',
		name: 'projectRequestId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['projectRequest'], operation: ['get', 'update', 'delete'] } },
		default: '',
		routing: { request: { url: '=/projectrequests/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['projectRequest'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['projectRequest'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: { show: { resource: ['projectRequest'], operation: ['getAll'] } },
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
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['projectRequest'], operation: ['create'] } },
		default: '',
		routing: { request: { body: { name: '={{ $value }}' } } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['projectRequest'], operation: ['create'] } },
		default: {},
		options: [
			{
				displayName: 'Customer (Path)',
				name: 'customer',
				type: 'string',
				default: '',
				placeholder: '/contacts/42',
				routing: { request: { body: { customer: '={{ $value }}' } } },
			},
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
		displayOptions: { show: { resource: ['projectRequest'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{ $value }}' } } },
			},
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

// ─── PROJECT REQUEST EQUIPMENT ────────────────────────────────────────────────

export const projectRequestEquipmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['projectRequestEquipment'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a project request equipment entry',
				routing: { request: { method: 'DELETE' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a project request equipment entry',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many project request equipment entries',
				routing: { request: { method: 'GET', url: '/projectrequestequipment' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a project request equipment entry',
				routing: { request: { method: 'PUT' } },
			},
		],
		default: 'getAll',
	},
];

export const projectRequestEquipmentFields: INodeProperties[] = [
	{
		displayName: 'Project Request Equipment ID',
		name: 'projectRequestEquipmentId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['projectRequestEquipment'], operation: ['get', 'update', 'delete'] } },
		default: '',
		routing: { request: { url: '=/projectrequestequipment/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: { show: { resource: ['projectRequestEquipment'], operation: ['getAll'] } },
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
		displayOptions: { show: { resource: ['projectRequestEquipment'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1, maxValue: 1500 },
		default: 100,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: { show: { resource: ['projectRequestEquipment'], operation: ['getAll'] } },
		default: {},
		options: [
			{
				displayName: 'Project Request (Path)',
				name: 'projectrequest',
				type: 'string',
				default: '',
				placeholder: '/projectrequests/42',
				routing: { request: { qs: { projectrequest: '={{ $value }}' } } },
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
		displayOptions: { show: { resource: ['projectRequestEquipment'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				default: 1,
				routing: { request: { body: { quantity: '={{ $value }}' } } },
			},
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
