import React, { useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Download, Share2, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;
const PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=agentapex';

const PropertyShareCard = ({ property, agent, onClose }) => {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const coverIdx = property?.cover_image_index || 0;
  const coverImage = property?.images?.[coverIdx] 
    ? `${API_BASE}${property.images[coverIdx]}` 
    : null;
  const agentImage = agent?.profile_image 
    ? `${API_BASE}${agent.profile_image}` 
    : null;

  const propId = property?.property_id || 'AX-P-00000';
  const priceText = `\u20B9${Number(property?.price || 0).toLocaleString('en-IN')}`;
  const priceUnit = property?.price_unit || 'Lakhs';
  const negotiableText = property?.negotiable ? '(Negotiable)' : '';

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.92,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      return dataUrl;
    } catch (e) {
      console.error('Failed to generate image', e);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${propId}-share-card.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Card downloaded!');
    }
  };

  const handleWhatsAppShare = async () => {
    const shareText = `*${property?.type || property?.property_type} For Sale*

*Property ID:* ${propId}
*Price:* ${priceText} ${priceUnit} ${negotiableText}
*Area:* ${property?.area} ${property?.area_unit}
*Location:* ${property?.location}

Search this Property ID in AgentApex App to view full details.

--- *${agent?.name}* ---
AgentApex Property Advisor

Download AgentApex: ${PLAYSTORE_URL}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleShare = async () => {
    const dataUrl = await generateImage();
    if (dataUrl && navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${propId}.png`, { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: `${property?.type} - ${propId}`,
          text: `Property ${propId} - Search in AgentApex App`
        });
      } catch (e) {
        handleWhatsAppShare();
      }
    } else {
      handleWhatsAppShare();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Card Preview */}
        <div ref={cardRef} className="bg-white" style={{ width: '100%' }}>
          {/* Top: Property Image */}
          <div className="relative" style={{ aspectRatio: '4/3', background: '#1a1a2e' }}>
            {coverImage ? (
              <img 
                src={coverImage} 
                alt="Property" 
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <span className="text-white/40 text-sm">No Image</span>
              </div>
            )}
            {/* Property Type Badge */}
            <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-lg shadow-lg">
              <p className="text-xs font-bold tracking-wide uppercase">{property?.type || property?.property_type}</p>
            </div>
            {/* Property ID Badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 px-3 py-1.5 rounded-lg shadow-lg">
              <p className="text-xs font-bold font-mono">{propId}</p>
            </div>
          </div>

          {/* Title Banner */}
          <div className="bg-gradient-to-r from-[#0f1b3d] to-[#1a2d5e] py-3 px-4 text-center">
            <p className="text-white font-bold text-lg tracking-wide">
              {property?.type || property?.property_type} FOR SALE
            </p>
          </div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
            <div className="p-3 text-center border-r border-gray-200">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Location</p>
              <p className="text-xs font-bold text-gray-900 leading-tight">{property?.location}</p>
            </div>
            <div className="p-3 text-center border-r border-gray-200">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Area</p>
              <p className="text-xs font-bold text-gray-900">{property?.area} {property?.area_unit}</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Price</p>
              <p className="text-xs font-bold text-gray-900">{priceText}</p>
              <p className="text-[9px] text-gray-500">{priceUnit} {negotiableText}</p>
            </div>
          </div>

          {/* Agent Section */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0">
              {agentImage ? (
                <img src={agentImage} alt={agent?.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm uppercase">{agent?.name || 'Agent'}</p>
              <p className="text-xs text-amber-600 font-medium">AgentApex Property Advisor</p>
              <div className="mt-1 inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                <span className="text-[10px] font-semibold">AgentApex Partner</span>
              </div>
            </div>
            {/* QR Code */}
            <div className="flex-shrink-0 text-center">
              <div className="bg-white p-1 rounded-lg border border-gray-200">
                <QRCodeSVG 
                  value={PLAYSTORE_URL}
                  size={56}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[7px] text-gray-400 mt-1 leading-tight">Scan to Install<br/>AgentApex</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-[#0f1b3d] to-[#1a2d5e] py-2.5 px-4 flex items-center justify-between">
            <p className="text-[10px] text-white/70">Search Property ID in AgentApex App</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-white/50">Powered by</p>
              <p className="text-xs font-bold text-white tracking-wide">AGENTAPEX</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (outside card - not in the image) */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleShare}
            disabled={generating}
            data-testid="share-card-btn"
            className="w-full py-3.5 bg-green-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            Share via WhatsApp
          </button>
          <button
            onClick={handleDownload}
            disabled={generating}
            data-testid="download-card-btn"
            className="w-full py-3.5 bg-gray-100 text-gray-900 font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Download Card
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyShareCard;
