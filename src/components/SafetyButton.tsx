
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEmergency } from '@/contexts/EmergencyContext';
import { Shield, CheckCircle } from 'lucide-react';

const SafetyButton: React.FC = () => {
  const { userName, reportSafety, isUserReported } = useEmergency();

  const handleReport = () => {
    reportSafety(userName);
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardContent className="p-6 text-center">
        {!isUserReported ? (
          <div className="space-y-4">
            <div className="text-4xl mb-4">🛡️</div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              הגעת לממ"ד בבטחה?
            </h2>
            <Button
              onClick={handleReport}
              className="w-full py-4 text-xl font-bold bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              size="lg"
            >
              <Shield className="ml-2 h-6 w-6" />
              אני בממ"ד! 🏠
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">
              מצוין! דיווחת שהגעת בבטחה
            </h2>
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">נרשם בהצלחה</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyButton;
