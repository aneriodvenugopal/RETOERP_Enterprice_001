import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, MessageSquare, Send, CreditCard, Bell, Clock, 
  Database, Users, Phone, TrendingUp, Home, Calendar,
  Zap, Mail, DollarSign, FileText, Shield, Info, Languages,
  Volume2, Search, BarChart2, Target, Eye, Scale, Wrench,
  UserCheck, Leaf, MapPin, Share2, Image, Award, Network, Calculator
} from 'lucide-react';

const AIAgentsHub = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [language, setLanguage] = useState('english');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingAgentId, setSpeakingAgentId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // AI Agents array defined below after helper functions
    {
      id: 'email-agent',
      name: 'Email Marketing Agent',
      icon: Mail,
      color: 'from-cyan-500 to-cyan-600',
      category: ['company', 'marketing'],
      roles: ['Tenant Admin', 'Marketing Manager'],
      shortDescription: 'Automated email campaigns, newsletters, drip sequences',
      implementationCost: 'Low (Email Templates)',
      usageCost: 'Per Email (₹0.05-0.15)',
      thirdPartyAPIs: ['SendGrid', 'Mailgun', 'AWS SES'],
      benefits: [
        'Professional email templates',
        'Drip campaigns for lead nurturing',
        'Monthly newsletters automation',
        'Event invitation emails',
        'Personalized content',
        'Open rate and click tracking'
      ]
    },
    {
      id: 'notification-agent',
      name: 'In-App Notification Agent',
      icon: Bell,
      color: 'from-red-500 to-red-600',
      category: ['company', 'agent'],
      roles: ['All Roles'],
      shortDescription: 'Real-time push notifications for critical business events',
      implementationCost: 'Low (Firebase Setup)',
      usageCost: 'Free (No per-notification cost)',
      thirdPartyAPIs: ['Firebase Cloud Messaging', 'OneSignal'],
      benefits: [
        'Instant alerts for new leads (within 1 minute)',
        'Site visit booking notifications',
        'Payment received confirmations',
        'Task deadline reminders',
        'Team collaboration updates',
        'Priority notifications for urgent actions'
      ]
    },
    {
      id: 'voice-agent',
      name: 'Voice Call Automation Agent',
      icon: Phone,
      color: 'from-yellow-500 to-yellow-600',
      category: ['company', 'agent', 'customer'],
      roles: ['Tenant Admin', 'Sales Manager', 'Collections Team'],
      shortDescription: 'AI voice assistant for automated calling and IVR systems',
      implementationCost: 'High (Voice AI Setup)',
      usageCost: 'Per Minute (₹2-5)',
      thirdPartyAPIs: ['Twilio Voice', 'Exotel', 'AWS Connect'],
      benefits: [
        'Automated lead qualification calls',
        'IVR for incoming customer inquiries',
        'Appointment scheduling via voice',
        'Payment reminder calls',
        'Survey and feedback collection',
        'Call recording and transcription'
      ]
    },

    // Intelligence & Analytics Agents
    {
      id: 'bi-agent',
      name: 'Business Intelligence & Reports Agent',
      icon: BarChart2,
      color: 'from-indigo-500 to-indigo-600',
      category: ['company', 'saas_admin'],
      roles: ['Tenant Admin', 'SaaS Admin', 'Project Manager'],
      shortDescription: 'Advanced analytics, custom reports, dashboards for decision-making',
      implementationCost: 'Medium (Dashboard Setup)',
      usageCost: 'Free (Internal Processing)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Automated daily/weekly/monthly reports',
        'Custom dashboards for different roles',
        'Sales pipeline visualization',
        'Conversion funnel analysis',
        'Agent performance scorecards',
        'Executive summary reports with insights'
      ]
    },
    {
      id: 'market-research-agent',
      name: 'Market Research & Intelligence Agent',
      icon: Search,
      color: 'from-cyan-600 to-cyan-700',
      category: ['company', 'saas_admin', 'project'],
      roles: ['Tenant Admin', 'SaaS Admin', 'Project Manager'],
      shortDescription: 'AI-powered competitor analysis, market trends, demand forecasting',
      implementationCost: 'Medium (Market Data Integration)',
      usageCost: 'Per Analysis (₹50-200)',
      thirdPartyAPIs: ['Market Data APIs', 'Google Maps API', 'Property Databases'],
      benefits: [
        'Real-time competitor pricing tracking',
        'Market demand prediction for locations',
        'Identify emerging micro-markets',
        'Customer preference analysis',
        'Inventory benchmarking',
        'Optimal launch timing recommendations'
      ]
    },
    {
      id: 'lead-scoring-agent',
      name: 'Intelligent Lead Scoring Agent',
      icon: Target,
      color: 'from-amber-500 to-amber-600',
      category: ['company', 'agent'],
      roles: ['Sales Manager', 'Sales Agent'],
      shortDescription: 'ML-based lead quality prediction and hot lead identification',
      implementationCost: 'Low (ML Model Training)',
      usageCost: 'Free (Internal ML)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Predict lead conversion probability',
        'Hot lead identification within minutes',
        'Budget qualification scoring',
        'Engagement level tracking',
        'Optimal contact time prediction',
        'Increase conversion rate by 40%'
      ]
    },
    {
      id: 'property-valuation-agent',
      name: 'AI Property Valuation Agent',
      icon: DollarSign,
      color: 'from-green-600 to-green-700',
      category: ['company', 'agent', 'project', 'customer'],
      roles: ['Tenant Admin', 'Sales Agent', 'Customer'],
      shortDescription: 'ML-based property pricing, market value estimation, appreciation prediction',
      implementationCost: 'High (ML Model + Market Data)',
      usageCost: 'Per Valuation (₹20-100)',
      thirdPartyAPIs: ['Property Market APIs', 'Government Data APIs'],
      benefits: [
        'Accurate valuation using 50+ parameters',
        'Future price appreciation prediction',
        'Comparable property analysis',
        'Location score calculation',
        'Optimal pricing recommendations',
        'Market rate alerts for adjustments'
      ]
    },
    {
      id: 'predictive-analytics-agent',
      name: 'Predictive Analytics Agent',
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      category: ['company', 'saas_admin'],
      roles: ['Tenant Admin', 'SaaS Admin', 'Project Manager'],
      shortDescription: 'Sales forecasting, revenue prediction, inventory sell-out dates',
      implementationCost: 'Medium (ML Models)',
      usageCost: 'Free (Internal ML)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Predict monthly sales revenue (85% accuracy)',
        'Forecast inventory sell-out dates',
        'Identify best-performing agents',
        'Optimize pricing strategies',
        'Lead source ROI analysis',
        'Customer lifetime value prediction'
      ]
    },

    // Automation & Workflow Agents
    {
      id: 'followup-agent',
      name: 'Lead Follow-up Automation Agent',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      category: ['company', 'agent'],
      roles: ['Sales Manager', 'Sales Agent'],
      shortDescription: 'Intelligent follow-up scheduler and reminder system',
      implementationCost: 'Low (Workflow Setup)',
      usageCost: 'Free (Internal Logic)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Never miss a follow-up (100% adherence)',
        'Intelligent frequency based on lead quality',
        'Multi-channel follow-ups (Call, SMS, WhatsApp)',
        'Auto-assign to available agents',
        'Predictive conversion scoring',
        'Outcome tracking and optimization'
      ]
    },
    {
      id: 'payment-agent',
      name: 'Payment Collection Agent',
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600',
      category: ['company', 'agent', 'customer'],
      roles: ['Accounts Team', 'Collections Team', 'Customer'],
      shortDescription: 'Intelligent payment reminders and collection automation',
      implementationCost: 'Low (Payment Gateway Integration)',
      usageCost: 'Transaction Fee (1.5-2.5%)',
      thirdPartyAPIs: ['Razorpay', 'Paytm', 'PhonePe', 'Stripe'],
      benefits: [
        'Reduce payment defaults by 50%',
        'Automated multi-channel reminders',
        'Payment link generation and tracking',
        'Escalation for overdue payments',
        'Early payment incentive notifications',
        'Automated receipt generation'
      ]
    },
    {
      id: 'cron-agent',
      name: 'Background Jobs & Scheduler Agent',
      icon: Clock,
      color: 'from-indigo-500 to-indigo-600',
      category: ['company', 'saas_admin'],
      roles: ['SaaS Admin', 'System'],
      shortDescription: 'Scheduled tasks and background processes for automation',
      implementationCost: 'Low (Cron Setup)',
      usageCost: 'Free (Server Processing)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Daily automated reports to management',
        'Monthly payment schedule generation',
        'Auto-archive old leads',
        'Generate and send MIS reports',
        'Update property availability',
        'Calculate commission amounts'
      ]
    },
    {
      id: 'backup-agent',
      name: 'Automated Backup Agent',
      icon: Database,
      color: 'from-gray-700 to-gray-800',
      category: ['company', 'saas_admin'],
      roles: ['SaaS Admin', 'System'],
      shortDescription: 'Automated database backup and disaster recovery',
      implementationCost: 'Low (Backup Configuration)',
      usageCost: 'Storage Cost (₹500-2000/month)',
      thirdPartyAPIs: ['AWS S3', 'Google Cloud Storage', 'MongoDB Atlas'],
      benefits: [
        'Daily automated backups',
        'Cloud storage for redundancy',
        'One-click restore capability',
        'Version history (restore to any date)',
        'Encrypted backups for security',
        'Backup health monitoring'
      ]
    },
    {
      id: 'document-agent',
      name: 'Document Processing Agent',
      icon: FileText,
      color: 'from-blue-600 to-blue-700',
      category: ['company', 'agent', 'customer'],
      roles: ['Tenant Admin', 'Sales Agent', 'Legal Team', 'Customer'],
      shortDescription: 'Automated document generation, verification, and management',
      implementationCost: 'Medium (Document Templates + OCR)',
      usageCost: 'Per Document (₹5-20)',
      thirdPartyAPIs: ['AWS Textract', 'Google Document AI', 'DocuSign'],
      benefits: [
        'Auto-generate booking agreements',
        'Create payment receipts instantly',
        'KYC document verification',
        'Legal document templates',
        'Digital signature integration',
        'Document search and retrieval'
      ]
    },

    // Customer Experience Agents
    {
      id: 'chatbot-agent',
      name: '24/7 Customer Service Chatbot',
      icon: Bot,
      color: 'from-purple-500 to-purple-600',
      category: ['customer', 'company'],
      roles: ['Customer', 'All Staff'],
      shortDescription: 'AI chatbot for instant customer support and FAQ handling',
      implementationCost: 'Medium (Chatbot Training)',
      usageCost: 'Per Conversation (₹1-5)',
      thirdPartyAPIs: ['OpenAI GPT', 'Dialogflow', 'Rasa'],
      benefits: [
        '24/7 availability (no human agent needed)',
        'Instant responses to common queries',
        'Multi-language support',
        'Lead capture from website visitors',
        'Escalate complex queries to humans',
        'Reduce support costs by 70%'
      ]
    },
    {
      id: 'virtual-tour-agent',
      name: 'Virtual Tour & 3D Visualization Agent',
      icon: Eye,
      color: 'from-orange-500 to-orange-600',
      category: ['customer', 'marketing', 'project'],
      roles: ['Customer', 'Marketing Manager', 'Sales Agent'],
      shortDescription: 'Create immersive 3D property tours and AR experiences',
      implementationCost: 'High (3D Rendering Setup)',
      usageCost: 'Per Tour (₹100-500)',
      thirdPartyAPIs: ['Matterport', 'Google AR', 'Unity 3D'],
      benefits: [
        'Generate 3D virtual tours from floor plans',
        'AR-based property viewing on mobile',
        'Virtual site visit scheduling',
        'Remote customer engagement',
        '360-degree project walkthroughs',
        'Reduce physical visits by 50%'
      ]
    },
    {
      id: 'resale-agent',
      name: 'Resale Automation Agent',
      icon: Home,
      color: 'from-teal-500 to-teal-600',
      category: ['customer', 'company', 'agent'],
      roles: ['Customer', 'Sales Agent', 'Resale Manager'],
      shortDescription: 'Automated resale property matching and notification system',
      implementationCost: 'Low (Matching Algorithm)',
      usageCost: 'Free (Internal Processing)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Match resale properties with buyers automatically',
        'Notify owners when matching buyer found',
        'Send resale alerts to relevant leads',
        'Calculate market-rate pricing',
        'Track resale listing performance',
        'Automate resale commission calculations'
      ]
    },
    {
      id: 'referral-agent',
      name: 'Customer Referral & Loyalty Agent',
      icon: Award,
      color: 'from-violet-500 to-violet-600',
      category: ['customer', 'company', 'marketing'],
      roles: ['Customer', 'Marketing Manager'],
      shortDescription: 'Automated referral program and customer loyalty management',
      implementationCost: 'Low (Referral System)',
      usageCost: 'Free (Internal Logic)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Automated referral link generation',
        'Track referral conversions',
        'Reward points management',
        'Loyalty program automation',
        'Customer retention campaigns',
        'Increase referrals by 3x'
      ]
    },

    // Marketing & Branding Agents
    {
      id: 'digital-marketing-agent',
      name: 'Digital Marketing Automation Agent',
      icon: Share2,
      color: 'from-pink-500 to-pink-600',
      category: ['marketing', 'company'],
      roles: ['Marketing Manager', 'Tenant Admin'],
      shortDescription: 'Multi-channel digital marketing for social media, ads, SEO',
      implementationCost: 'Medium (Ad Accounts Setup)',
      usageCost: 'Ad Spend + Management Fee',
      thirdPartyAPIs: ['Facebook Ads', 'Google Ads', 'LinkedIn Ads'],
      benefits: [
        'Automated social media posting',
        'Google & Facebook Ads optimization',
        'SEO-optimized content generation',
        'Influencer collaboration management',
        'Brand sentiment monitoring',
        'ROI tracking across channels'
      ]
    },
    {
      id: 'content-agent',
      name: 'Content Generation & Branding Agent',
      icon: Image,
      color: 'from-rose-500 to-rose-600',
      category: ['marketing', 'company'],
      roles: ['Marketing Manager', 'Content Team'],
      shortDescription: 'AI-powered content creation for social media, blogs, property descriptions',
      implementationCost: 'Low (AI Content Tools)',
      usageCost: 'Per Content Piece (₹10-50)',
      thirdPartyAPIs: ['OpenAI GPT', 'DALL-E', 'Canva API'],
      benefits: [
        'Auto-generate property descriptions',
        'Create social media posts with images',
        'Blog article writing for SEO',
        'Email campaign content',
        'Video script generation',
        'Brand voice consistency'
      ]
    },
    {
      id: 'reputation-agent',
      name: 'Review & Reputation Management Agent',
      icon: Eye,
      color: 'from-yellow-600 to-yellow-700',
      category: ['marketing', 'company', 'customer'],
      roles: ['Marketing Manager', 'Customer Service'],
      shortDescription: 'Monitor and manage online reviews, ratings, and brand reputation',
      implementationCost: 'Low (API Integrations)',
      usageCost: 'Free (Web Scraping)',
      thirdPartyAPIs: ['Google My Business API', 'Facebook Reviews'],
      benefits: [
        'Monitor reviews across platforms',
        'Automated review response suggestions',
        'Sentiment analysis of feedback',
        'Alert for negative reviews',
        'Generate review request campaigns',
        'Reputation score tracking'
      ]
    },

    // Compliance & Security Agents
    {
      id: 'legal-compliance-agent',
      name: 'Legal Compliance & RERA Agent',
      icon: Scale,
      color: 'from-gray-600 to-gray-700',
      category: ['company', 'project'],
      roles: ['Tenant Admin', 'Legal Team', 'Project Manager'],
      shortDescription: 'Automated RERA compliance tracking and legal document verification',
      implementationCost: 'Medium (Legal Database)',
      usageCost: 'Free (Internal Checks)',
      thirdPartyAPIs: ['RERA API', 'Government Data'],
      benefits: [
        'RERA registration status monitoring',
        'Compliance deadline reminders',
        'Legal document verification',
        'Automated statutory reporting',
        'Risk assessment and alerts',
        'Avoid legal penalties'
      ]
    },
    {
      id: 'security-agent',
      name: 'Security & Fraud Detection Agent',
      icon: Shield,
      color: 'from-red-600 to-red-700',
      category: ['company', 'saas_admin'],
      roles: ['SaaS Admin', 'Security Team'],
      shortDescription: 'Real-time security monitoring, fraud detection, compliance management',
      implementationCost: 'High (Security ML Models)',
      usageCost: 'Free (Internal ML)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Real-time threat detection',
        'Suspicious activity alerts',
        'Data access monitoring',
        'Compliance report generation',
        'Password policy enforcement',
        'Audit trail maintenance'
      ]
    },

    // Network & Partner Management
    {
      id: 'network-agent',
      name: 'Agent Network Management System',
      icon: Network,
      color: 'from-blue-600 to-blue-700',
      category: ['company', 'network', 'saas_admin'],
      roles: ['Tenant Admin', 'Network Manager'],
      shortDescription: 'Manage channel partners, brokers, commission tracking',
      implementationCost: 'Medium (Network Portal)',
      usageCost: 'Free (Internal Processing)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Broker network onboarding and KYC',
        'Real-time commission calculation',
        'Lead distribution to partners',
        'Performance tracking and rankings',
        'Payout automation',
        'Expand reach through partners'
      ]
    },

    // Property & Project Management
    {
      id: 'site-selection-agent',
      name: 'Site Selection & Location Intelligence Agent',
      icon: MapPin,
      color: 'from-emerald-500 to-emerald-600',
      category: ['company', 'project', 'saas_admin'],
      roles: ['Tenant Admin', 'Project Manager'],
      shortDescription: 'Data-driven site selection, demographic analysis, location scoring',
      implementationCost: 'High (Geographic Data)',
      usageCost: 'Per Analysis (₹200-1000)',
      thirdPartyAPIs: ['Google Maps API', 'Census Data', 'GIS APIs'],
      benefits: [
        'Demographic analysis of locations',
        'Proximity to amenities scoring',
        'Infrastructure development tracking',
        'Demand-supply gap analysis',
        'Price appreciation potential',
        'Competitive landscape mapping'
      ]
    },
    {
      id: 'construction-tracking-agent',
      name: 'Construction Progress Tracking Agent',
      icon: Wrench,
      color: 'from-orange-600 to-orange-700',
      category: ['company', 'project'],
      roles: ['Project Manager', 'Site Engineer'],
      shortDescription: 'AI-powered construction monitoring using image recognition',
      implementationCost: 'High (Computer Vision)',
      usageCost: 'Per Analysis (₹50-200)',
      thirdPartyAPIs: ['AWS Rekognition', 'Google Vision AI'],
      benefits: [
        'Automated progress tracking from photos',
        'Quality check using AI',
        'Delay prediction and alerts',
        'Compare actual vs planned progress',
        'Worker safety compliance monitoring',
        'Generate progress reports automatically'
      ]
    },
    {
      id: 'inventory-optimization-agent',
      name: 'Inventory Optimization Agent',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      category: ['company', 'project'],
      roles: ['Tenant Admin', 'Sales Manager'],
      shortDescription: 'Optimize property inventory, pricing, and availability',
      implementationCost: 'Low (Algorithm Setup)',
      usageCost: 'Free (Internal Logic)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Dynamic pricing based on demand',
        'Identify slow-moving inventory',
        'Optimal unit mix recommendations',
        'Seasonal pricing strategies',
        'Discount optimization',
        'Maximize revenue per project'
      ]
    },
    {
      id: 'tenant-screening-agent',
      name: 'Tenant Screening & Verification Agent',
      icon: UserCheck,
      color: 'from-teal-500 to-teal-600',
      category: ['company', 'agent'],
      roles: ['Property Manager', 'Rental Team'],
      shortDescription: 'Automated background checks, credit scoring, tenant reliability assessment',
      implementationCost: 'Medium (Verification APIs)',
      usageCost: 'Per Check (₹50-200)',
      thirdPartyAPIs: ['CIBIL', 'Aadhaar Verification', 'Employment Verification'],
      benefits: [
        'Instant background verification',
        'Credit score analysis',
        'Employment verification',
        'Previous landlord reference checks',
        'Risk scoring for reliability',
        'Reduce bad tenant incidents by 80%'
      ]
    },

    // Additional Value-Add Agents
    {
      id: 'mortgage-agent',
      name: 'Mortgage Calculator & Pre-approval Agent',
      icon: Calculator,
      color: 'from-blue-500 to-blue-600',
      category: ['customer', 'agent', 'company'],
      roles: ['Customer', 'Sales Agent', 'Loan Partner'],
      shortDescription: 'Help customers with mortgage calculations and pre-approval',
      implementationCost: 'Low (Calculator + Bank APIs)',
      usageCost: 'Free (Affiliate Commissions)',
      thirdPartyAPIs: ['Bank APIs', 'CIBIL'],
      benefits: [
        'EMI calculator for customers',
        'Loan eligibility assessment',
        'Connect with partner banks',
        'Pre-approval assistance',
        'Compare loan offers',
        'Earn affiliate commissions'
      ]
    },
    {
      id: 'sentiment-agent',
      name: 'Customer Sentiment Analysis Agent',
      icon: TrendingUp,
      color: 'from-purple-600 to-purple-700',
      category: ['company', 'customer'],
      roles: ['Customer Service', 'Sales Manager'],
      shortDescription: 'Analyze customer feedback, calls, chats for sentiment',
      implementationCost: 'Medium (NLP Models)',
      usageCost: 'Per Analysis (₹2-10)',
      thirdPartyAPIs: ['OpenAI', 'Google NLP', 'AWS Comprehend'],
      benefits: [
        'Real-time sentiment tracking',
        'Identify unhappy customers early',
        'Prioritize support for at-risk customers',
        'Measure customer satisfaction',
        'Improve agent training',
        'Prevent customer churn'
      ]
    },
    {
      id: 'energy-efficiency-agent',
      name: 'Energy Efficiency & Sustainability Agent',
      icon: Leaf,
      color: 'from-green-600 to-green-700',
      category: ['company', 'project', 'customer'],
      roles: ['Project Manager', 'Customer'],
      shortDescription: 'Recommend energy savings, sustainability features',
      implementationCost: 'Low (Algorithm)',
      usageCost: 'Free (Internal Logic)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Energy consumption prediction',
        'Solar panel ROI calculator',
        'Green building certification assistance',
        'Utility cost optimization',
        'Carbon footprint tracking',
        'Sustainability score for projects'
      ]
    },
    {
      id: 'lead-routing-agent',
      name: 'Intelligent Lead Routing Agent',
      icon: Target,
      color: 'from-indigo-600 to-indigo-700',
      category: ['company', 'agent'],
      roles: ['Sales Manager'],
      shortDescription: 'Smart lead distribution based on agent expertise, availability, performance',
      implementationCost: 'Low (Routing Logic)',
      usageCost: 'Free (Internal Logic)',
      thirdPartyAPIs: ['Internal Only'],
      benefits: [
        'Match leads with best-suited agents',
        'Balance workload across team',
        'Route based on expertise',
        'Consider agent availability',
        'Performance-based routing',
        'Increase conversion by 25%'
      ]
    }
  ];

  // Text-to-Speech functionality
  const speakText = (text, agentId) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on selected language
      if (language === 'telugu') {
        utterance.lang = 'te-IN';
      } else if (language === 'hindi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingAgentId(agentId);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingAgentId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingAgentId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingAgentId(null);
    }
  };

  const handleSpeakAgent = (agent) => {
    if (isSpeaking && speakingAgentId === agent.id) {
      stopSpeaking();
    } else {
      const textToSpeak = `${agent.name}. ${agent.shortDescription}. Key benefits: ${agent.benefits.slice(0, 3).join('. ')}`;
      speakText(textToSpeak, agent.id);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const aiAgents = [
    {
      id: 'sms-agent',
      name: 'SMS Automation Agent',
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      status: 'coming_soon',
      shortDescription: 'Automated SMS sending for leads, follow-ups, payment reminders, and notifications',
      benefits: [
        'Instant lead acknowledgment SMS within seconds of inquiry',
        'Automated follow-up reminders to sales team',
        'Payment due date reminders to customers',
        'Booking confirmation SMS',
        'Site visit appointment reminders',
        'OTP for secure authentication'
      ],
      useCases: [
        {
          title: 'Lead Follow-up Automation',
          description: 'When a new lead is created, automatically send welcome SMS with project details and schedule follow-up SMS series (Day 1, Day 3, Day 7) until lead responds or converts.'
        },
        {
          title: 'Payment Collection',
          description: 'Send automated reminders 7 days before EMI due date, on due date, and after due date with payment link. Reduces default rates by 40%.'
        },
        {
          title: 'Site Visit Coordination',
          description: 'Send SMS with Google Maps link, contact person details, and timing 1 day before scheduled site visit. Reduces no-shows by 60%.'
        }
      ],
      technicalDetails: {
        provider: 'MSG91 / Twilio',
        features: [
          'Template-based messaging',
          'Delivery reports tracking',
          'Failed message retry logic',
          'Cost optimization (send only during business hours)',
          'Multi-language support (English, Telugu, Hindi)',
          'Character count optimization'
        ],
        integration: 'Integrated with Lead Management, Booking System, Payment Schedules'
      }
    },
    {
      id: 'whatsapp-agent',
      name: 'WhatsApp Business Agent',
      icon: Send,
      color: 'from-green-500 to-green-600',
      status: 'coming_soon',
      shortDescription: 'Rich media messaging via WhatsApp for project brochures, property videos, and customer engagement',
      benefits: [
        'Send project brochures with images and PDFs',
        'Share property videos and virtual tours',
        'Higher engagement rate (98% open rate vs 20% for email)',
        'Two-way conversation support',
        'Status updates with images (construction progress)',
        'Interactive buttons for quick responses'
      ],
      useCases: [
        {
          title: 'Project Marketing',
          description: 'Send beautifully formatted project brochures with images, floor plans, amenities, pricing, and location map. Include CTA buttons for "Schedule Visit" or "Talk to Expert".'
        },
        {
          title: 'Lead Nurturing',
          description: 'Share relevant property options based on lead budget and preferences. Send personalized messages with property images, area details, and pricing. Track which properties lead showed interest in.'
        },
        {
          title: 'Customer Updates',
          description: 'Send construction progress updates with photos to booked customers every month. Share possession date updates, documentation reminders, and legal completion milestones.'
        }
      ],
      technicalDetails: {
        provider: 'WhatsApp Business API',
        features: [
          'Rich media support (images, videos, PDFs)',
          'Template messages with variables',
          'Interactive buttons and lists',
          'Read receipts and delivery status',
          'Session-based conversations',
          '24-hour message window after user response'
        ],
        integration: 'Integrated with CRM, Property Listings, Document Management'
      }
    },
    {
      id: 'payment-agent',
      name: 'Payment Collection Agent',
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600',
      status: 'coming_soon',
      shortDescription: 'Intelligent payment reminder and collection system with automated follow-ups',
      benefits: [
        'Reduce payment defaults by 50%',
        'Automated multi-channel reminders (SMS, WhatsApp, Email)',
        'Payment link generation and tracking',
        'Escalation to sales team for overdue payments',
        'Early payment incentive notifications',
        'Automated receipt generation and delivery'
      ],
      useCases: [
        {
          title: 'EMI Collection Automation',
          description: 'For customers with EMI plans: Send reminder 7 days before due date, on due date (morning), and 3 days after due date with payment link. Escalate to sales manager if payment pending for 7+ days.'
        },
        {
          title: 'Booking Amount Collection',
          description: 'For leads who showed interest but haven\'t paid booking amount: Send personalized reminder with limited-time offers, property blocking alert, and easy payment options. Convert 30% of interested leads to bookings.'
        },
        {
          title: 'Early Payment Incentives',
          description: 'Identify customers who consistently pay on time and send automated messages about early payment discounts or loyalty benefits. Improve cash flow by encouraging advance payments.'
        }
      ],
      technicalDetails: {
        provider: 'Razorpay / Paytm / PhonePe',
        features: [
          'Payment link generation',
          'Multiple payment methods (UPI, Cards, Net Banking)',
          'Automatic payment status updates',
          'Webhook integration for real-time notifications',
          'Failed payment retry logic',
          'Refund management'
        ],
        integration: 'Integrated with Booking System, Payment Schedules, SMS/WhatsApp Agents'
      }
    },
    {
      id: 'notification-agent',
      name: 'In-App Notification Agent',
      icon: Bell,
      color: 'from-red-500 to-red-600',
      status: 'coming_soon',
      shortDescription: 'Real-time push notifications for critical business events and updates',
      benefits: [
        'Instant alerts for new leads (within 1 minute)',
        'Site visit booking notifications',
        'Payment received confirmations',
        'Task deadline reminders',
        'Team collaboration updates',
        'Priority notifications for urgent actions'
      ],
      useCases: [
        {
          title: 'Lead Alert System',
          description: 'When a new lead comes from website or walk-in, instantly notify available sales agents with lead details, source, and quick action buttons to call or assign. Reduce response time from 2 hours to 2 minutes.'
        },
        {
          title: 'Manager Escalations',
          description: 'Automatically escalate and notify managers when: Lead pending for 24+ hours, Payment overdue by 7+ days, Customer complaint registered, or Staff missing targets. Enable faster decision-making.'
        },
        {
          title: 'Customer Journey Tracking',
          description: 'Notify relevant team members at each stage: Lead created → Sales Agent, Site visit booked → Site coordinator, Booking done → Accounts team, Payment due → Collections team. Ensure no customer falls through cracks.'
        }
      ],
      technicalDetails: {
        provider: 'Firebase Cloud Messaging / OneSignal',
        features: [
          'Real-time push notifications',
          'In-app notification center',
          'Priority levels (urgent, high, medium, low)',
          'Click actions (deep linking)',
          'Notification history and read status',
          'User preference management'
        ],
        integration: 'Integrated with all modules - Leads, Bookings, Payments, Tasks'
      }
    },
    {
      id: 'followup-agent',
      name: 'Lead Follow-up Automation Agent',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      status: 'coming_soon',
      shortDescription: 'Intelligent follow-up scheduler and reminder system for lead nurturing',
      benefits: [
        'Never miss a follow-up (100% adherence)',
        'Intelligent follow-up frequency based on lead quality',
        'Multi-channel follow-ups (Call, SMS, WhatsApp, Email)',
        'Auto-assign follow-ups to available agents',
        'Predictive conversion scoring',
        'Follow-up outcome tracking and optimization'
      ],
      useCases: [
        {
          title: 'Automated Follow-up Sequences',
          description: 'Create smart follow-up sequences based on lead source and quality: Hot leads (5-star) → Call same day, SMS next day, WhatsApp day 3. Warm leads → SMS day 1, Call day 3, Email day 5. Cold leads → Email day 1, SMS day 7. Adjust based on response.'
        },
        {
          title: 'Lead Scoring & Prioritization',
          description: 'AI analyzes lead behavior (opens SMS, clicks links, visits website) and assigns priority score. High-priority leads get more frequent, personalized follow-ups. Low-priority leads get automated nurture campaigns.'
        },
        {
          title: 'Conversion Prediction',
          description: 'Based on historical data, predict likelihood of conversion for each lead. Focus agent time on high-probability leads. Send automated campaigns to low-probability leads until they show interest signals.'
        }
      ],
      technicalDetails: {
        provider: 'Custom AI Engine',
        features: [
          'ML-based lead scoring',
          'Automated task creation',
          'Multi-channel sequencing',
          'Response tracking and optimization',
          'A/B testing for message templates',
          'Agent workload balancing'
        ],
        integration: 'Integrated with CRM, SMS Agent, WhatsApp Agent, Email Agent'
      }
    },
    {
      id: 'resale-agent',
      name: 'Resale Automation Agent',
      icon: Home,
      color: 'from-teal-500 to-teal-600',
      status: 'coming_soon',
      shortDescription: 'Automated resale property matching and notification system',
      benefits: [
        'Match resale properties with buyer leads automatically',
        'Notify property owners when matching buyer found',
        'Send resale property alerts to relevant leads',
        'Calculate market-rate pricing suggestions',
        'Track resale listing performance',
        'Automate resale commission calculations'
      ],
      useCases: [
        {
          title: 'Buyer-Seller Matching',
          description: 'When a customer submits resale request for their property, AI agent automatically searches for matching buyer leads based on budget, location, property type. Sends notifications to both parties with match details.'
        },
        {
          title: 'Resale Opportunity Alerts',
          description: 'Analyze booking patterns and identify customers likely to resell within 2-3 years. Proactively reach out with resale services before they approach competitors. Capture 40% more resale inventory.'
        },
        {
          title: 'Market Price Recommendations',
          description: 'AI analyzes recent sales in project, location trends, property condition, and market demand to suggest optimal resale price. Helps customers price competitively and sell faster.'
        }
      ],
      technicalDetails: {
        provider: 'Custom AI Engine + Market Data APIs',
        features: [
          'Property matching algorithm',
          'Price suggestion engine',
          'Automated listing creation',
          'Lead notification system',
          'Performance analytics',
          'Commission calculator'
        ],
        integration: 'Integrated with Customer Portal, Lead Management, Property Listings'
      }
    },
    {
      id: 'cron-agent',
      name: 'Background Jobs Agent',
      icon: Clock,
      color: 'from-indigo-500 to-indigo-600',
      status: 'coming_soon',
      shortDescription: 'Scheduled tasks and background processes for automated operations',
      benefits: [
        'Daily automated reports to management',
        'Monthly payment schedule generation',
        'Auto-archive old leads and clean database',
        'Generate and send MIS reports',
        'Update property availability status',
        'Calculate and update commission amounts'
      ],
      useCases: [
        {
          title: 'Daily Business Reports',
          description: 'Every morning at 9 AM, generate and send WhatsApp/Email with: Yesterday\'s leads, New bookings, Pending follow-ups, Overdue payments, Team performance. Helps management stay informed without manual reporting.'
        },
        {
          title: 'Monthly Payment Schedule',
          description: 'On 1st of every month, automatically generate payment schedules for all EMI customers for next 30 days. Send SMS reminders to customers. Create tasks for collection team. Update dashboard with upcoming collections.'
        },
        {
          title: 'Data Cleanup & Archival',
          description: 'Every weekend, automatically: Archive leads older than 90 days with no activity, Remove duplicate entries, Clean up invalid phone numbers, Optimize database indexes. Keeps system fast and organized.'
        }
      ],
      technicalDetails: {
        provider: 'Celery / APScheduler',
        features: [
          'Cron-based scheduling',
          'Recurring tasks management',
          'Failed job retry mechanism',
          'Job queue monitoring',
          'Performance optimization',
          'Error notifications'
        ],
        integration: 'Integrated with all backend modules'
      }
    },
    {
      id: 'backup-agent',
      name: 'Automated Backup Agent',
      icon: Database,
      color: 'from-gray-700 to-gray-800',
      status: 'coming_soon',
      shortDescription: 'Automated database backup and disaster recovery system',
      benefits: [
        'Daily automated backups (zero data loss)',
        'Cloud storage for redundancy',
        'One-click restore capability',
        'Version history (restore to any date)',
        'Encrypted backups for security',
        'Backup health monitoring'
      ],
      useCases: [
        {
          title: 'Daily Incremental Backups',
          description: 'Every night at 2 AM, automatically backup all database changes from last 24 hours. Store on AWS S3 with 30-day retention. Send confirmation email to admin with backup size and status.'
        },
        {
          title: 'Disaster Recovery',
          description: 'In case of system crash or data corruption, restore entire database to last known good state within 15 minutes. Minimize business downtime and data loss. Tested recovery process monthly.'
        },
        {
          title: 'Audit Trail & Compliance',
          description: 'Maintain backup logs for audit purposes. Generate monthly reports showing all backups, restores, and data changes. Essential for ISO certification and regulatory compliance.'
        }
      ],
      technicalDetails: {
        provider: 'MongoDB Atlas Backup / AWS S3',
        features: [
          'Automated incremental backups',
          'Cloud storage (AWS S3 / Google Cloud)',
          'Point-in-time recovery',
          'Encryption at rest',
          'Backup verification',
          'Retention policy management'
        ],
        integration: 'Integrated with MongoDB, File Storage'
      }
    },
    {
      id: 'email-agent',
      name: 'Email Marketing Agent',
      icon: Mail,
      color: 'from-cyan-500 to-cyan-600',
      status: 'coming_soon',
      shortDescription: 'Automated email campaigns for lead nurturing and customer engagement',
      benefits: [
        'Professional email templates',
        'Drip campaigns for lead nurturing',
        'Newsletter automation',
        'Event invitation emails',
        'Personalized email content',
        'Open rate and click tracking'
      ],
      useCases: [
        {
          title: 'Lead Nurture Campaigns',
          description: 'Create email drip sequences: Email 1 (Welcome + Project Overview), Email 2 (Amenities + Location Benefits), Email 3 (Pricing + Payment Plans), Email 4 (Customer Testimonials), Email 5 (Limited Time Offer). Send over 14 days with personalized content.'
        },
        {
          title: 'Monthly Newsletters',
          description: 'Automatically compile monthly newsletter with: New property launches, Construction updates with photos, Market insights, Customer success stories, Upcoming events. Send to all leads and customers to stay top-of-mind.'
        },
        {
          title: 'Event Marketing',
          description: 'Organize property exhibitions, site visit drives, or customer appreciation events. Send professional invitation emails with RSVP tracking, calendar invites, and venue details. Follow up with reminder emails.'
        }
      ],
      technicalDetails: {
        provider: 'SendGrid / Mailgun',
        features: [
          'Drag-and-drop email builder',
          'Template library',
          'Personalization variables',
          'A/B testing',
          'Analytics dashboard',
          'Spam score checking'
        ],
        integration: 'Integrated with CRM, Event Management'
      }
    },
    {
      id: 'analytics-agent',
      name: 'Business Intelligence Agent',
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      status: 'coming_soon',
      shortDescription: 'AI-powered insights and predictive analytics for business decisions',
      benefits: [
        'Predict monthly sales revenue',
        'Identify best-performing sales agents',
        'Forecast inventory sell-out dates',
        'Optimize pricing strategies',
        'Lead source ROI analysis',
        'Customer lifetime value prediction'
      ],
      useCases: [
        {
          title: 'Sales Forecasting',
          description: 'Based on historical data, current pipeline, and market trends, predict next 3 months sales with 85% accuracy. Help management plan inventory, adjust pricing, and allocate marketing budget. Update forecast weekly.'
        },
        {
          title: 'Agent Performance Optimization',
          description: 'Analyze each agent\'s performance: Leads assigned vs converted, Average deal size, Time to conversion, Customer satisfaction. Identify top performers and training needs. Suggest lead assignment optimization.'
        },
        {
          title: 'Marketing ROI Analysis',
          description: 'Track cost per lead for each marketing channel (Facebook Ads, Google Ads, Newspaper, Hoarding, Referral). Calculate conversion rate and revenue per channel. Recommend budget reallocation to maximize ROI.'
        }
      ],
      technicalDetails: {
        provider: 'Custom Analytics Engine',
        features: [
          'Predictive modeling',
          'Trend analysis',
          'Cohort analysis',
          'Funnel optimization',
          'Custom dashboards',
          'Automated insights'
        ],
        integration: 'Integrated with all data sources'
      }
    },
    {
      id: 'voice-agent',
      name: 'Voice Call Automation Agent',
      icon: Phone,
      color: 'from-yellow-500 to-yellow-600',
      status: 'coming_soon',
      shortDescription: 'AI voice assistant for automated calling and IVR systems',
      benefits: [
        'Automated lead qualification calls',
        'IVR for incoming customer inquiries',
        'Appointment scheduling via voice',
        'Payment reminder calls',
        'Survey and feedback collection',
        'Call recording and transcription'
      ],
      useCases: [
        {
          title: 'Lead Qualification Calls',
          description: 'AI voice agent calls new leads within 5 minutes, qualifies them with scripted questions (budget, timeline, property type), and books site visit for qualified leads. Handles 100+ calls per hour, never misses a lead.'
        },
        {
          title: 'Payment Reminder Calls',
          description: 'For overdue payments, AI makes polite reminder calls asking about payment status, offers to send payment link via SMS, and schedules callback if customer requests. Escalates to human agent only if needed.'
        },
        {
          title: 'Customer Satisfaction Surveys',
          description: 'After property handover, AI calls customers for satisfaction survey, collects ratings and feedback, identifies issues needing resolution, and generates detailed reports for management. 10x faster than manual surveys.'
        }
      ],
      technicalDetails: {
        provider: 'Twilio Voice / Exotel',
        features: [
          'Text-to-speech (TTS)',
          'Speech recognition',
          'Call routing',
          'IVR flows',
          'Call recording',
          'Sentiment analysis'
        ],
        integration: 'Integrated with CRM, Booking System'
      }
    },
    {
      id: 'document-agent',
      name: 'Document Processing Agent',
      icon: FileText,
      color: 'from-blue-600 to-blue-700',
      status: 'coming_soon',
      shortDescription: 'Automated document generation, verification, and management',
      benefits: [
        'Auto-generate booking agreements',
        'Create payment receipts instantly',
        'KYC document verification',
        'Legal document templates',
        'Digital signature integration',
        'Document search and retrieval'
      ],
      useCases: [
        {
          title: 'Agreement Generation',
          description: 'When booking is confirmed, automatically generate personalized sale agreement with customer details, property specifications, payment terms, legal clauses. Send for digital signature via DigiSign/DocuSign. Store signed copy in cloud.'
        },
        {
          title: 'KYC Verification',
          description: 'Customer uploads Aadhaar, PAN, Address proof. AI agent extracts information, validates against government databases, checks for discrepancies, and approves/rejects KYC within 2 minutes. Reduces fraud and manual effort.'
        },
        {
          title: 'Receipt Automation',
          description: 'For every payment received, instantly generate professional receipt PDF with company letterhead, payment details, GST breakdown, and QR code. Email and WhatsApp to customer automatically. Store in customer portal.'
        }
      ],
      technicalDetails: {
        provider: 'Custom + Cloud Storage',
        features: [
          'Template engine',
          'PDF generation',
          'OCR for document reading',
          'Digital signature integration',
          'Version control',
          'Cloud storage (AWS S3)'
        ],
        integration: 'Integrated with Booking System, Payments, Customer Portal'
      }
    },
    {
      id: 'security-agent',
      name: 'Security & Compliance Agent',
      icon: Shield,
      color: 'from-red-600 to-red-700',
      status: 'coming_soon',
      shortDescription: 'Automated security monitoring and compliance management',
      benefits: [
        'Real-time threat detection',
        'Suspicious activity alerts',
        'Data access monitoring',
        'Compliance report generation',
        'Password policy enforcement',
        'Audit trail maintenance'
      ],
      useCases: [
        {
          title: 'Fraud Detection',
          description: 'Monitor for suspicious patterns: Multiple bookings from same IP, Unusual payment patterns, Fake document uploads, Repeated failed login attempts. Alert security team immediately and auto-block if high-risk behavior detected.'
        },
        {
          title: 'Data Privacy Compliance',
          description: 'Ensure GDPR and data protection compliance: Auto-expire old customer data, Anonymize personal information in reports, Maintain consent records, Generate compliance reports for audits. Avoid legal penalties.'
        },
        {
          title: 'Access Control Monitoring',
          description: 'Track who accessed what data and when: Alert if staff accesses customer data outside working hours, Flag if sensitive documents downloaded to personal devices, Maintain complete audit trail for regulatory compliance.'
        }
      ],
      technicalDetails: {
        provider: 'Custom Security Engine',
        features: [
          'Anomaly detection',
          'Access logging',
          'Encryption management',
          'Compliance dashboards',
          'Alert system',
          'Incident response'
        ],
        integration: 'Integrated with all modules at security layer'
      }
    }
  ];

  const handleViewDetails = (agent) => {
    setSelectedAgent(agent);
    setShowInfoModal(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      coming_soon: { label: 'Coming Soon', color: 'bg-yellow-500' },
      active: { label: 'Active', color: 'bg-green-500' },
      beta: { label: 'Beta', color: 'bg-blue-500' },
      planned: { label: 'Planned', color: 'bg-gray-500' }
    };
    const config = statusConfig[status] || statusConfig.planned;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Agents Hub
              </h1>
              <p className="text-gray-600 mt-1">
                Intelligent automation agents to supercharge your real estate business
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Documentation Phase</p>
                <p className="text-sm text-yellow-700 mt-1">
                  ప్రతి AI Agent పక్కన <Info className="w-4 h-4 inline" /> icon click చేసి detailed information చూడండి. 
                  Implementation తర్వాత confirm చేసిన తర్వాత start అవుతుంది.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiAgents.map((agent) => {
            const IconComponent = agent.icon;
            return (
              <Card key={agent.id} className="glass-card hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${agent.color} shadow-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{agent.name}</CardTitle>
                        {getStatusBadge(agent.status)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full w-8 h-8 p-0"
                      onClick={() => handleViewDetails(agent)}
                    >
                      <Info className="w-5 h-5 text-ocean-primary" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{agent.shortDescription}</p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Key Benefits:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {agent.benefits.slice(0, 3).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    {agent.benefits.length > 3 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs"
                        onClick={() => handleViewDetails(agent)}
                      >
                        +{agent.benefits.length - 3} more benefits
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-12 glass-card p-8 text-center">
          <Bot className="w-16 h-16 mx-auto text-purple-500 mb-4" />
          <h3 className="text-2xl font-bold mb-2">More AI Agents Coming Soon!</h3>
          <p className="text-gray-600 mb-4">
            మీ business requirements ఆధారంగా మరిన్ని intelligent automation agents add చేస్తాము.
          </p>
          <p className="text-sm text-gray-500">
            Questions or custom agent requirements? Contact support team.
          </p>
        </div>
      </div>

      {/* Detailed Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedAgent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {React.createElement(selectedAgent.icon, { 
                    className: `w-8 h-8 bg-gradient-to-br ${selectedAgent.color} text-white p-1.5 rounded-lg` 
                  })}
                  <div>
                    <DialogTitle className="text-2xl">{selectedAgent.name}</DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">{selectedAgent.shortDescription}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Benefits Section */}
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Major Benefits to Real Estate Business
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedAgent.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                        <Zap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Use Cases Section */}
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Real-World Use Cases
                  </h3>
                  <div className="space-y-4">
                    {selectedAgent.useCases.map((useCase, idx) => (
                      <Card key={idx} className="border-l-4 border-blue-500">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold text-blue-900 mb-2">{useCase.title}</h4>
                          <p className="text-sm text-gray-700">{useCase.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Technical Details Section */}
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Technical Implementation Details
                  </h3>
                  <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-purple-900">Service Provider:</p>
                      <p className="text-sm text-gray-700">{selectedAgent.technicalDetails.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-900 mb-2">Features:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedAgent.technicalDetails.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-900">Integration Points:</p>
                      <p className="text-sm text-gray-700">{selectedAgent.technicalDetails.integration}</p>
                    </div>
                  </div>
                </div>

                {/* Status Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-yellow-600" />
                    <p className="font-semibold text-yellow-900">Implementation Status</p>
                  </div>
                  <p className="text-sm text-yellow-800">
                    This agent is currently in <strong>documentation phase</strong>. 
                    Implementation will begin after your review and confirmation. 
                    Estimated development time: 2-3 weeks.
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIAgentsHub;
