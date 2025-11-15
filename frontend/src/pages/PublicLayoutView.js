import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { layoutService } from '../services';
import FullscreenLayoutViewer from '../components/FullscreenLayoutViewer';
import { Card, CardContent } from '@/components/ui/card';
import { Waves } from 'lucide-react';
import { toast } from 'sonner';

const PublicLayoutView = () => {
  const { projectId, layoutId } = useParams();
  const [layoutData, setLayoutData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLayout();
  }, [projectId, layoutId]);

  const loadLayout = async () => {
    setLoading(true);
    try {
      // If layoutId is provided, use new public endpoint
      // Otherwise use old project-based endpoint
      const data = layoutId 
        ? await layoutService.getPublicLayoutById(layoutId)
        : await layoutService.getPublicLayout(projectId);
      
      setLayoutData(data.layout);
      setProjectData(data.project);
    } catch (error) {
      toast.error('Failed to load layout');
      console.error('Error loading layout:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-ocean-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading layout...</p>
        </div>
      </div>
    );
  }

  if (!layoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <p className="text-gray-600">Layout not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-primary to-ocean-secondary flex items-center justify-center shadow-lg">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-primary to-ocean-secondary bg-clip-text text-transparent">
                RETOERP
              </h1>
              <p className="text-xs text-gray-500">Property Layout Viewer</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <FullscreenLayoutViewer
          layout={layoutData}
          project={projectData}
        />
        
        {/* Footer Info */}
        <Card className="glass-card mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600">
              <p>This is a public view of the project layout.</p>
              <p className="mt-2">For more information or to book a plot, please contact the sales team.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PublicLayoutView;
