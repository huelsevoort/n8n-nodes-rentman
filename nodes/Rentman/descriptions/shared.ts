import type { INodeProperties } from 'n8n-workflow';

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
							},
						},
					},
				],
			},
		],
	};
}
