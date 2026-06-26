import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Users, Plus, Copy, LogIn, Crown, User, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface GroupMember {
  user_id: string;
  role: string;
  joined_at: string;
}

export default function GroupsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch my groups
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, role, groups(*)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data as Array<{ group_id: string; role: string; groups: Group | null }>).map(m => ({
        ...(m.groups as Group),
        myRole: m.role,
      }));
    },
  });

  // Fetch members of each group (for a selected group)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { data: members = [] } = useQuery({
    queryKey: ['group-members', selectedGroupId],
    enabled: !!selectedGroupId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, role, joined_at')
        .eq('group_id', selectedGroupId!);
      if (error) throw error;
      return data as GroupMember[];
    },
  });

  // Create group
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name, created_by: user!.id })
        .select()
        .single();
      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user!.id, role: 'owner' });
      if (memberError) throw memberError;

      return group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setCreateOpen(false);
      setCreateName('');
      setSelectedGroupId(group.id);
      toast.success('小组已创建！分享邀请码给小伙伴');
    },
    onError: () => toast.error('创建失败，请重试'),
  });

  // Join group
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data: group, error: findError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', code.trim().toLowerCase())
        .maybeSingle();
      if (findError) throw findError;
      if (!group) throw new Error('邀请码无效，请检查后重试');

      // Check not already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (existing) throw new Error('你已经在这个小组里了');

      const { error: joinError } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user!.id, role: 'member' });
      if (joinError) throw joinError;

      return group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setJoinOpen(false);
      setJoinCode('');
      setSelectedGroupId(group.id);
      toast.success(`成功加入「${group.name}」`);
    },
    onError: (err: Error) => toast.error(err.message || '加入失败'),
  });

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('邀请码已复制！');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <MainLayout
      selectedCategoryId={null}
      onSelectCategory={() => {}}
      selectedStatus={null}
      onSelectStatus={() => {}}
      bookmarkedCount={0}
      onShowBookmarked={() => {}}
      showBookmarked={false}
      deletedCount={0}
      onShowDeleted={() => {}}
      showDeleted={false}
    >
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的小组</h1>
            <p className="text-sm text-muted-foreground mt-1">与小伙伴共享岗位信息</p>
          </div>
          <div className="flex gap-2">
            {/* Join Group */}
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  加入小组
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>通过邀请码加入</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>邀请码</Label>
                    <Input
                      placeholder="输入8位邀请码"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value)}
                      maxLength={8}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => joinMutation.mutate(joinCode)}
                    disabled={!joinCode.trim() || joinMutation.isPending}
                  >
                    确认加入
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Group */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  创建小组
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新小组</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>小组名称</Label>
                    <Input
                      placeholder="例如：秋招备战队"
                      value={createName}
                      onChange={e => setCreateName(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createMutation.mutate(createName)}
                    disabled={!createName.trim() || createMutation.isPending}
                  >
                    创建
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Group List */}
        {isLoading ? (
          <div className="text-muted-foreground text-sm py-8 text-center">加载中...</div>
        ) : groups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">还没有加入任何小组</p>
              <p className="text-sm text-muted-foreground/70">创建小组或输入邀请码加入朋友的小组</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <Card
                key={group.id}
                className={`cursor-pointer transition-colors ${selectedGroupId === group.id ? 'border-primary' : 'hover:border-muted-foreground/40'}`}
                onClick={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <Badge variant={group.myRole === 'owner' ? 'default' : 'secondary'} className="text-xs">
                        {group.myRole === 'owner' ? '创建者' : '成员'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground font-mono tracking-wider">{group.invite_code}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={e => { e.stopPropagation(); copyInviteCode(group.invite_code); }}
                      >
                        {copiedCode === group.invite_code
                          ? <Check className="h-3.5 w-3.5 text-primary" />
                          : <Copy className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs">邀请码：分享给小伙伴即可加入</CardDescription>
                </CardHeader>

                {selectedGroupId === group.id && (
                  <CardContent className="pt-0">
                    <Separator className="mb-3" />
                    <p className="text-xs text-muted-foreground mb-2 font-medium">小组成员（{members.length}人）</p>
                    <div className="space-y-1.5">
                      {members.map(m => (
                        <div key={m.user_id} className="flex items-center gap-2 text-sm">
                          {m.role === 'owner'
                            ? <Crown className="h-3.5 w-3.5 text-primary" />
                            : <User className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                          <span className="text-muted-foreground font-mono text-xs">{m.user_id.slice(0, 8)}...</span>
                          {m.user_id === user?.id && <Badge variant="outline" className="text-xs py-0">你</Badge>}
                          <span className="text-xs text-muted-foreground/60 ml-auto">
                            {m.role === 'owner' ? '创建者' : '成员'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
