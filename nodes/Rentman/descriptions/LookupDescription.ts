/**
 * Compact read-only descriptions for all remaining Rentman lookup/sub-resources.
 * Each uses the same Get + Get Collection pattern with cursor pagination.
 */
import type { INodeProperties } from 'n8n-workflow';

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
				...extraFilterOptions,
			],
		},
	];

	return { operations, fields };
}

// ─── PROJECT SUB-RESOURCES ────────────────────────────────────────────────────

const projectCrew = buildReadOnly('projectCrew', 'projectcrew', 'Project Crew', [
	{
		displayName: 'Project Function (Path)',
		name: 'projectfunction',
		type: 'string',
		default: '',
		placeholder: '/projectfunctions/42',
		description: 'Filter by project function resource path',
		routing: { request: { qs: { projectfunction: '={{ $value }}' } } },
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
		routing: { request: { qs: { projectequipmentgroup: '={{ $value }}' } } },
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
		routing: { request: { qs: { projectfunctiongroup: '={{ $value }}' } } },
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
		routing: { request: { qs: { subrentalequipmentgroup: '={{ $value }}' } } },
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

// ─── VEHICLES ─────────────────────────────────────────────────────────────────

const vehicles = buildReadOnly('vehicle', 'vehicles', 'Vehicle');
export const vehicleOperations = vehicles.operations;
export const vehicleFields = vehicles.fields;

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
