import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField } from './shared';

const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];
const deletePostReceive = [
	{
		type: 'set' as const,
		properties: { value: '={{ { "deleted": true } }}' },
	},
];

const standardFilters: INodeProperties['options'] = [
	{
		displayName: 'Created After',
		name: 'created_gt',
		type: 'dateTime',
		default: '',
		description: 'Return only records created after this date',
		routing: { request: { qs: { 'created[gt]': '={{ $value }}' } } },
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'string',
		default: '',
		placeholder: 'ID,displayname,modified',
		description: 'Comma-separated list of fields to return. Leave empty for all fields.',
		routing: { request: { qs: { fields: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'ID Greater Than',
		name: 'id_gt',
		type: 'number',
		default: 0,
		description: 'Return only records with ID greater than this value. Useful for incremental sync.',
		routing: { request: { qs: { 'id[gt]': '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Modified After',
		name: 'modified_gt',
		type: 'dateTime',
		default: '',
		description: 'Return only records modified after this date',
		routing: { request: { qs: { 'modified[gt]': '={{ $value }}' } } },
	},
	{
		displayName: 'Modified Before',
		name: 'modified_lt',
		type: 'dateTime',
		default: '',
		description: 'Return only records modified before this date',
		routing: { request: { qs: { 'modified[lt]': '={{ $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'string',
		default: '+id',
		placeholder: '+ID or -modified',
		description: 'Sort field with direction prefix: + for ascending, - for descending',
		routing: { request: { qs: { sort: '={{ $value }}' } } },
	},
];

// ─── TASK STATUS (CRUD) ──────────────────────────────────────────────────────

export const taskStatusOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['taskStatus'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a task status',
				description: 'Create a new task status',
				routing: {
					request: { method: 'POST', url: '/taskstatuses' },
					output: { postReceive },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a task status',
				description: 'Delete a task status by ID',
				routing: { request: { method: 'DELETE' }, output: { postReceive: deletePostReceive } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a task status',
				description: 'Get a single task status by ID',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of task statuses',
				description: 'Get a list of task statuses',
				routing: { request: { method: 'GET', url: '/taskstatuses' }, output: { postReceive } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a task status',
				description: 'Update an existing task status',
				routing: { request: { method: 'PUT' }, output: { postReceive } },
			},
		],
		default: 'getAll',
	},
];

const taskStatusBodyFields: INodeProperties['options'] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		routing: { request: { body: { name: '={{ $value }}' } } },
	},
	{
		displayName: 'Order',
		name: 'order',
		type: 'string',
		default: '',
		routing: { request: { body: { order: '={{ $value }}' } } },
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Custom', value: 'custom' },
			{ name: 'Done', value: 'done' },
			{ name: 'Todo', value: 'todo' },
		],
		default: 'todo',
		routing: { request: { body: { type: '={{ $value }}' } } },
	},
];

export const taskStatusFields: INodeProperties[] = [
	{
		displayName: 'Task Status ID',
		name: 'taskStatusId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['taskStatus'], operation: ['get', 'update', 'delete'] } },
		default: '',
		description: 'The ID of the task status',
		routing: { request: { url: '=/taskstatuses/{{$value}}' } },
	},
	{
		displayName: 'Color',
		name: 'color',
		type: 'color',
		required: true,
		displayOptions: { show: { resource: ['taskStatus'], operation: ['create'] } },
		default: '#000000',
		description: 'Required: status color (any CSS-style hex code, e.g. #00AA00)',
		routing: { request: { body: { color: '={{ $value }}' } } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['taskStatus'], operation: ['getAll'] } },
		default: false,
		routing: {
			send: { paginate: true },
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url && $parameter["returnAll"] }}',
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
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['taskStatus'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['taskStatus'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['taskStatus'], operation: ['getAll'] } },
		default: {},
		options: standardFilters,
	},
	customQueryParamsField('taskStatus'),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['taskStatus'], operation: ['create', 'update'] } },
		default: {},
		options: taskStatusBodyFields,
	},
];

// ─── SUBTASK (read / update / delete) ────────────────────────────────────────

export const subtaskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['subtask'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a subtask',
				description: 'Delete a subtask by ID',
				routing: { request: { method: 'DELETE' }, output: { postReceive: deletePostReceive } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a subtask',
				description: 'Get a single subtask by ID',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of subtasks',
				description: 'Get a list of subtasks (use Task → Create Subtask to create new ones)',
				routing: { request: { method: 'GET', url: '/subtasks' }, output: { postReceive } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a subtask',
				description: 'Update an existing subtask',
				routing: { request: { method: 'PUT' }, output: { postReceive } },
			},
		],
		default: 'getAll',
	},
];

