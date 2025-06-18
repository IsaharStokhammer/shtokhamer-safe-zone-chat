import React from 'react';
import { EmergencyProvider, useEmergency } from '@/contexts/EmergencyContext';
import UsernameForm from '@/components/UsernameForm';
import SafetyButton from '@/components/SafetyButton';
import FamilyStatus from '@/components/FamilyStatus';
import FamilyChat from '@/components/FamilyChat';
import { Button } from '@/components/ui/button';
import { LogOut, UserPen, Siren } from 'lucide-react';

const EmergencyDashboard: React.FC = () => {
  const { userName, setUserName, resetAllData } = useEmergency();

  const handleLogout = () => {
    localStorage.removeItem('stockhammer-username');
    setUserName('');
  };

  const handleNewAlarm = () => {
    if (window.confirm("האם אתה בטוח שברצונך לאתחל אזעקה חדשה? פעולה זו תאפס את סטטוסי הבטיחות של כל בני המשפחה.")) {
      resetAllData();
    }
  };

  if (!userName) {
    return <UsernameForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 flex justify-between items-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleNewAlarm}
            className="ml-4 flex items-center"
          >
            <Siren className="w-4 h-4 ml-2" />
            אזעקה חדשה!
          </Button>

          <div className="text-right flex-grow">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              🏠 משפחת שטוקהמר
            </h1>
            <p className="text-slate-600 text-lg">
              ברוכים הבאים, {userName} 💙
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="ml-4 flex items-center"
          >
            <UserPen className="w-4 h-4 ml-2" />
            עריכת שם / התנתקות
          </Button>
        </header>

        {/* שינוי המיכל העוטף: הגדרת גובה כללי ושימוש ב-flex-1 על הילדים */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px] lg:h-[calc(100vh-180px)]"> {/* גובה קבוע גדול או גובה רספונסיבי */}
          <div className="space-y-6 flex flex-col"> {/* הפוך את העמודה ל-flex-col */}
            <SafetyButton />
            <FamilyStatus className="flex-1" /> {/* FamilyStatus יתפוס את הגובה הנותר */}
          </div>
          
          <div> {/* מיכל הצ'אט, יתפוס את הרוחב השני */}
            <FamilyChat className="h-full" /> {/* FamilyChat יתפוס 100% מהגובה של ההורה שלו */}
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