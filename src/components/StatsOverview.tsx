
import { TrendingUp, Clock, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsOverviewProps {
  entries: any[];
  selectedPlatforms: string[];
}

const StatsOverview = ({ entries, selectedPlatforms }: StatsOverviewProps) => {
  // Add defensive checks to prevent undefined errors
  const safeEntries = entries || [];
  
  const totalEntries = safeEntries.length;
  const publishedCount = safeEntries.filter(entry => 
    entry.status?.instagram === 'published' || 
    entry.status?.linkedin === 'published' || 
    entry.status?.wordpress === 'published' ||
    entry.status?.twitter === 'published'
  ).length;
  const pendingCount = safeEntries.filter(entry => 
    entry.status?.instagram === 'pending' || 
    entry.status?.linkedin === 'pending' || 
    entry.status?.wordpress === 'pending' ||
    entry.status?.twitter === 'pending'
  ).length;

  const stats = [
    {
      title: "Total Contenido",
      value: totalEntries,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Total de contenido creado"
    },
    {
      title: "Publicado",
      value: publishedCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Contenido ya publicado"
    },
    {
      title: "Pendiente",
      value: pendingCount,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      description: "Contenido por publicar"
    },
    {
      title: "Engagement",
      value: `${Math.round((publishedCount / Math.max(totalEntries, 1)) * 100)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Tasa de publicación"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="bg-white/60 dark:!bg-[#374151] backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
