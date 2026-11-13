import type { INodeProperties } from 'n8n-workflow';

/** Workspace information (API v1.20.0): one record, no ID, no list. */
export const workspaceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['workspace'] } },
		options: [
			{
				name: 'Get Info',
				value: 'getInfo',
				action: 'Get workspace information',
				description:
					'Get the name, country, language, time zone, currency and measurement units of the workspace (API v1.20.0). Rentman may add properties over time.',
				routing: {
					request: { method: 'GET', url: '/workspace/:getInfo' },
					output: { postReceive: [{ type: 'rootProperty', properties: { property: 'data' } }] },
				},
			},
		],
		default: 'getInfo',
	},
];

export const workspaceFields: INodeProperties[] = [];
