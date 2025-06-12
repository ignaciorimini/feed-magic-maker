import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsOverviewProps {
  entries: any[];
  selectedPlatforms: string[];
}

const StatsOverview = ({ entries, selectedPlatforms }: StatsOverviewProps) => {
  // Add defensive checks to prevent undefined errors
  const safeEntries = entries || [];
  const safePlatforms = selectedPlatforms || [];
  
  const totalEntries = safeEntries.length * safePlatforms.length;
  const publishedCount = safeEntries.filter(entry => 
    entry.status?.instagram === 'published' || 
    entry.status?.linkedin === 'published' || 
    entry.status?.wordpress === 'published'
  ).length;
  const pendingCount = safeEntries.filter(entry => 
    entry.status?.instagram === 'pending' || 
    entry.status?.linkedin === 'pending' || 
    entry.status?.wordpress === 'pending'
  ).length;
  const errorCount = safeEntries.filter(entry => 
    entry.status?.instagram === 'error' || 
    entry.status?.linkedin === 'error' || 
    entry.status?.wordpress === 'error'
  ).length;

  const stats = [
    {
      title: "Total Contenido",
      value: totalEntries,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Publicado",
      value: publishedCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Pendiente",
      value: pendingCount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Con Errores",
      value: errorCount,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="bg-white/60 dark:!bg-[#374151] backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
