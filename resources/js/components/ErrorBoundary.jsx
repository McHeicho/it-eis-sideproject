import React from "react";
import { Button } from "@/components/ui/custom/custom-button";

// Catches render errors below it so one broken page does not blank the whole
// app (blueprint A-13). A class component: React has no hook equivalent.
// The console.error here is deliberate — it is the only place a render
// error is logged, and the user still sees a message.
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Unhandled render error:", error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="p-6 text-sm text-gray-600">
                    <p className="font-medium text-gray-800">
                        Something went wrong on this page.
                    </p>
                    <p className="mt-1">
                        Reload to continue. If it keeps happening, tell IT what
                        you were doing when it broke.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => window.location.reload()}
                    >
                        Reload
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
