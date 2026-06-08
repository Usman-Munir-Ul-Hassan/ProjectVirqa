import SharedNotifications from "../../../components/common/Notifications/Notification.jsx";

const EmployeeNotificationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-8xl mx-auto">
        <SharedNotifications title="Employee Notifications" />
      </div>
    </div>
  );
};

export default EmployeeNotificationsPage;
