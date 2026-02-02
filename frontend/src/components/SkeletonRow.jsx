import React from 'react';

const SkeletonRow = () => {
    return (
        <tr className="animate-pulse border-b border-gray-100 dark:border-gray-800">
            {/* Avatar & Name */}
            <td className="px-6 py-4">
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                    <div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </td>
            {/* Protocolo */}
            <td className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </td>
            {/* Docs */}
            <td className="px-6 py-4 text-center">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto"></div>
            </td>
            {/* Status */}
            <td className="px-6 py-4 text-center">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
            </td>
            {/* Actions */}
            <td className="px-6 py-4 text-right">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg ml-auto"></div>
            </td>
        </tr>
    );
};

export default SkeletonRow;
