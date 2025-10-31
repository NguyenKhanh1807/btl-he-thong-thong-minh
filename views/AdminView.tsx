import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users2, Shield, Download, Settings } from "lucide-react";
import { Input } from "../components/ui/input";
import { StatCard } from "../components/StatCard";

export default function AdminView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Users" value="1,204" icon={Users2} />
        <StatCard title="API Uptime" value="99.9%" icon={Shield} />
        <StatCard title="Queued Reports" value="3" icon={Download} />
        <StatCard title="Spam Flags (24h)" value="27" icon={Settings} />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {["Buy bots detected", "Offensive language", "Duplicate review"].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-xl">
              <div className="text-sm">{item}</div>
              <div className="flex gap-2">
                <Button variant="secondary" className="rounded-xl">
                  Ignore
                </Button>
                <Button className="rounded-xl">Remove</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>User & Role Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Input placeholder="Search users..." className="rounded-xl" />
            <Button variant="secondary" className="rounded-xl">
              <Users2 className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["End-user", "Provider", "Data Scientist"].map((role, i) => (
              <div key={i} className="p-3 border rounded-xl flex items-center justify-between text-sm">
                <span className="font-medium">{role}</span>
                <Button variant="secondary" className="rounded-xl">
                  Grant
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
