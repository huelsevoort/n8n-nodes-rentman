import { NodeOperationError } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nRequestOperationPaginationGeneric,
	INodeProperties,
} from 'n8n-workflow';

/**
 * preSend sanitizer: drops query parameters whose key is empty/whitespace.
 *
 * The Custom Query Parameters fixedCollection maps each row to a query param via
 * `property: '={{$parent.key}}'`. A blank row makes the key an empty string, which
 * n8n serializes to a malformed `&=` and the Rentman API rejects with HTTP 400.
 * n8n's declarative `send` mapping has no "skip if key empty" option, so we strip
 * blank-key params here, right before the request is sent.
 */
async function stripBlankQueryKeys(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const qs = requestOptions.qs as Record<string, unknown> | undefined;
	if (qs) {
		for (const key of Object.keys(qs)) {
			if (key.trim() === '') {
				delete qs[key];
			}
		}
	}
	return requestOptions;
}

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?)?$/;

/** Offset of `timeZone` from UTC in minutes at the given wall-clock time. */
function zoneOffsetMinutes(timeZone: string, wallClockAsUtc: number): number {
	const fmt = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
	const offsetAt = (instant: number) => {
		const parts = Object.fromEntries(fmt.formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
		const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
		return Math.round((asUtc - instant) / 60000);
	};
	// Two passes so wall-clock times right after a DST switch resolve to the right offset.
	const first = offsetAt(wallClockAsUtc);
	return offsetAt(wallClockAsUtc - first * 60000);
}

/**
 * Rentman only accepts date-times with a UTC offset (yyyy-MM-dd'T'HH:mm:ssZ) and rejects the
 * zone-less values n8n's date picker produces ("2027-03-01T09:00:00") with HTTP 400. This adds the
 * offset of the workflow's timezone to every zone-less date or date-time in the request body.
 */
export function withUtcOffset(value: string, timeZone: string): string {
	const m = LOCAL_DATE_TIME.exec(value);
	if (!m) return value;
	const [, y, mo, d, h = '00', mi = '00', s = '00', frac = ''] = m;
	let offset = 0;
	try {
		offset = zoneOffsetMinutes(timeZone, Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
	} catch {
		offset = 0;
	}
	const sign = offset < 0 ? '-' : '+';
	const abs = Math.abs(offset);
	const hh = String(Math.floor(abs / 60)).padStart(2, '0');
	const mm = String(abs % 60).padStart(2, '0');
	return `${y}-${mo}-${d}T${h}:${mi}:${s}${frac}${sign}${hh}:${mm}`;
}

/** Request-body keys Rentman parses as date-times (OpenAPI v1.16.0 `format: date-time`, plus the
 * date fields it documents only as strings but returns and validates as date-times). */
const DATE_TIME_KEYS = new Set([
	'completed_at', 'date', 'deadline', 'end', 'expiry_notification_date', 'in', 'inspection_date', 'last_updated',
	'moment', 'mutation_date', 'out', 'planperiod_end', 'planperiod_start', 'purchasedate', 'recureind',
	'recurrence_enddate', 'reviewed_on', 'start', 'usageperiod_end', 'usageperiod_start',
]);

/**
 * Body fields Rentman requires that live in an optional collection (to keep 26.5.0 workflows
 * valid), keyed by resource.operation. Without them Rentman only answers with a bare HTTP 500.
 */
export const REQUIRED_BODY_FIELDS: Record<string, Array<[key: string, label: string]>> = {
	'vehicle.create': [['cost_rate', 'Additional Fields → Cost Rate']],
	'vehicle.createForStockLocation': [['cost_rate', 'Additional Fields → Cost Rate']],
};

async function prepareWriteBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = requestOptions.body as Record<string, unknown> | undefined;
	const required = REQUIRED_BODY_FIELDS[`${this.getNodeParameter('resource')}.${this.getNodeParameter('operation')}`];
	for (const [key, label] of required ?? []) {
		if (body?.[key] === undefined || body[key] === '') {
			throw new NodeOperationError(this.getNode(), `Rentman requires ${label}`, {
				description: `Set ${label}; Rentman rejects the request without it (HTTP 500).`,
			});
		}
	}
	if (body && typeof body === 'object' && !Array.isArray(body)) {
		const timeZone = this.getTimezone();
		for (const [key, value] of Object.entries(body)) {
			if (DATE_TIME_KEYS.has(key) && typeof value === 'string') body[key] = withUtcOffset(value, timeZone);
		}
	}
	// With no optional field filled in, n8n sends no body at all (an empty object is dropped too),
	// which Rentman rejects with "Unknown error parsing request body". A literal "{}" is accepted.
	if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) requestOptions.body = '{}';
	return requestOptions;
}

/**
 * Adds request hooks every write operation needs. Called once on the assembled node properties
 * so no create/update operation can be added without them.
 */
