'use client';

import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

declare global {
  interface Window {
    dbAPI: {
      all(sql: string, params?: unknown[]): Promise<any[]>;
      get(sql: string, params?: unknown[]): Promise<any>;
    };
  }
}

export default function Home() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const sql = 'SELECT id, name FROM users LIMIT ? OFFSET ?';
        const params = [50, 0];

        const result = await window.dbAPI.all(sql, params);
        if (!cancelled) setRows(result);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background p-6">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>SQLite via Electron</CardTitle>
          <CardDescription>
            Queries run in the Electron main process; only rows are sent to the UI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">id</TableHead>
                  <TableHead>name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                      No rows loaded
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell>{r.name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
