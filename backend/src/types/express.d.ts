import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                organizationId: string;
                [key: string]: any;
            };
            requestId?: string;
        }
    }
}
