import SharedNotifications from '../../../components/common/Notifications/Notification';

const CandidateNotificationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-8xl mx-auto">
        <SharedNotifications title="My Notifications" />
      </div>
    </div>
  );
};

export default CandidateNotificationsPage;
