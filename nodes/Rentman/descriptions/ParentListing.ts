/**
 * "Get For Parent" operations for the Rentman sub-collection endpoints GET /{parent}/{ID}/{collection}
 * (e.g. GET /projects/42/projectcrew). They are added to each child resource by `withParentListings`,
 * which reuses the resource's Get Collection fields (Return All, Limit, Offset, Filters, Custom Query
 * Parameters) for the new operation.
 */
import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const parentNames = {
	appointments: 'Appointment',
	contactpersons: 'Contact Person',
	contacts: 'Contact',
	contracts: 'Contract',
	crew: 'Crew Member',
	equipment: 'Equipment',
	factorgroups: 'Factor Group',
	invoices: 'Invoice',
	leaverequest: 'Leave Request',
	projectequipmentgroup: 'Project Equipment Group',
	projectfunctiongroups: 'Project Function Group',
	projectfunctions: 'Project Function',
	projectrequests: 'Project Request',
	projects: 'Project',
	purchaseorders: 'Purchase Order',
	quotes: 'Quote',
	rates: 'Rate',
	repairs: 'Repair',
	serialnumbers: 'Serial Number',
	stocklocations: 'Stock Location',
	subprojects: 'Subproject',
	subrentalequipmentgroup: 'Sub Rental Equipment Group',
	subrentals: 'Sub Rental',
	suppliers: 'Supplier',
	tasks: 'Task',
	timeregistration: 'Time Registration',
	vehicles: 'Vehicle',
};
type Parent = keyof typeof parentNames;

/** Per node resource: the API collection and every parent type the API lists it under (Rentman API v1.16.0). */
export const parentListings: Record<string, { collection: string; parents: Parent[] }> = {
	accessory: { collection: 'accessories', parents: ['equipment'] },
	actualContent: { collection: 'actualcontent', parents: ['serialnumbers'] },
	appointment: { collection: 'appointments', parents: ['crew'] },
	appointmentCrew: { collection: 'appointmentcrew', parents: ['appointments'] },
	contactPerson: { collection: 'contactpersons', parents: ['contacts'] },
	contract: { collection: 'contracts', parents: ['projects'] },
	cost: { collection: 'costs', parents: ['projects'] },
	crewAvailability: { collection: 'crewavailability', parents: ['crew'] },
	crewRate: { collection: 'crewrates', parents: ['crew'] },
	equipmentAssignedSerial: { collection: 'equipmentassignedserials', parents: ['serialnumbers'] },
	equipmentSetsContent: { collection: 'equipmentsetscontent', parents: ['equipment'] },
	factor: { collection: 'factors', parents: ['factorgroups'] },
	file: {
		collection: 'files',
		parents: [
			'contactpersons',
			'contacts',
			'contracts',
			'crew',
			'equipment',
			'invoices',
			'projects',
			'purchaseorders',
			'quotes',
			'repairs',
			'serialnumbers',
			'subrentals',
			'suppliers',
			'tasks',
			'timeregistration',
			'vehicles',
		],
	},
	fileFolder: {
		collection: 'file_folders',
		parents: [
			'contactpersons',
			'contacts',
			'crew',
			'equipment',
			'projects',
			'purchaseorders',
			'repairs',
			'serialnumbers',
			'subprojects',
			'subrentals',
			'suppliers',
			'tasks',
			'vehicles',
		],
	},
	invitation: { collection: 'invitations', parents: ['crew'] },
	invoiceLine: { collection: 'invoicelines', parents: ['contracts', 'invoices', 'purchaseorders', 'quotes'] },
	payment: { collection: 'payments', parents: ['invoices'] },
	projectCrew: { collection: 'projectcrew', parents: ['projectfunctions', 'projects', 'subprojects'] },
	projectEquipment: { collection: 'projectequipment', parents: ['projectequipmentgroup', 'projects', 'subprojects'] },
	projectEquipmentGroup: { collection: 'projectequipmentgroup', parents: ['projects', 'subprojects'] },
	projectFunction: { collection: 'projectfunctions', parents: ['projectfunctiongroups', 'projects'] },
	projectFunctionGroup: { collection: 'projectfunctiongroups', parents: ['projects', 'subprojects'] },
	projectRequestEquipment: { collection: 'projectrequestequipment', parents: ['projectrequests'] },
	projectVehicle: { collection: 'projectvehicles', parents: ['projectfunctions', 'projects', 'subprojects'] },
	quote: { collection: 'quotes', parents: ['projects'] },
	rateFactor: { collection: 'ratefactors', parents: ['rates'] },
	repair: { collection: 'repairs', parents: ['equipment'] },
	serialNumber: { collection: 'serialnumbers', parents: ['equipment'] },
	stockMovement: { collection: 'stockmovements', parents: ['equipment'] },
	subRentalEquipment: { collection: 'subrentalequipment', parents: ['subrentalequipmentgroup', 'subrentals'] },
	subRentalEquipmentGroup: { collection: 'subrentalequipmentgroup', parents: ['subrentals'] },
	subproject: { collection: 'subprojects', parents: ['projects'] },
	timeRegistration: { collection: 'timeregistration', parents: ['leaverequest'] },
	timeRegistrationActivity: { collection: 'timeregistrationactivities', parents: ['timeregistration'] },
	vehicle: { collection: 'vehicles', parents: ['stocklocations'] },
};

