/**
 * Compact read-only descriptions for all remaining Rentman lookup/sub-resources.
 * Each uses the same Get + Get Collection pattern with cursor pagination.
 */
import type { INodeProperties } from 'n8n-workflow';
import { customQueryParamsField, rentmanPagination } from './shared';

function buildReadOnly(
	resourceValue: string,
	apiPath: string,
	displayLabel: string,
	extraFilterOptions: INodeProperties['options'] = [],
): { operations: INodeProperties[]; fields: INodeProperties[] } {
	const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];
	const label = displayLabel.toLowerCase();

	const operations: INodeProperties[] = [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resourceValue] } },
			options: [
				{
					name: 'Get',
					value: 'get',
					action: `Get a ${label}`,
					description: `Get a single ${label} by ID`,
					routing: { request: { method: 'GET' }, output: { postReceive } },
				},
				{
					name: 'Get Collection',
					value: 'getAll',
					action: `Get collection of ${label}s`,
					description: `Get a list of ${label}s`,
					routing: { request: { method: 'GET', url: `/${apiPath}` }, output: { postReceive } },
				},
			],
			default: 'getAll',
		},
	];

	const fields: INodeProperties[] = [
		{
			displayName: `${displayLabel} ID`,
			name: `${resourceValue}Id`,
			type: 'string',
			required: true,
			displayOptions: { show: { resource: [resourceValue], operation: ['get'] } },
			default: '',
			description: `The ID of the ${label}`,
			routing: { request: { url: `=/${apiPath}/{{$value}}` } },
		},
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
			default: false,
			routing: {
				send: { paginate: true },
				operations: {
					pagination: rentmanPagination,
				},
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			description: 'Max number of results to return',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
			typeOptions: { minValue: 1 },
			default: 50,
			routing: { request: { qs: { limit: '={{ $value }}' } } },
		},
		{
			displayName: 'Offset',
			name: 'offset',
			type: 'number',
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'], returnAll: [false] } },
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
			displayOptions: { show: { resource: [resourceValue], operation: ['getAll'] } },
			default: {},
			options: [
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
					description: 'Comma-separated list of fields to return. Custom fields can be requested as custom_N; together with Expand, dot notation limits an expanded record (e.g. equipment.name). Leave empty for all fields.',
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
				...extraFilterOptions,
			],
		},
		customQueryParamsField(resourceValue),
	];

	return { operations, fields };
}

/**
 * Adds a Create operation for records Rentman creates only under a project (POST /projects/{ID}/<apiPath>).
 * `createFields` are the body fields shown for it.
 */
function withProjectCreate(
	built: { operations: INodeProperties[]; fields: INodeProperties[] },
	resourceValue: string,
	apiPath: string,
	label: string,
	createFields: INodeProperties[],
): { operations: INodeProperties[]; fields: INodeProperties[] } {
	const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];
	const [operation] = built.operations;
	operation.options = [
		{
			name: 'Create',
			value: 'create',
			action: `Create a ${label}`,
			description: `Create a ${label} in a project (POST /projects/{ID}/${apiPath})`,
			routing: { request: { method: 'POST' }, output: { postReceive } },
		},
		...(operation.options ?? []),
	];
	built.fields.unshift({
		displayName: 'Project ID',
		name: 'projectId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: [resourceValue], operation: ['create'] } },
		default: '',
		description: `The ID of the project to add the ${label} to`,
		routing: { request: { url: `=/projects/{{$value}}/${apiPath}` } },
	});
	built.fields.push(...createFields);
	return built;
}

const subprojectCreateField = (resourceValue: string): INodeProperties => ({
	displayName: 'Subproject (Path)',
	name: 'subprojectPath',
	type: 'string',
	required: true,
	displayOptions: { show: { resource: [resourceValue], operation: ['create'] } },
	default: '',
	placeholder: '/subprojects/1',
	description: 'Resource path of the subproject the record belongs to',
	routing: { request: { body: { subproject: '={{ $value }}' } } },
});

// ─── PROJECT SUB-RESOURCES ────────────────────────────────────────────────────

const projectCrew = buildReadOnly('projectCrew', 'projectcrew', 'Project Crew', [
	{
		displayName: 'Project Function (Path)',
		name: 'projectfunction',
		type: 'string',
		default: '',
		placeholder: '/projectfunctions/42',
		description: 'Filter by project function resource path',
		routing: { request: { qs: { function: '={{ $value }}' } } },
	},
]);
export const projectCrewOperations = projectCrew.operations;
export const projectCrewFields = projectCrew.fields;

