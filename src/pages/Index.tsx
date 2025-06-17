
import React from 'react';
import { EmergencyProvider, useEmergency } from '@/contexts/EmergencyContext';
import UsernameForm from '@/components/UsernameForm';
import SafetyButton from '@/components/SafetyButton';
import FamilyStatus from '@/components/FamilyStatus';
import FamilyChat from '@/components/FamilyChat';

const EmergencyDashboard: React.FC = () => {
  const { userName } = useEmergency();

  if (!userName) {
    return <UsernameForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            🏠 משפחת שטוקהמר
          </h1>
          <p className="text-slate-600 text-lg">
            ברוכים הבאים, {userName} 💙
          </p>
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
          <p>product by YissaStock</p>
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
