import { Download } from "lucide-react";
import { Button } from "components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import EndUserView from "views/EndUserView";
import ProviderView from "views/ProviderView";
import AdminView from "views/AdminView";
import DataScientistView from "views/DataScientistView";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600" />
            <div>
              <h1 className="text-lg font-semibold">Steam Reviews – Sentiment (SVM)</h1>
              <p className="text-xs text-muted-foreground">End-user • Provider • Admin • Data Scientist</p>
            </div>
          </div>
          <Button variant="secondary" className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="enduser" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl">
            <TabsTrigger value="enduser">End-user</TabsTrigger>
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="ds">Data Scientist</TabsTrigger>
          </TabsList>

          <TabsContent value="enduser" className="mt-6">
            <EndUserView />
          </TabsContent>
          <TabsContent value="provider" className="mt-6">
            <ProviderView />
          </TabsContent>
          <TabsContent value="admin" className="mt-6">
            <AdminView />
          </TabsContent>
          <TabsContent value="ds" className="mt-6">
            <DataScientistView />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-10 text-xs text-muted-foreground">
        <div className="mt-6">Algorithm: Support Vector Machine • Dataset: Steam Reviews • © Mockup for coursework</div>
      </footer>
    </div>
  );
}
