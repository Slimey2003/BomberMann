export class AuthService {
    private testing: boolean;

    private readonly baseUrl: string;
    private clientId: string;
    private realm: string;
    private backendPort: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.testing = import.meta.env.VITE_IS_DEV;
        this.clientId = import.meta.env.VITE_KC_GAME_ID;
        this.realm = import.meta.env.VITE_KC_REALM;
        this.backendPort = import.meta.env.VITE_GAME_PORT;
    }

    public async login(username: string, password: string): Promise<void> {
        const params = new URLSearchParams();
        params.append('client_id', this.clientId);
        params.append('grant_type', 'password');
        params.append('username', username);
        params.append('password', password);

        const response = await fetch(`${this.baseUrl}:8080/realms/${this.realm}/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error_description || errorData.error);
        }

        const data = await response.json();
        this.saveTokens(data.access_token, data.refresh_token);
    }

    public async register(username: string, email: string, password: string): Promise<boolean> {
        const response = await fetch(`${this.baseUrl}:${this.backendPort}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        return response.ok;
    }

    private saveTokens(accessToken: string, refreshToken: string): void {
        this.setItem('jwt_token', accessToken, this.testing);
        this.setItem('refresh_token', refreshToken, this.testing);
    }

    public async getToken(): Promise<string | null> {
        if (this.isTokenExpired('jwt_token')) {
            const refreshed = await this.refreshToken();
            if (!refreshed) {
                this.clearTokens();
                return null;
            }
        }
        return this.getItem('jwt_token');
    }

    public clearTokens(): void {
        this.removeItem('jwt_token');
        this.removeItem('refresh_token');
    }

    private isTokenExpired(tokenKey: string): boolean {
        const token = this.getItem(tokenKey);
        if (!token) {
            return true;
        }

        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();

        return currentTime >= expirationTime;
    }

    private async refreshToken(): Promise<boolean> {
        const refreshToken = this.getItem('refresh_token');
        
        if (!refreshToken || this.isTokenExpired('refresh_token')) {
            return false;
        }

        const params = new URLSearchParams();
        params.append('client_id', this.clientId);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);

        try {
            const response = await fetch(`${this.baseUrl}:8080/realms/${this.realm}/protocol/openid-connect/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            this.saveTokens(data.access_token, data.refresh_token);
            return true;
        } catch (error) {
            return false;
        }
    }

    public async getAuthHeaders(): Promise<HeadersInit> {
        const token = await this.getToken();
        
        if (token) {
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        }
        
        return {
            'Content-Type': 'application/json'
        };
    }

    public getItem(name: string) {
        return localStorage.getItem(name) ?? sessionStorage.getItem(name);
    }

    public setItem(name: string, value: string, isSession: boolean) {
        if (isSession) {
            sessionStorage.setItem(name, value);
        }
    }

    public removeItem(name: string) {
        sessionStorage.removeItem(name);
        localStorage.removeItem(name);
    }
}