const projectEquipment = buildReadOnly('projectEquipment', 'projectequipment', 'Project Equipment', [
	{
		displayName: 'Project Equipment Group (Path)',
		name: 'projectequipmentgroup',
		type: 'string',
		default: '',
		placeholder: '/projectequipmentgroup/42',
		description: 'Filter by project equipment group resource path',
		routing: { request: { qs: { equipment_group: '={{ $value }}' } } },
	},
]);
export const projectEquipmentOperations = projectEquipment.operations;
export const projectEquipmentFields = projectEquipment.fields;

const projectEquipmentGroup = buildReadOnly('projectEquipmentGroup', 'projectequipmentgroup', 'Project Equipment Group', [
	{
		displayName: 'Subproject (Path)',
		name: 'subproject',
		type: 'string',
		default: '',
		placeholder: '/subprojects/42',
		description: 'Filter by subproject resource path',
		routing: { request: { qs: { subproject: '={{ $value }}' } } },
	},
]);
export const projectEquipmentGroupOperations = projectEquipmentGroup.operations;
export const projectEquipmentGroupFields = projectEquipmentGroup.fields;

const projectFunctionGroups = buildReadOnly('projectFunctionGroup', 'projectfunctiongroups', 'Project Function Group', [
	{
		displayName: 'Subproject (Path)',
		name: 'subproject',
		type: 'string',
		default: '',
		placeholder: '/subprojects/42',
		description: 'Filter by subproject resource path',
		routing: { request: { qs: { subproject: '={{ $value }}' } } },
	},
]);
withProjectCreate(projectFunctionGroups, 'projectFunctionGroup', 'projectfunctiongroups', 'project function group', [
	subprojectCreateField('projectFunctionGroup'),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['projectFunctionGroup'], operation: ['create'] } },
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
				displayName: 'Plan Period End',
				name: 'planperiod_end',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { planperiod_end: '={{ $value }}' } } },
			},
			{
				displayName: 'Plan Period Start',
				name: 'planperiod_start',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { planperiod_start: '={{ $value }}' } } },
			},
			{
				displayName: 'Remark',
				name: 'remark',
				type: 'string',
				default: '',
				routing: { request: { body: { remark: '={{ $value }}' } } },
			},
			{
				displayName: 'Usage Period End',
				name: 'usageperiod_end',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { usageperiod_end: '={{ $value }}' } } },
			},
			{
				displayName: 'Usage Period Start',
				name: 'usageperiod_start',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { usageperiod_start: '={{ $value }}' } } },
			},
		],
	},
]);
export const projectFunctionGroupOperations = projectFunctionGroups.operations;
export const projectFunctionGroupFields = projectFunctionGroups.fields;

