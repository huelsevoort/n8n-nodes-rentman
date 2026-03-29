import { NodeConnectionType } from 'n8n-workflow';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

import {
	appointmentFields,
	appointmentOperations,
	contactFields,
	contactOperations,
	crewFields,
	crewOperations,
	equipmentFields,
	equipmentOperations,
	invoiceFields,
	invoiceOperations,
	projectFields,
	projectOperations,
	quoteFields,
	quoteOperations,
	stockMovementFields,
	stockMovementOperations,
	subprojectFields,
	subprojectOperations,
	timeRegistrationFields,
	timeRegistrationOperations,
} from './descriptions';

export class Rentman implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Rentman',
		name: 'rentman',
		icon: 'file:rentman.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Rentman rental management API',
		defaults: {
			name: 'Rentman',
		},
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'rentmanApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.rentman.net',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// ─── RESOURCE SELECTOR ───────────────────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Appointment',
						value: 'appointment',
						description: 'Manage appointments and calendar events',
					},
					{
						name: 'Contact',
						value: 'contact',
						description: 'Manage customers, suppliers and other contacts',
					},
					{
						name: 'Crew',
						value: 'crew',
						description: 'View crew members and their details',
					},
					{
						name: 'Equipment',
						value: 'equipment',
						description: 'View equipment inventory',
					},
					{
						name: 'Invoice',
						value: 'invoice',
						description: 'View invoices',
					},
					{
						name: 'Project',
						value: 'project',
						description: 'Manage rental projects',
					},
					{
						name: 'Quote',
						value: 'quote',
						description: 'View quotes',
					},
					{
						name: 'Stock Movement',
						value: 'stockMovement',
						description: 'Track stock movements and adjustments',
					},
					{
						name: 'Subproject',
						value: 'subproject',
						description: 'View project subprojects (planning periods)',
					},
					{
						name: 'Time Registration',
						value: 'timeRegistration',
						description: 'Manage crew time registrations',
					},
				],
				default: 'contact',
			},

			// ─── APPOINTMENT ─────────────────────────────────────────────────
			...appointmentOperations,
			...appointmentFields,

			// ─── CONTACT ─────────────────────────────────────────────────────
			...contactOperations,
			...contactFields,

			// ─── CREW ────────────────────────────────────────────────────────
			...crewOperations,
			...crewFields,

			// ─── EQUIPMENT ───────────────────────────────────────────────────
			...equipmentOperations,
			...equipmentFields,

			// ─── INVOICE ─────────────────────────────────────────────────────
			...invoiceOperations,
			...invoiceFields,

			// ─── PROJECT ─────────────────────────────────────────────────────
			...projectOperations,
			...projectFields,

			// ─── QUOTE ───────────────────────────────────────────────────────
			...quoteOperations,
			...quoteFields,

			// ─── STOCK MOVEMENT ──────────────────────────────────────────────
			...stockMovementOperations,
			...stockMovementFields,

			// ─── SUBPROJECT ──────────────────────────────────────────────────
			...subprojectOperations,
			...subprojectFields,

			// ─── TIME REGISTRATION ───────────────────────────────────────────
			...timeRegistrationOperations,
			...timeRegistrationFields,
		],
	};
}