export function withWriteHooks(properties: INodeProperties[]): INodeProperties[] {
	for (const prop of properties) {
		if (prop.name !== 'operation' || prop.type !== 'options') continue;
		for (const option of prop.options ?? []) {
			const op = option as { routing?: NonNullable<INodeProperties['routing']> };
			const method = op.routing?.request?.method;
			if (method !== 'POST' && method !== 'PUT') continue;
			op.routing!.send = { ...op.routing!.send, preSend: [...(op.routing!.send?.preSend ?? []), prepareWriteBody] };
		}
	}
	return properties;
}

/**
 * "Return All" pagination shared by every collection operation.
 *
 * Rentman's next_page_url already carries every filter plus a cursor, and Rentman rejects a cursor
 * combined with sort, limit or offset ("The cursor parameter cannot be combined with sort, limit, or
 * offset"). n8n would re-append the first request's query string to that URL, so follow-up pages
 * are requested with an empty query string.
 */
export const rentmanPagination: IN8nRequestOperationPaginationGeneric = {
	type: 'generic',
	properties: {
		continue: '={{ !!$response.body?.next_page_url && $parameter["returnAll"] }}',
		request: {
			url: '={{ $response.body?.next_page_url ?? $request.url }}',
			// Expression resolves to an object at runtime; the type only models literal objects.
			qs: '={{ $response.body?.next_page_url ? {} : $request.qs }}' as unknown as IDataObject,
		},
	},
};

/**
 * Returns the global "Expand" field (Rentman API v1.13.0).
 *
 * `expand` is a query parameter available on every GET endpoint that inlines
 * linked resources in the response instead of returning a path string. It is
 * scoped here purely by operation value: every read operation in this node uses
 * an operation value beginning with `get`, and no write operation does, so a
 * single field with no resource filter covers all resources at once.
 *
 * Comma-separated list of linkable field names; dot notation for nested
 * expansion up to 3 levels (e.g. `equipment,equipment.creator`). Only `item`/
 * `link` fields are expandable. Since v1.16.0, child fields and custom fields of
 * an item type (`custom_<number>`) are expandable too.
 */
/**
 * Sub-collection getters such as Get Files list other records than the resource itself, so the resource's own
 * filters (e.g. a purchase order's Approval Status) do not apply there and Rentman rejects them with HTTP 400.
 * Keeps the full Filters collection for `operations` and shows a copy without `ownFilters` for the other operations.
 */
export function withOwnFiltersOnly(fields: INodeProperties[], operations: string[], ownFilters: string[]): INodeProperties[] {
	return fields.flatMap((field) => {
		const show = field.displayOptions?.show;
		const shown = show?.operation as string[] | undefined;
		if (field.name !== 'filters' || !show || !shown) return [field];
		const others = shown.filter((op) => !operations.includes(op));
		if (!others.length) return [field];
		return [
			{ ...field, displayOptions: { ...field.displayOptions, show: { ...show, operation: shown.filter((op) => operations.includes(op)) } } },
			{
				...field,
				displayOptions: { ...field.displayOptions, show: { ...show, operation: others } },
				options: (field.options as INodeProperties[]).filter((option) => !ownFilters.includes(option.name)),
			},
		];
	});
}

export function expandField(): INodeProperties {
	return {
		displayName: 'Expand',
		name: 'expand',
		type: 'string',
		default: '',
		placeholder: 'equipment,equipment.creator',
		description:
			'Comma-separated list of linkable fields to inline in the response instead of returning a path. Supports dot notation for nested expansion up to 3 levels (e.g. equipment,equipment.creator). Item, link, child and item-type custom fields (custom_N) can be expanded.',
		displayOptions: {
			show: {
				operation: [
					'get',
					'getAll',
					'getFiles',
					'getFileFolders',
					'getForEquipment',
					'getForParent',
					'getGlobalCosts',
					'getInvoiceLines',
					'getOrderCosts',
					'getSubtasks',
					'getTaskAssignments',
				],
			},
		},
		routing: { request: { qs: { expand: '={{ $value || undefined }}' } } },
	};
}

/**
 * Returns a Custom Query Parameters field for a given resource's GetAll operation.
 * Uses the n8n fixedCollection pattern (like the Brevo node) with `$parent.key`
 * to support dynamic query parameter keys.
 */
export function customQueryParamsField(resource: string): INodeProperties {
	return {
		displayName: 'Custom Query Parameters',
		name: 'customQueryParams',
		type: 'fixedCollection',
		placeholder: 'Add Parameter',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
		default: {},
		typeOptions: { multipleValues: true },
		description: 'Add custom query parameters for field-value filtering (e.g. country=nl), relational operators (e.g. modified[gt]=2024-01-01) or custom fields (e.g. custom_3=value).',
		options: [
			{
				name: 'params',
				displayName: 'Parameter',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						default: '',
						placeholder: 'e.g. country, modified[gt] or custom_3',
						description: 'Query parameter key. Use field[gt] or field[lt] for relational operators.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'e.g. nl or 2024-01-01',
						routing: {
							send: {
								type: 'query',
								property: '={{$parent.key}}',
								value: '={{$value}}',
								propertyInDotNotation: false,
								preSend: [stripBlankQueryKeys],
							},
						},
					},
				],
			},
		],
	};
}
