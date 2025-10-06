"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Pause, Play, Terminal } from 'lucide-react';

interface Log {
  id: string;
  timestamp: number;
  service: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export function ServerLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (serviceFilter !== 'all') params.set('service', serviceFilter);
        if (severityFilter !== 'all') params.set('severity', severityFilter);
        
        const response = await fetch(`/api/logs?${params}`);
        const data = await response.json();
        setLogs(data.logs);

        if (autoScroll && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, [serviceFilter, severityFilter, isPaused, autoScroll]);

  const clearLogs = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'text-blue-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-foreground';
    }
  };

  const getServiceColor = (service: string) => {
    const colors: Record<string, string> = {
      gateway: 'bg-purple-500/10 text-purple-500',
      auth: 'bg-blue-500/10 text-blue-500',
      inventory: 'bg-green-500/10 text-green-500',
      order: 'bg-orange-500/10 text-orange-500',
      payment: 'bg-pink-500/10 text-pink-500',
    };
    return colors[service] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            <CardTitle>Server Logs</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearLogs}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="gateway">Gateway</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="order">Order</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant={autoScroll ? "default" : "outline"}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            Auto-scroll: {autoScroll ? 'On' : 'Off'}
          </Button>
        </div>

        <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/30 p-4" ref={scrollRef}>
          <div className="space-y-2 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No logs to display
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 items-start border-b border-border/50 pb-2 last:border-0"
                >
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${getServiceColor(log.service)}`}>
                    {log.service}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </span>
                  <span className="flex-1 text-foreground">
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{logs.length} log entries</span>
          {isPaused && <span className="text-yellow-500">⏸ Paused</span>}
        </div>
      </CardContent>
    </Card>
  );
}