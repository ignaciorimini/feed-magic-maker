
import { FileText, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatsOverview from '@/components/StatsOverview';
import PlatformCard from '@/components/PlatformCard';

interface DashboardContentProps {
  entries: any[];
  selectedPlatforms: string[];
  loading: boolean;
  onNewContent: () => void;
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onDeleteEntry: (entryId: string) => void;
  onDownloadSlides: (entryId: string, slidesURL: string) => void;
  onGenerateImage: (platformId: string, platform: string, topic: string, description: string) => void;
  onUploadImage: (platformId: string, file: File) => void;
  onDeleteImage: (platformId: string, imageUrl: string, isUploaded: boolean) => void;
}

const DashboardContent = ({
  entries,
  selectedPlatforms,
  loading,
  onNewContent,
  onUpdateContent,
  onDeleteEntry,
  onDownloadSlides,
  onGenerateImage,
  onUploadImage,
  onDeleteImage
}: DashboardContentProps) => {
  // Transform entries to create individual platform cards only for platforms that have content
  const platformCards = entries.flatMap(entry => {
    const cards = [];
    
    // Only create cards for platforms that actually have content in this entry
    if (entry.platformContent) {
      Object.keys(entry.platformContent).forEach(platform => {
        const platformKey = platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
        const platformContent = entry.platformContent[platformKey];
        
        // Only create a card if this platform has actual content (not empty)
        if (platformContent && (platformContent.text || (platformContent.images && platformContent.images.length > 0))) {
          cards.push({
            ...entry,
            platform: platformKey,
            id: `${entry.id}-${platform}` // Unique ID for each platform card
          });
        }
      });
    }
    
    return cards;
  });

  const handleUpdateStatus = async (entryId: string, platform: string, newStatus: 'published' | 'pending' | 'error') => {
    // Extract the original entry ID (remove platform suffix)
    const originalEntryId = entryId.split('-')[0];
    console.log('Updating status for entry:', originalEntryId, 'platform:', platform, 'status:', newStatus);
    // Status updates would need to be handled by the parent component
  };

  const handleUpdateLink = async (entryId: string, platform: string, link: string) => {
    // Extract the original entry ID (remove platform suffix)
    const originalEntryId = entryId.split('-')[0];
    console.log('Updating link for entry:', originalEntryId, 'platform:', platform, 'link:', link);
    // Link updates would need to be handled by the parent component
  };

  const handleDeleteEntry = (entryId: string, platform: string) => {
    // Extract the original entry ID (remove platform suffix)
    const originalEntryId = entryId.split('-')[0];
    console.log('Deleting entry:', originalEntryId);
    onDeleteEntry(originalEntryId);
  };

  const handleUpdateImage = async (entryId: string, imageUrl: string | null) => {
    // Extract the original entry ID (remove platform suffix)
    const originalEntryId = entryId.split('-')[0];
    console.log('Updating image for entry:', originalEntryId, 'imageUrl:', imageUrl);
    // Image updates would need to be handled by the parent component
    return Promise.resolve();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <StatsOverview entries={entries} selectedPlatforms={selectedPlatforms} />
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contenido Creado</h2>
            <p className="text-sm sm:text-base text-gray-600">Gestiona tu contenido por red social</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs sm:text-sm">
              {platformCards.length} tarjetas
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando contenido...</p>
          </div>
        ) : platformCards.length === 0 ? (
          <Card className="text-center py-12 bg-white/60 backdrop-blur-sm border-dashed border-2 border-gray-300">
            <CardContent className="pt-6">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay contenido aún
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza creando tu primer contenido para redes sociales
              </p>
              <Button 
                onClick={onNewContent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Contenido
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformCards.map((platformEntry) => (
              <PlatformCard
                key={platformEntry.id}
                entry={platformEntry}
                platform={platformEntry.platform}
                onUpdateContent={onUpdateContent}
                onDeleteEntry={handleDeleteEntry}
                onDownloadSlides={onDownloadSlides}
                onUpdateStatus={handleUpdateStatus}
                onUpdateLink={handleUpdateLink}
                onUpdateImage={handleUpdateImage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;