const postReceive = [{ type: 'rootProperty' as const, properties: { property: 'data' } }];

function parentFields(resource: string, collection: string, parents: Parent[]): INodeProperties[] {
	const show = { resource: [resource], operation: ['getForParent'] };
	return [
		// eslint-disable-next-line n8n-nodes-base/node-param-default-missing -- default is the first parent type
		{
			displayName: 'Parent Resource',
			name: 'parentResource',
			type: 'options',
			required: true,
			displayOptions: { show },
			options: parents
				.map((value) => ({ name: parentNames[value], value }))
				.sort((a, b) => a.name.localeCompare(b.name)),
			default: parents[0],
			description: 'The type of record the entries belong to',
		},
		{
			displayName: 'Parent ID',
			name: 'parentId',
			type: 'string',
			required: true,
			displayOptions: { show },
			default: '',
			description: 'The ID of the parent record',
			routing: { request: { url: `=/{{$parameter["parentResource"]}}/{{$value}}/${collection}` } },
		},
	];
}

/**
 * Adds a "Get For Parent" operation to every resource in `parentListings` and shows the resource's
 * Get Collection fields for it as well.
 */
export function withParentListings(properties: INodeProperties[]): INodeProperties[] {
	const resourceNames = new Map(
		(properties.find((p) => p.name === 'resource')?.options as INodePropertyOptions[] | undefined)?.map((o) => [
			o.value,
			o.name,
		]) ?? [],
	);
	const out: INodeProperties[] = [];
	for (const property of properties) {
		const show = property.displayOptions?.show;
		const resources = show?.resource as string[] | undefined;
		const listing = resources?.length === 1 ? parentListings[resources[0]] : undefined;
		if (!listing || !show) {
			out.push(property);
			continue;
		}
		const resource = resources![0];
		if (property.name === 'operation' && property.type === 'options') {
			const label = resourceNames.get(resource) ?? resource;
			const getForParent: INodePropertyOptions = {
				name: 'Get For Parent',
				value: 'getForParent',
				action: `Get ${label.toLowerCase()} records of a parent`,
				description: `Get the ${label.toLowerCase()} records of a parent record (GET /{parent}/{ID}/${listing.collection})`,
				routing: { request: { method: 'GET' }, output: { postReceive } },
			};
			const options = [...((property.options as INodePropertyOptions[]) ?? []), getForParent].sort((a, b) =>
				a.name.localeCompare(b.name),
			);
			out.push({ ...property, options }, ...parentFields(resource, listing.collection, listing.parents));
			continue;
		}
		const operations = show.operation as string[] | undefined;
		if (operations?.includes('getAll')) {
			out.push({
				...property,
				displayOptions: { ...property.displayOptions, show: { ...show, operation: [...operations, 'getForParent'] } },
			});
			continue;
		}
		out.push(property);
	}
	return out;
}
