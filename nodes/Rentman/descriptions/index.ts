// ─── EXISTING RESOURCES ───────────────────────────────────────────────────────
export { appointmentOperations, appointmentFields } from './AppointmentDescription';
export { contactOperations, contactFields } from './ContactDescription';
export { crewOperations, crewFields } from './CrewDescription';
export { equipmentOperations, equipmentFields } from './EquipmentDescription';
export { invoiceOperations, invoiceFields } from './InvoiceDescription';
export { projectOperations, projectFields } from './ProjectDescription';
export { quoteOperations, quoteFields } from './QuoteDescription';
export { stockMovementOperations, stockMovementFields } from './StockMovementDescription';
export { subprojectOperations, subprojectFields } from './SubprojectDescription';
export { timeRegistrationOperations, timeRegistrationFields } from './TimeRegistrationDescription';

// ─── NEW: CONTACTS ────────────────────────────────────────────────────────────
export { contactPersonOperations, contactPersonFields } from './ContactPersonDescription';

// ─── NEW: CREW & SCHEDULING ───────────────────────────────────────────────────
export { appointmentCrewOperations, appointmentCrewFields } from './AppointmentCrewDescription';
export { crewAvailabilityOperations, crewAvailabilityFields } from './CrewAvailabilityDescription';
export {
	leaveMutationOperations, leaveMutationFields,
	leaveRequestOperations, leaveRequestFields,
} from './LeaveDescription';

// ─── NEW: PROJECTS & REQUESTS ─────────────────────────────────────────────────
export {
	projectRequestOperations, projectRequestFields,
	projectRequestEquipmentOperations, projectRequestEquipmentFields,
} from './ProjectRequestDescription';

// ─── NEW: FINANCIAL ───────────────────────────────────────────────────────────
export { costOperations, costFields } from './CostDescription';
export { paymentOperations, paymentFields } from './PaymentDescription';
export { invoiceLineOperations, invoiceLineFields } from './InvoiceLineDescription';

// ─── NEW: EQUIPMENT EXTENDED ──────────────────────────────────────────────────
export {
	accessoryOperations, accessoryFields,
	actualContentOperations, actualContentFields,
	equipmentAssignedSerialOperations, equipmentAssignedSerialFields,
	equipmentSetsContentOperations, equipmentSetsContentFields,
	repairOperations, repairFields,
	serialNumberOperations, serialNumberFields,
} from './EquipmentExtendedDescription';

// ─── NEW: FILES ───────────────────────────────────────────────────────────────
export {
	fileOperations, fileFields,
	fileFolderOperations, fileFolderFields,
	folderOperations, folderFields,
} from './FileDescription';

// ─── NEW: LOOKUP / READ-ONLY ──────────────────────────────────────────────────
export {
	// Project sub-resources
	projectCrewOperations, projectCrewFields,
	projectEquipmentOperations, projectEquipmentFields,
	projectEquipmentGroupOperations, projectEquipmentGroupFields,
	projectFunctionGroupOperations, projectFunctionGroupFields,
	projectFunctionOperations, projectFunctionFields,
	projectTypeOperations, projectTypeFields,
	projectVehicleOperations, projectVehicleFields,
	// Rates & pricing
	factorGroupOperations, factorGroupFields,
	factorOperations, factorFields,
	rateOperations, rateFields,
	rateFactorOperations, rateFactorFields,
	taxClassOperations, taxClassFields,
	ledgerCodeOperations, ledgerCodeFields,
	crewRateOperations, crewRateFields,
	// Status
	statusOperations, statusFields,
	// Stock & locations
	stockLocationOperations, stockLocationFields,
	// Sub-rentals
	subRentalOperations, subRentalFields,
	subRentalEquipmentOperations, subRentalEquipmentFields,
	subRentalEquipmentGroupOperations, subRentalEquipmentGroupFields,
	// Vehicles
	vehicleOperations, vehicleFields,
	// Crew extended
	invitationOperations, invitationFields,
	timeRegistrationActivityOperations, timeRegistrationActivityFields,
	leaveTypeOperations, leaveTypeFields,
	// Contracts
	contractOperations, contractFields,
} from './LookupDescription';
