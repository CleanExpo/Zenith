'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AcademicDatabaseSearch } from '@/components/academic-databases/AcademicDatabaseSearch';
import { CitationFormatter } from '@/components/citation-management/CitationFormatter';
import { useCitationManagement } from '@/hooks/useCitationManagement';
import { CitationToolType } from '@/lib/services/citationManagement/citationServiceFactory';
import { AcademicPublication } from '@/lib/services/academicDatabases/baseAcademicDatabaseService';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Search, BookOpen, FileText, Settings } from 'lucide-react';

export function CitationManagementClient() {
  // State for the citation tool credentials
  const [toolType, setToolType] = useState<CitationToolType | ''>('');
  const [apiKey, setApiKey] = useState('');
  const [userId, setUserId] = useState('');
  
  // State for the selected publication
  const [selectedPublication, setSelectedPublication] = useState<AcademicPublication | null>(null);
  
  // Get the citation management hook
  const { getAvailableToolTypes } = useCitationManagement();
  
  // Toast
  const { toast } = useToast();
  
  // Load saved credentials from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCredentials = localStorage.getItem('citationCredentials');
      
      if (savedCredentials) {
        try {
          const { toolType, apiKey, userId } = JSON.parse(savedCredentials);
          setToolType(toolType);
          setApiKey(apiKey);
          setUserId(userId);
        } catch (error) {
          console.error('Error parsing saved credentials', error);
        }
      }
    }
  }, []);
  
  // Handle publication selection
  const handlePublicationSelect = (publication: AcademicPublication) => {
    setSelectedPublication(publication);
    
    // Scroll to the citation formatter
    const formatterElement = document.getElementById('citation-formatter');
    if (formatterElement) {
      formatterElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Citation Management</h1>
      </div>
      
      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search Academic Databases
          </TabsTrigger>
          <TabsTrigger value="citations">
            <BookOpen className="h-4 w-4 mr-2" />
            My Citations
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-6">
          <AcademicDatabaseSearch
            onPublicationSelect={handlePublicationSelect}
          />
          
          {selectedPublication && (
            <div id="citation-formatter">
              <Separator className="my-6" />
              
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Format Citation</h2>
                <p className="text-muted-foreground">
                  Format the selected publication in different citation styles
                </p>
              </div>
              
              {(!toolType || !apiKey || !userId) ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Citation Tool Required</CardTitle>
                    <CardDescription>
                      You need to configure a citation tool in the Settings tab to format citations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => {
                        const settingsTab = document.querySelector('[data-value="settings"]');
                        if (settingsTab instanceof HTMLElement) {
                          settingsTab.click();
                        }
                      }}
                    >
                      Go to Settings
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <CitationFormatter
                  publication={selectedPublication}
                  toolType={toolType}
                  apiKey={apiKey}
                  userId={userId}
                />
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="citations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Citations</CardTitle>
              <CardDescription>
                View and manage your saved citations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!toolType || !apiKey || !userId) ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Citation Tool Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to configure a citation tool in the Settings tab to view your citations
                  </p>
                  <Button
                    onClick={() => {
                      const settingsTab = document.querySelector('[data-value="settings"]');
                      if (settingsTab instanceof HTMLElement) {
                        settingsTab.click();
                      }
                    }}
                  >
                    Go to Settings
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your Citations</h3>
                  <p className="text-muted-foreground mb-4">
                    Search for publications in the Search tab and add them to your citation library
                  </p>
                  <Button
                    onClick={() => {
                      const searchTab = document.querySelector('[data-value="search"]');
                      if (searchTab instanceof HTMLElement) {
                        searchTab.click();
                      }
                    }}
                  >
                    Search Academic Databases
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Citation Tool Settings</CardTitle>
              <CardDescription>
                Configure your citation management tool credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Tool Type */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="toolType" className="text-right font-medium">
                    Tool
                  </label>
                  <select
                    id="toolType"
                    value={toolType}
                    onChange={(e) => setToolType(e.target.value as CitationToolType)}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a citation tool</option>
                    <option value="zotero">Zotero</option>
                    <option value="mendeley">Mendeley</option>
                  </select>
                </div>
                
                {/* API Key */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="apiKey" className="text-right font-medium">
                    API Key
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                
                {/* User ID */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="userId" className="text-right font-medium">
                    User ID
                  </label>
                  <input
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                
                {/* Remember Credentials */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">
                    <Button
                      onClick={() => {
                        if (toolType && apiKey && userId) {
                          localStorage.setItem('citationCredentials', JSON.stringify({
                            toolType,
                            apiKey,
                            userId
                          }));
                          
                          toast({
                            title: 'Settings Saved',
                            description: 'Your citation tool settings have been saved'
                          });
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Please fill in all fields',
                            variant: 'destructive'
                          });
                        }
                      }}
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Help & Documentation</CardTitle>
              <CardDescription>
                Learn how to use citation management tools with Zenith
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Zotero Integration</h3>
                <p>
                  To use Zotero with Zenith, you need to:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Create a Zotero account at <a href="https://www.zotero.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">zotero.org</a></li>
                  <li>Go to <a href="https://www.zotero.org/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Zotero API Keys</a> and create a new key</li>
                  <li>Make sure to grant read/write permissions to your library</li>
                  <li>Copy your API key and user ID to the settings above</li>
                </ol>
                
                <h3 className="text-lg font-semibold mt-6">Mendeley Integration</h3>
                <p>
                  To use Mendeley with Zenith, you need to:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Create a Mendeley account at <a href="https://www.mendeley.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mendeley.com</a></li>
                  <li>Go to <a href="https://dev.mendeley.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mendeley Developer Portal</a> and create a new application</li>
                  <li>Copy your Client ID as the API key and your Mendeley ID as the user ID</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
