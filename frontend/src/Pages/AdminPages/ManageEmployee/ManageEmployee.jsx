import { useState } from 'react';
import { 
    useEmployees, 
    useAddEmployee, 
    useUpdateEmployee, 
    useDeleteEmployee 
} from '../../../hooks/useAdmin';
import AddEmployeeForm from '../../../components/admin/ManageEmployee/AddEmployeeForm';
import EmployeeList from '../../../components/admin/ManageEmployee/EmployeeList';
import { Loader2 } from 'lucide-react';

const ManageEmployee = () => {
    const [editingEmployee, setEditingEmployee] = useState(null);

    // Hooks
    const { data: employees = [], isLoading } = useEmployees();
    const addMutation = useAddEmployee();
    const updateMutation = useUpdateEmployee(editingEmployee?.email);
    const deleteMutation = useDeleteEmployee();

    const handleEditEmployee = (employee) => {
        setEditingEmployee(employee);
    };

    const handleDeleteEmployee = (id) => {
        if (window.confirm('Are you sure you want to remove this employee?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Manage Employees</h1>
                <p className="text-gray-600">Invite new members and manage team access</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <AddEmployeeForm
                        onAddEmployee={(data) => addMutation.mutate(data)}
                        onUpdateEmployee={(data) => updateMutation.mutate(data)}
                        editingEmployee={editingEmployee}
                        onCancelEdit={() => setEditingEmployee(null)}
                        isSubmitting={addMutation.isPending || updateMutation.isPending}
                    />

                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">Did you know?</h3>
                        <p className="text-sm text-blue-600">
                            Adding an employee sends an automated verification email. They must click the link to activate their account.
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <EmployeeList
                        employees={employees}
                        onDelete={handleDeleteEmployee}
                        onEdit={handleEditEmployee}
                    />
                </div>
            </div>
        </div>
    );
};

export default ManageEmployee;
