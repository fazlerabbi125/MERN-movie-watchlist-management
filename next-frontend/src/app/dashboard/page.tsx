import { getCurrentUser, isAuthenticated } from "@/lib/server-actions";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage() {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        redirect("/login");
    }

    const user = await getCurrentUser();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Welcome to your Dashboard!
                            </h1>

                            {user && (
                                <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                                    <div className="flex items-center space-x-4">
                                        {user.avatar && (
                                            <img
                                                className="w-12 h-12 rounded-full"
                                                src={user.avatar}
                                                alt={`${user.first_name} ${user.last_name}`}
                                            />
                                        )}
                                        <div className="text-left">
                                            <h2 className="text-lg font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </h2>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                            <p className="text-xs text-gray-400">
                                                Role: {user.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
