import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return Response.json({ error: 'userId is required' }, { status: 400 });
        }

        // Fetch the user to check their role
        const targetUser = await base44.asServiceRole.entities.User.get(userId);
        
        if (!targetUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Only set default permissions for 'user' role
        if (targetUser.role !== 'user') {
            return Response.json({ 
                success: true, 
                message: 'User role is not "user", no default permissions applied',
                userId: userId,
                role: targetUser.role
            });
        }

        // Define default permissions for new users
        const defaultPermissions = {
            home: { actions: ['view'] },
            procedures: { actions: ['view'] },
            labTests: { actions: ['view', 'create'] },
            medicationCalculator: { actions: ['view', 'use'] },
            library: { actions: ['view', 'create', 'edit', 'delete'] },
            formTemplates: { actions: ['view', 'create', 'edit', 'delete'] },
            clinicDirectory: { actions: ['view', 'create', 'edit', 'delete'] },
        };

        // Update user with default permissions
        await base44.asServiceRole.entities.User.update(userId, {
            page_permissions: JSON.stringify(defaultPermissions)
        });

        return Response.json({
            success: true,
            message: 'Default permissions assigned successfully',
            userId: userId,
            permissions: defaultPermissions
        });
    } catch (error) {
        console.error('Error setting default permissions:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});