const projectFunctions = buildReadOnly('projectFunction', 'projectfunctions', 'Project Function', [
	{
		displayName: 'Project Function Group (Path)',
		name: 'projectfunctiongroup',
		type: 'string',
		default: '',
		placeholder: '/projectfunctiongroups/42',
		description: 'Filter by project function group resource path',
		routing: { request: { qs: { group: '={{ $value }}' } } },
	},
]);
withProjectCreate(projectFunctions, 'projectFunction', 'projectfunctions', 'project function', [
	subprojectCreateField('projectFunction'),
	{
		displayName: 'Cost Rate (Path)',
		name: 'costRate',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['projectFunction'], operation: ['create'] } },
		default: '',
		placeholder: '/rates/1',
		description: 'Resource path of the rate used for the crew costs',
		routing: { request: { body: { cost_rate: '={{ $value }}' } } },
	},
	{
		displayName: 'Price Rate (Path)',
		name: 'priceRate',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['projectFunction'], operation: ['create'] } },
		default: '',
		placeholder: '/rates/1',
		description: 'Resource path of the rate used for the price',
		routing: { request: { body: { price_rate: '={{ $value }}' } } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { resource: ['projectFunction'], operation: ['create'] } },
		default: {},
		options: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				routing: { request: { body: { amount: '={{ $value }}' } } },
			},
			{
				displayName: 'Cost Accommodation',
				name: 'cost_accommodation',
				type: 'number',
				default: 0,
				routing: { request: { body: { cost_accommodation: '={{ $value }}' } } },
			},
			{
				displayName: 'Cost Catering',
				name: 'cost_catering',
				type: 'number',
				default: 0,
				routing: { request: { body: { cost_catering: '={{ $value }}' } } },
			},
			{
				displayName: 'Cost Other',
				name: 'cost_other',
				type: 'number',
				default: 0,
				routing: { request: { body: { cost_other: '={{ $value }}' } } },
			},
			{
				displayName: 'Cost Travel',
				name: 'cost_travel',
				type: 'number',
				default: 0,
				routing: { request: { body: { cost_travel: '={{ $value }}' } } },
			},
			{
				displayName: 'Custom Fields',
				name: 'custom',
				type: 'json',
				default: '{}',
				description: 'Custom fields as JSON object, e.g. {"custom_1": "text", "custom_2": 5}. The field names are listed under Extra Input Field.',
				routing: { request: { body: { custom: "={{ typeof $value === 'string' ? JSON.parse($value || '{}') : $value }}" } } },
			},
			{
				displayName: 'External Name',
				name: 'name_external',
				type: 'string',
				default: '',
				description: 'Name on financial documents',
				routing: { request: { body: { name_external: '={{ $value }}' } } },
			},
			{
				displayName: 'Group (Path)',
				name: 'group',
				type: 'string',
				default: '',
				placeholder: '/projectfunctiongroups/0',
				routing: { request: { body: { group: '={{ $value }}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name on packing lists',
				routing: { request: { body: { name: '={{ $value }}' } } },
			},
			{
				displayName: 'Plan Period End',
				name: 'planperiod_end',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { planperiod_end: '={{ $value }}' } } },
			},
			{
				displayName: 'Plan Period Start',
				name: 'planperiod_start',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { planperiod_start: '={{ $value }}' } } },
			},
			{
				displayName: 'Plannable',
				name: 'is_plannable',
				type: 'boolean',
				default: false,
				description: 'Whether crew members scheduled on this shift are shown as available for other functions',
				routing: { request: { body: { is_plannable: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Accommodation',
				name: 'price_accommodation',
				type: 'number',
				default: 0,
				routing: { request: { body: { price_accommodation: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Catering',
				name: 'price_catering',
				type: 'number',
				default: 0,
				routing: { request: { body: { price_catering: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Other',
				name: 'price_other',
				type: 'number',
				default: 0,
				routing: { request: { body: { price_other: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Travel',
				name: 'price_travel',
				type: 'number',
				default: 0,
				routing: { request: { body: { price_travel: '={{ $value }}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Crew Function', value: 'crew_function' },
					{ name: 'Remark', value: 'remark' },
					{ name: 'Shift', value: 'shift' },
					{ name: 'Transport Function', value: 'transport_function' },
				],
				default: 'crew_function',
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Usage Period End',
				name: 'usageperiod_end',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { usageperiod_end: '={{ $value }}' } } },
			},
			{
				displayName: 'Usage Period Start',
				name: 'usageperiod_start',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { usageperiod_start: '={{ $value }}' } } },
			},
		],
	},
]);
export const projectFunctionOperations = projectFunctions.operations;
export const projectFunctionFields = projectFunctions.fields;

const projectTypes = buildReadOnly('projectType', 'projecttypes', 'Project Type');
export const projectTypeOperations = projectTypes.operations;
export const projectTypeFields = projectTypes.fields;

const projectVehicles = buildReadOnly('projectVehicle', 'projectvehicles', 'Project Vehicle');
export const projectVehicleOperations = projectVehicles.operations;
export const projectVehicleFields = projectVehicles.fields;

// ─── RATES & PRICING ─────────────────────────────────────────────────────────

const factorGroups = buildReadOnly('factorGroup', 'factorgroups', 'Factor Group');
export const factorGroupOperations = factorGroups.operations;
export const factorGroupFields = factorGroups.fields;

const factors = buildReadOnly('factor', 'factors', 'Factor');
export const factorOperations = factors.operations;
export const factorFields = factors.fields;

const rates = buildReadOnly('rate', 'rates', 'Rate');
export const rateOperations = rates.operations;
export const rateFields = rates.fields;

const rateFactors = buildReadOnly('rateFactor', 'ratefactors', 'Rate Factor');
export const rateFactorOperations = rateFactors.operations;
export const rateFactorFields = rateFactors.fields;

const taxClasses = buildReadOnly('taxClass', 'taxclasses', 'Tax Class');
export const taxClassOperations = taxClasses.operations;
export const taxClassFields = taxClasses.fields;

const ledgerCodes = buildReadOnly('ledgerCode', 'ledgercodes', 'Ledger Code');
export const ledgerCodeOperations = ledgerCodes.operations;
export const ledgerCodeFields = ledgerCodes.fields;

const crewRates = buildReadOnly('crewRate', 'crewrates', 'Crew Rate');
export const crewRateOperations = crewRates.operations;
export const crewRateFields = crewRates.fields;

// ─── STATUSES ─────────────────────────────────────────────────────────────────

const statuses = buildReadOnly('status', 'statuses', 'Status');
export const statusOperations = statuses.operations;
export const statusFields = statuses.fields;

// API v1.15.0 split project lifecycle statuses (Inquiry, Concept, Option,
// Confirmed) from warehouse statuses (Confirmed, Prepped, On Location, Returned).
const projectStatuses = buildReadOnly('projectStatus', 'projectstatuses', 'Project Status');
export const projectStatusOperations = projectStatuses.operations;
export const projectStatusFields = projectStatuses.fields;

const warehouseStatuses = buildReadOnly('warehouseStatus', 'warehousestatuses', 'Warehouse Status');
export const warehouseStatusOperations = warehouseStatuses.operations;
export const warehouseStatusFields = warehouseStatuses.fields;

// ─── STOCK & LOCATIONS ────────────────────────────────────────────────────────

const stockLocations = buildReadOnly('stockLocation', 'stocklocations', 'Stock Location');
export const stockLocationOperations = stockLocations.operations;
export const stockLocationFields = stockLocations.fields;

// ─── SUB-RENTALS ─────────────────────────────────────────────────────────────

const subRentals = buildReadOnly('subRental', 'subrentals', 'Sub Rental');
export const subRentalOperations = subRentals.operations;
export const subRentalFields = subRentals.fields;

const subRentalEquipment = buildReadOnly('subRentalEquipment', 'subrentalequipment', 'Sub Rental Equipment', [
	{
		displayName: 'Sub Rental Group (Path)',
		name: 'subrentalequipmentgroup',
		type: 'string',
		default: '',
		placeholder: '/subrentalequipmentgroup/42',
		description: 'Filter by sub rental equipment group resource path',
		routing: { request: { qs: { subrental_group: '={{ $value }}' } } },
	},
]);
export const subRentalEquipmentOperations = subRentalEquipment.operations;
export const subRentalEquipmentFields = subRentalEquipment.fields;

const subRentalEquipmentGroup = buildReadOnly('subRentalEquipmentGroup', 'subrentalequipmentgroup', 'Sub Rental Equipment Group', [
	{
		displayName: 'Sub Rental (Path)',
		name: 'subrental',
		type: 'string',
		default: '',
		placeholder: '/subrentals/42',
		description: 'Filter by sub rental resource path',
		routing: { request: { qs: { subrental: '={{ $value }}' } } },
	},
]);
export const subRentalEquipmentGroupOperations = subRentalEquipmentGroup.operations;
export const subRentalEquipmentGroupFields = subRentalEquipmentGroup.fields;

// ─── CREW EXTENDED ────────────────────────────────────────────────────────────

const invitations = buildReadOnly('invitation', 'invitations', 'Invitation');
export const invitationOperations = invitations.operations;
export const invitationFields = invitations.fields;

const timeRegistrationActivities = buildReadOnly('timeRegistrationActivity', 'timeregistrationactivities', 'Time Registration Activity');
export const timeRegistrationActivityOperations = timeRegistrationActivities.operations;
export const timeRegistrationActivityFields = timeRegistrationActivities.fields;

const leavetypes = buildReadOnly('leaveType', 'leavetypes', 'Leave Type');
export const leaveTypeOperations = leavetypes.operations;
export const leaveTypeFields = leavetypes.fields;

// ─── CONTRACTS ───────────────────────────────────────────────────────────────

const contracts = buildReadOnly('contract', 'contracts', 'Contract');
export const contractOperations = contracts.operations;
export const contractFields = contracts.fields;
