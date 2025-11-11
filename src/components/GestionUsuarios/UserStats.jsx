import React from 'react';
import { Users, CheckCircle, XCircle, Building2 } from 'lucide-react';

/**
 * Componente de estadísticas rápidas de usuarios
 */
const UserStats = ({ users }) => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.active).length;
    const inactiveUsers = users.filter(u => !u.active).length;
    const usersWithCompany = users.filter(u => u.empresa_id).length;
    const usersWithoutCompany = users.filter(u => !u.empresa_id).length;

    const stats = [
        {
            icon: Users,
            label: 'Total Usuarios',
            value: totalUsers,
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
            iconColor: 'text-blue-600'
        },
        {
            icon: CheckCircle,
            label: 'Activos',
            value: activeUsers,
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
            iconColor: 'text-green-600'
        },
        {
            icon: XCircle,
            label: 'Inactivos',
            value: inactiveUsers,
            bgColor: 'bg-red-100',
            textColor: 'text-red-600',
            iconColor: 'text-red-600'
        },
        {
            icon: Building2,
            label: 'Con Empresa',
            value: usersWithCompany,
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600',
            iconColor: 'text-purple-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow duration-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium mb-1">
                                {stat.label}
                            </p>
                            <p className={`text-3xl font-bold ${stat.textColor}`}>
                                {stat.value}
                            </p>
                        </div>
                        <div className={`${stat.bgColor} p-3 rounded-full`}>
                            <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UserStats;
