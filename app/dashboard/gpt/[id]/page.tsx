"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GptDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto p-8">
        <Button variant="outline" onClick={() => router.back()}>
            &larr; Back to Dashboard
        </Button>
        <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold">Manage GPT</h1>
            <p className="mt-2 text-gray-600">GPT ID: {id}</p>
            <div className="mt-8 border-t pt-6">
                <h2 className="text-xl font-semibold">Coming Soon</h2>
                <p className="mt-2 text-gray-500">
                    User management, analytics, and detailed configuration for this GPT will be available here soon.
                </p>
            </div>
        </div>
    </div>
  );
}