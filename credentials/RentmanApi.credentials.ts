import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RentmanApi implements ICredentialType {
	name = 'rentmanApi';

	displayName = 'Rentman API';

	documentationUrl = 'https://api.rentman.net/#section/Authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'JWT token generated in the Rentman app under Configuration > Integrations. Regenerating a token invalidates the previous one.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.rentman.net',
			url: '/contacts',
			method: 'GET',
			qs: {
				limit: 1,
			},
		},
	};
}
