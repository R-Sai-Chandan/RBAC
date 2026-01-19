
import { IUserRepository } from '../repositories/user.repository';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/crypto.utils';

export interface IUserService {
    list(organizationId: string, filters?: any): Promise<User[]>;
    getById(organizationId: string, id: string): Promise<User | null>;
    create(organizationId: string, data: any): Promise<User>;
    update(organizationId: string, id: string, data: any): Promise<User>;
    delete(organizationId: string, id: string): Promise<void>; // Soft delete
}

export class UserService implements IUserService {
    constructor(private userRepository: IUserRepository) { }

    async list(organizationId: string, filters?: any): Promise<User[]> {
        // Assume repo supports filtering
        return this.userRepository.findAll(organizationId, filters);
    }

    async getById(organizationId: string, id: string): Promise<User | null> {
        return this.userRepository.findById(organizationId, id);
    }

    async create(organizationId: string, data: any): Promise<User> {
        // Hash password if provided
        if (data.password) {
            data.password_hash = await hashPassword(data.password);
            delete data.password;
        }

        // Ensure organizationId is set
        data.organization_id = organizationId;

        return this.userRepository.create(organizationId, data);
    }

    async update(organizationId: string, id: string, data: any): Promise<User> {
        if (data.password) {
            data.password_hash = await hashPassword(data.password);
            delete data.password;
        }
        return this.userRepository.update(organizationId, id, data);
    }

    async delete(organizationId: string, id: string): Promise<void> {
        return this.userRepository.delete(organizationId, id);
    }
}