export const subtaskFields: INodeProperties[] = [
	{
		displayName: 'Subtask ID',
		name: 'subtaskId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['subtask'], operation: ['get', 'update', 'delete'] } },
		default: '',
		description: 'The ID of the subtask',
		routing: { request: { url: '=/subtasks/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['subtask'], operation: ['getAll'] } },
		default: false,
		routing: {
			send: { paginate: true },
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url && $parameter["returnAll"] }}',
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
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['subtask'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['subtask'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['subtask'], operation: ['getAll'] } },
		default: {},
		options: [
			...standardFilters,
			{
				displayName: 'Task (Path)',
				name: 'task',
				type: 'string',
				default: '',
				placeholder: '/tasks/0',
				description: 'Filter by parent task resource path',
				routing: { request: { qs: { task: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('subtask'),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['subtask'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Completed',
				name: 'completed',
				type: 'boolean',
				default: false,
				routing: { request: { body: { completed: '={{ $value }}' } } },
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				routing: { request: { body: { title: '={{ $value }}' } } },
			},
		],
	},
];

// ─── TASK ASSIGNMENT (read / update / delete) ────────────────────────────────

export const taskAssignmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['taskAssignment'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a task assignment',
				description: 'Delete a task assignment by ID',
				routing: { request: { method: 'DELETE' }, output: { postReceive: deletePostReceive } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a task assignment',
				description: 'Get a single task assignment by ID',
				routing: { request: { method: 'GET' }, output: { postReceive } },
			},
			{
				name: 'Get Collection',
				value: 'getAll',
				action: 'Get collection of task assignments',
				description: 'Get a list of task assignments (use Task → Create Task Assignment to create new ones)',
				routing: { request: { method: 'GET', url: '/taskassignments' }, output: { postReceive } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a task assignment',
				description: 'Update an existing task assignment',
				routing: { request: { method: 'PUT' }, output: { postReceive } },
			},
		],
		default: 'getAll',
	},
];

export const taskAssignmentFields: INodeProperties[] = [
	{
		displayName: 'Task Assignment ID',
		name: 'taskAssignmentId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['taskAssignment'], operation: ['get', 'update', 'delete'] } },
		default: '',
		description: 'The ID of the task assignment',
		routing: { request: { url: '=/taskassignments/{{$value}}' } },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: { show: { resource: ['taskAssignment'], operation: ['getAll'] } },
		default: false,
		routing: {
			send: { paginate: true },
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ !!$response.body?.next_page_url && $parameter["returnAll"] }}',
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
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['taskAssignment'], operation: ['getAll'], returnAll: [false] } },
		typeOptions: { minValue: 1 },
		default: 50,
		routing: { request: { qs: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		displayOptions: { show: { resource: ['taskAssignment'], operation: ['getAll'], returnAll: [false] } },
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
		displayOptions: { show: { resource: ['taskAssignment'], operation: ['getAll'] } },
		default: {},
		options: [
			...standardFilters,
			{
				displayName: 'Crew (Path)',
				name: 'crew',
				type: 'string',
				default: '',
				placeholder: '/crew/0',
				description: 'Filter by assigned crew member resource path',
				routing: { request: { qs: { crew: '={{ $value }}' } } },
			},
			{
				displayName: 'Task (Path)',
				name: 'task',
				type: 'string',
				default: '',
				placeholder: '/tasks/0',
				description: 'Filter by parent task resource path',
				routing: { request: { qs: { task: '={{ $value }}' } } },
			},
		],
	},
	customQueryParamsField('taskAssignment'),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['taskAssignment'], operation: ['update'] } },
		default: {},
		options: [
			{
				displayName: 'Crew (Path)',
				name: 'crew',
				type: 'string',
				default: '',
				placeholder: '/crew/0',
				description: 'Resource path of the assigned crew member',
				routing: { request: { body: { crew: '={{ $value }}' } } },
			},
		],
	},
];
