import { Role } from '../generated/prisma/index.js';

const allRoles = {
    [Role.USER]: ['getFiles', 'manageFiles'],
    [Role.ADMIN]: ['getUsers', 'manageUsers', 'getFiles', 'manageFiles']
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
