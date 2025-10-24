/**
 * MCP Tools for User Management Operations
 * These tools provide secure access to user management functionality
 * WITHOUT exposing authentication operations like login/register
 */
import { Role } from '../generated/prisma/index.js';
import { userService } from '../services/index.ts';
import { McpError, Tool } from '@modelcontextprotocol/sdk/types.js';

interface UserManagementContext {
    userId?: number;
    userRole?: Role;
}

/**
 * Get user profile information
 */
export const getUserProfileTool: Tool = {
    name: 'get_user_profile',
    description: 'Get detailed user profile information by user ID',
    inputSchema: {
        type: 'object',
        properties: {
            userId: {
                type: 'number',
                description: 'The ID of the user to retrieve'
            }
        },
        required: ['userId']
    }
};

export async function handleGetUserProfile(args: { userId: number }, context: UserManagementContext): Promise<any> {
    try {
        // Only allow users to view their own profile or admins to view any profile
        if (context.userRole !== Role.ADMIN && context.userId !== args.userId) {
            throw new McpError(-32403, 'Insufficient permissions to view this user profile');
        }

        const user = await userService.getUserById(args.userId, [
            'id',
            'email',
            'name',
            'role',
            'isEmailVerified',
            'createdAt',
            'updatedAt'
        ]);

        if (!user) {
            throw new McpError(-32404, 'User not found');
        }

        return {
            success: true,
            user: user
        };
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(
            -32500,
            `Failed to get user profile: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * List users with pagination and filtering
 */
export const listUsersTool: Tool = {
    name: 'list_users',
    description: 'List users with pagination and filtering (admin only)',
    inputSchema: {
        type: 'object',
        properties: {
            page: {
                type: 'number',
                description: 'Page number (default: 1)',
                minimum: 1
            },
            limit: {
                type: 'number',
                description: 'Number of users per page (default: 10, max: 100)',
                minimum: 1,
                maximum: 100
            },
            role: {
                type: 'string',
                enum: ['USER', 'ADMIN'],
                description: 'Filter by user role'
            },
            sortBy: {
                type: 'string',
                enum: ['createdAt', 'email', 'name', 'role'],
                description: 'Field to sort by'
            },
            sortType: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'Sort direction (default: desc)'
            }
        }
    }
};

export async function handleListUsers(
    args: {
        page?: number;
        limit?: number;
        role?: Role;
        sortBy?: string;
        sortType?: 'asc' | 'desc';
    },
    context: UserManagementContext
): Promise<any> {
    try {
        // Only admins can list users
        if (context.userRole !== Role.ADMIN) {
            throw new McpError(-32403, 'Admin privileges required to list users');
        }

        const filter: any = {};
        if (args.role) {
            filter.role = args.role;
        }

        const options = {
            page: args.page || 1,
            limit: Math.min(args.limit || 10, 100),
            sortBy: args.sortBy || 'createdAt',
            sortType: args.sortType || 'desc'
        };

        const users = await userService.queryUsers(filter, options, [
            'id',
            'email',
            'name',
            'role',
            'isEmailVerified',
            'createdAt',
            'updatedAt'
        ]);

        return {
            success: true,
            users: users,
            pagination: {
                page: options.page,
                limit: options.limit,
                total: users.length
            }
        };
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(-32500, `Failed to list users: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Update user profile information
 */
export const updateUserProfileTool: Tool = {
    name: 'update_user_profile',
    description: 'Update user profile information',
    inputSchema: {
        type: 'object',
        properties: {
            userId: {
                type: 'number',
                description: 'The ID of the user to update'
            },
            name: {
                type: 'string',
                description: 'New name for the user'
            },
            email: {
                type: 'string',
                format: 'email',
                description: 'New email for the user'
            }
        },
        required: ['userId'],
        additionalProperties: false
    }
};

export async function handleUpdateUserProfile(
    args: {
        userId: number;
        name?: string;
        email?: string;
    },
    context: UserManagementContext
): Promise<any> {
    try {
        // Only allow users to update their own profile or admins to update any profile
        if (context.userRole !== Role.ADMIN && context.userId !== args.userId) {
            throw new McpError(-32403, 'Insufficient permissions to update this user profile');
        }

        const updateData: any = {};
        if (args.name !== undefined) {
            updateData.name = args.name;
        }
        if (args.email !== undefined) {
            updateData.email = args.email;
        }

        if (Object.keys(updateData).length === 0) {
            throw new McpError(-32400, 'No update data provided');
        }

        const updatedUser = await userService.updateUserById(args.userId, updateData, [
            'id',
            'email',
            'name',
            'role',
            'isEmailVerified',
            'createdAt',
            'updatedAt'
        ]);

        return {
            success: true,
            user: updatedUser
        };
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(
            -32500,
            `Failed to update user profile: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Delete user account (admin only)
 */
export const deleteUserTool: Tool = {
    name: 'delete_user',
    description: 'Delete a user account (admin only)',
    inputSchema: {
        type: 'object',
        properties: {
            userId: {
                type: 'number',
                description: 'The ID of the user to delete'
            }
        },
        required: ['userId']
    }
};

export async function handleDeleteUser(args: { userId: number }, context: UserManagementContext): Promise<any> {
    try {
        // Only admins can delete users
        if (context.userRole !== Role.ADMIN) {
            throw new McpError(-32403, 'Admin privileges required to delete users');
        }

        // Prevent admins from deleting themselves
        if (context.userId === args.userId) {
            throw new McpError(-32400, 'Cannot delete your own account');
        }

        await userService.deleteUserById(args.userId);

        return {
            success: true,
            message: 'User account deleted successfully'
        };
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(-32500, `Failed to delete user: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Create new user account (admin only)
 */
export const createUserTool: Tool = {
    name: 'create_user',
    description: 'Create a new user account (admin only)',
    inputSchema: {
        type: 'object',
        properties: {
            email: {
                type: 'string',
                format: 'email',
                description: 'Email address for the new user'
            },
            name: {
                type: 'string',
                description: 'Name for the new user'
            },
            password: {
                type: 'string',
                description: 'Password for the new user (min 8 chars, must contain letter and number)',
                minLength: 8
            },
            role: {
                type: 'string',
                enum: ['USER', 'ADMIN'],
                description: 'Role for the new user (default: USER)'
            }
        },
        required: ['email', 'password'],
        additionalProperties: false
    }
};

export async function handleCreateUser(
    args: {
        email: string;
        name?: string;
        password: string;
        role?: Role;
    },
    context: UserManagementContext
): Promise<any> {
    try {
        // Only admins can create users
        if (context.userRole !== Role.ADMIN) {
            throw new McpError(-32403, 'Admin privileges required to create users');
        }

        // Validate password strength
        if (args.password.length < 8) {
            throw new McpError(-32400, 'Password must be at least 8 characters long');
        }
        if (!/[a-zA-Z]/.test(args.password)) {
            throw new McpError(-32400, 'Password must contain at least one letter');
        }
        if (!/\d/.test(args.password)) {
            throw new McpError(-32400, 'Password must contain at least one number');
        }

        const newUser = await userService.createUser(args.email, args.password, args.name, args.role || Role.USER);

        // Don't return the password
        const { password, ...userWithoutPassword } = newUser;

        return {
            success: true,
            user: userWithoutPassword
        };
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(-32500, `Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Get current user info (self)
 */
export const getCurrentUserTool: Tool = {
    name: 'get_current_user',
    description: 'Get current authenticated user information',
    inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
    }
};

export async function handleGetCurrentUser(args: {}, context: UserManagementContext): Promise<any> {
    try {
        if (!context.userId) {
            throw new McpError(-32401, 'Authentication required');
        }

        const user = await userService.getUserById(context.userId, [
            'id',
            'email',
            'name',
            'role',
            'isEmailVerified',
            'createdAt',
            'updatedAt'
        ]);

        if (!user) {
            throw new McpError(-32404, 'User not found');
        }

        return {
            success: true,
            user: user
        };
    } catch (error) {
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(
            -32500,
            `Failed to get current user: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

// Export all tools and handlers
export const userManagementTools: Tool[] = [
    getUserProfileTool,
    listUsersTool,
    updateUserProfileTool,
    deleteUserTool,
    createUserTool,
    getCurrentUserTool
];

export const userManagementHandlers = {
    get_user_profile: handleGetUserProfile,
    list_users: handleListUsers,
    update_user_profile: handleUpdateUserProfile,
    delete_user: handleDeleteUser,
    create_user: handleCreateUser,
    get_current_user: handleGetCurrentUser
};
