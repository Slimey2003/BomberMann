import KeycloakAuth from "../auth/KeycloakAuth";

export default class KeycloakService {
    private baseUrl: string;
    private realm: string;
    private auth: KeycloakAuth;
    private adminUsername: string;
    private adminPassword: string;

    constructor(baseUrl: string, realm: string, adminUsername: string, adminPassword: string) {
        this.baseUrl = baseUrl;
        this.realm = realm;
        this.auth = new KeycloakAuth(this.baseUrl + "/realms/" + this.realm);
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    public getAuth(): KeycloakAuth {
        return this.auth;
    }

    public async getAdminToken(): Promise<string> {
        const params = new URLSearchParams();
        params.append('client_id', 'admin-cli');
        params.append('grant_type', 'password');
        params.append('username', this.adminUsername);
        params.append('password', this.adminPassword);
        
        const response = await fetch(`${this.baseUrl}/realms/master/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error('Admin token fetch failed');
        }

        const data = await response.json();
        return data.access_token;
    }

    public async createUser(username: string, email: string, password: string): Promise<boolean> {
        try {
            const token = await this.getAdminToken();

            const userData = {
                username: username,
                email: email,
                firstName: username,
                lastName: username,
                enabled: true,
                emailVerified: true,
                requiredActions: [],
                credentials: [
                    {
                        type: 'password',
                        value: password,
                        temporary: false
                    }
                ]
            };

            const response = await fetch(`${this.baseUrl}/admin/realms/${this.realm}/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            return response.status === 201;
        } catch (e) {
            console.log(e);
        }
        return false;

    }
}