"use client";

import { useState } from 'react';
import { useSupabase } from './AuthProvider';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Gpt = {
  id: string;
  client_id: string;
  client_secret: string;
};

interface CreateGptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGptCreated: () => void;
}

export default function CreateGptDialog({ isOpen, onClose, onGptCreated }: CreateGptDialogProps) {
  const { supabase, session } = useSupabase();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newGpt, setNewGpt] = useState<Gpt | null>(null);
  const [copied, setCopied] = useState<'id' | 'secret' | null>(null);

  const handleCopyToClipboard = (text: string, type: 'id' | 'secret') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`Copied ${type === 'id' ? 'Client ID' : 'Client Secret'}!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('GPT name is required.');
      return;
    }
    setIsLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('gpts')
      .insert({
        name,
        description,
        user_id: session?.user?.id,
      })
      .select('id, client_id, client_secret')
      .single();

    setIsLoading(false);

    if (error) {
      setError(error.message);
      toast.error('Failed to create GPT.');
    } else if (data) {
      toast.success('GPT created successfully!');
      setNewGpt(data);
      onGptCreated();
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    setNewGpt(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {!newGpt ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New GPT</DialogTitle>
              <DialogDescription>
                Give your new GPT a name and description. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    placeholder="My Awesome GPT"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="A short description of your GPT"
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>GPT Created Successfully!</DialogTitle>
              <DialogDescription>
                Save your Client ID and Client Secret. You will not be able to see the secret again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="client-id">Client ID</Label>
                <div className="flex items-center gap-2">
                  <Input id="client-id" value={newGpt.client_id} readOnly />
                  <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(newGpt.client_id, 'id')}>
                    {copied === 'id' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="client-secret">Client Secret</Label>
                <div className="flex items-center gap-2">
                  <Input id="client-secret" value={newGpt.client_secret} readOnly />
                  <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(newGpt.client_secret, 'secret')}>
                    {copied === 'secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}