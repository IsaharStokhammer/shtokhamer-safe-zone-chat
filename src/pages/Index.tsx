import React from 'react';
import { EmergencyProvider, useEmergency } from '@/contexts/EmergencyContext';
import UsernameForm from '@/components/UsernameForm';
import SafetyButton from '@/components/SafetyButton';
import FamilyStatus from '@/components/FamilyStatus';
import FamilyChat from '@/components/FamilyChat';
import { Button } from '@/components/ui/button'; // ייבא את קומפוננטת Button
import { LogOut, UserPen } from 'lucide-react'; // ייבא אייקונים

const EmergencyDashboard: React.FC = () => {
  const { userName, setUserName } = useEmergency();

  // פונקציה להתנתקות / עריכת שם משתמש
  const handleLogout = () => {
    localStorage.removeItem('stockhammer-username'); // נקה את שם המשתמש מ-localStorage
    setUserName(''); // אפס את ה-userName בסטייט, מה שיפעיל את UsernameForm
  };

  if (!userName) {
    return <UsernameForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 flex justify-between items-center"> {/* הוסף flex ו-justify-between */}
          <div className="text-right flex-grow"> {/* עוטף את הטקסט ומיישר אותו לימין */}
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              🏠 הממ"ד המשותף של משפחת שטוקהמר
            </h1>
            <p className="text-slate-600 text-lg">
              ברוכים הבאים, {userName} 💙
            </p>
          </div>
          
          {/* כפתור ההתנתקות / עריכת שם משתמש */}
          <Button
            variant="outline"
            size="sm" // גודל קטן יותר
            onClick={handleLogout}
            className="ml-4 flex items-center" // מרווח שמאלי, יישור פנימי
          >
            <UserPen className="w-4 h-4 mr-2" /> {/* אייקון עריכה */}
            עריכת שם / התנתקות
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <SafetyButton />
            <FamilyStatus />
          </div>
          
          <div>
            <FamilyChat />
          </div>
        </div>

        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>product by YisaStock</p>
        </footer>
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <EmergencyProvider>
      <EmergencyDashboard />
    </EmergencyProvider>
  );
};

export default Index;