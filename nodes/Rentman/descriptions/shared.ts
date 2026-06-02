import type { IExecuteSingleFunctions, IHttpRequestOptions, INodeProperties } from 'n8n-workflow';

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
 * `link` fields are expandable.
 */
export function expandField(): INodeProperties {
	return {
		displayName: 'Expand',
		name: 'expand',
		type: 'string',
		default: '',
		placeholder: 'equipment,equipment.creator',
		description:
			'Comma-separated list of linkable fields to inline in the response instead of returning a path. Supports dot notation for nested expansion up to 3 levels (e.g. equipment,equipment.creator). Only item/link fields can be expanded.',
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
		description: 'Add custom query parameters for field-value filtering (e.g. country=nl) or relational operators (e.g. modified[gt]=2024-01-01).',
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
						placeholder: 'e.g. country or modified[gt]',
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
