
import { TrendingUp, Clock, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsOverviewProps {
  entries: any[];
  selectedPlatforms: string[];
}

const StatsOverview = ({ entries, selectedPlatforms }: StatsOverviewProps) => {
  // Add defensive checks to prevent undefined errors
  const safeEntries = entries || [];
  
  // Count total platform cards (each platform per entry)
  let totalCards = 0;
  let publishedCards = 0;
  let pendingCards = 0;

  safeEntries.forEach(entry => {
    if (entry.platformContent) {
      Object.keys(entry.platformContent).forEach(platform => {
        const platformContent = entry.platformContent[platform];
        
        // Only count platforms that have actual content
        if (platformContent && (platformContent.text || platformContent.title || (platformContent.images && platformContent.images.length > 0))) {
          totalCards++;
          
          // Count status for each platform card
          const platformStatus = entry.status?.[platform];
          if (platformStatus === 'published') {
            publishedCards++;
          } else if (platformStatus === 'pending') {
            pendingCards++;
          }
        }
      });
    }
  });

  const stats = [
    {
      title: "Total Contenido",
      value: totalCards,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Total de tarjetas creadas"
    },
    {
      title: "Publicado",
      value: publishedCards,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "Tarjetas ya publicadas"
    },
    {
      title: "Pendiente",
      value: pendingCards,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      description: "Tarjetas por publicar"
    },
    {
      title: "Engagement",
      value: `${Math.round((publishedCards / Math.max(totalCards, 1)) * 100)}%`,
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
