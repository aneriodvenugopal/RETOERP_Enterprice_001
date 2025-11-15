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
    <FullscreenLayoutViewer layout={layoutData} project={projectData} />
  );
};

export default PublicLayoutView;
