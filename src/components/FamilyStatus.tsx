
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmergency } from '@/contexts/EmergencyContext';
import { Users, Clock } from 'lucide-react';

const FamilyStatus: React.FC = () => {
  const { familyMembers } = useEmergency();

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-800 text-right">
          <Users className="h-5 w-5 text-blue-600" />
          מצב בני המשפחה ({familyMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {familyMembers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-2xl mb-2">⏳</div>
            <p>מחכים לדיווחים...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-2 text-green-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatTime(member.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{member.name}</span>
                  <span className="text-xl">✅</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyStatus;
