import React from "react";
import { usePermissions } from "./usePermissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function PermissionGuard({ resource, action, children, fallback = null, showMessage = false }) {
    const { can, isLoading } = usePermissions();

    if (isLoading) {
        return null;
    }

    if (!can(resource, action)) {
        if (showMessage) {
            return (
                <Alert variant="destructive" className="my-4">
                    <Lock className="w-4 h-4" />
                    <AlertDescription>
                        You don't have permission to {action} {resource}.
                    </AlertDescription>
                </Alert>
            );
        }
        return fallback;
    }

    return <>{children}</>;
}