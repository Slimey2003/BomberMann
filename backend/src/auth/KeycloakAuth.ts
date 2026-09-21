import jwt, { type JwtHeader, type JwtPayload, type SigningKeyCallback } from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

export default class KeycloakAuth {
    private realmUrl: string;
    private client: JwksClient;

    constructor(realmUrl: string) {
        this.realmUrl = realmUrl;
        this.client = new JwksClient({
            jwksUri: this.realmUrl + '/protocol/openid-connect/certs'
        });
    }

    private getKey = async (header: JwtHeader, callback: SigningKeyCallback) => {
        if (!header.kid) {
            callback(new Error('Missing kid in token header'), undefined);
            return;
        }

        this.client.getSigningKey(header.kid, (error, key) => {
            if (error) {
                callback(error, undefined);
                return;
            }
            
            if (key) {
                const signingKey = key.getPublicKey();
                callback(null, signingKey);
            }
        });
    }

    public verifyToken(token: string): Promise<string | JwtPayload | undefined> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.getKey, { algorithms: ['RS256'] }, (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(decoded);
            });
        });
    }
}