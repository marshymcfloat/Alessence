"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
} from "@/lib/actions/profileActions";
import { getGamificationStats } from "@/lib/actions/progressActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Camera,
  Edit,
  Flame,
  Calendar,
  BookOpen,
  FileText,
  Layers,
  Timer,
  Loader2,
  ArrowLeft,
  GraduationCap,
  Medal,
  BarChart3,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";

export default function ProfilePageContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const result = await getMyProfile();
      return result.success ? result.data : null;
    },
  });

  const { data: gamificationData } = useQuery({
    queryKey: ["gamification-stats"],
    queryFn: async () => {
      const result = await getGamificationStats();
      return result.success ? result.data : null;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; bio?: string }) => updateProfile(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Profile updated!");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return uploadProfilePicture(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Profile picture updated!");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setIsUploadDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to upload picture");
      }
    },
    onError: () => {
      toast.error("Failed to upload picture");
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeProfilePicture,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Profile picture removed!");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      } else {
        toast.error(result.error || "Failed to remove picture");
      }
    },
    onError: () => {
      toast.error("Failed to remove picture");
    },
  });

  const handleStartEdit = () => {
    if (profileData) {
      setEditName(profileData.name);
      setEditBio(profileData.bio || "");
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({ name: editName, bio: editBio });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-8 max-w-5xl text-center">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const xpProgress = profileData?.gamification.xpProgress || gamificationData?.xp.progress || 0;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl px-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/${userId}/dashboard`)}
        className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Identity & Core Status (1/3) */}
        <div className="md:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="h-24 bg-slate-100 dark:bg-slate-800/50 w-full" />
              <div className="px-6 pb-6 -mt-12 relative">
                <div className="relative inline-block group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                    <AvatarImage src={profileData.profilePicture || undefined} />
                    <AvatarFallback className="text-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {getInitials(profileData.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Profile Picture</DialogTitle>
                        <DialogDescription>
                          Upload a new profile picture. Max 5MB.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadMutation.isPending}
                            className="w-full"
                          >
                            {uploadMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Camera className="h-4 w-4 mr-2" />
                            )}
                            Select Image
                          </Button>
                          {profileData.profilePicture && (
                            <Button
                              variant="outline"
                              onClick={() => removeMutation.mutate()}
                              disabled={removeMutation.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove Current Picture
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="mt-4 space-y-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                        className="font-semibold"
                      />
                      <Textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Write a short bio..."
                        rows={3}
                        className="text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h1 className="text-xl font-bold text-foreground">{profileData.name}</h1>
                          <p className="text-sm text-muted-foreground">{profileData.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleStartEdit}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {profileData.bio && (
                        <p className="text-sm text-foreground/80 mt-3 leading-relaxed border-l-2 border-border pl-3 py-1">
                          {profileData.bio}
                        </p>
                      )}
                      
                      <div className="pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Member since {format(new Date(profileData.createdAt), "MMMM yyyy")}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Proficiency & Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Level / Rank */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      Rank {profileData.gamification.level}
                    </span>
                    <span className="text-muted-foreground text-xs">{profileData.gamification.totalXp} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-right">
                    {Math.round(100 - xpProgress)}% to next rank
                  </p>
                </div>

                <Separator />

                {/* Streak */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md text-orange-600 dark:text-orange-400">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Study Streak</p>
                      <p className="text-xs text-muted-foreground">{profileData.gamification.longestStreak} day record</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{profileData.gamification.streak}</p>
                    <p className="text-xs text-muted-foreground">Current</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: Academic Stats & Milestones (2/3) */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Statistics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              Academic Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Exams Taken</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{profileData.stats.exams}</p>
                    <FileText className="w-4 h-4 text-muted-foreground opacity-50" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Notes Created</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{profileData.stats.notes}</p>
                    <BookOpen className="w-4 h-4 text-muted-foreground opacity-50" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Sessions</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{profileData.stats.studySessions}</p>
                    <Timer className="w-4 h-4 text-muted-foreground opacity-50" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Decks</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{profileData.stats.flashcardDecks}</p>
                    <Layers className="w-4 h-4 text-muted-foreground opacity-50" />
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Milestones / Achievements */}
          {gamificationData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Medal className="w-5 h-5 text-muted-foreground" />
                  Milestones
                </h2>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{gamificationData?.achievements?.unlockedCount || 0}</span>
                  <span className="mx-1">/</span>
                  <span>{gamificationData?.achievements?.total || 0} Unlocked</span>
                </div>
              </div>

              <Tabs defaultValue="achieved" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
                  <TabsTrigger value="achieved" className="text-xs">Achieved</TabsTrigger>
                  <TabsTrigger value="available" className="text-xs">Achievable</TabsTrigger>
                </TabsList>

                <TabsContent value="achieved" className="space-y-3">
                  {gamificationData.achievements?.unlocked && gamificationData.achievements.unlocked.length > 0 ? (
                    gamificationData.achievements.unlocked.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="group flex items-center gap-4 p-3 rounded-lg border border-border/60 bg-card hover:border-border transition-all"
                      >
                        <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                          {achievement.icon || "🏆"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm truncate">{achievement.name}</p>
                            <Badge variant="outline" className="text-[10px] h-5 border-green-200 text-green-700 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Completed
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                      No milestones achieved yet. Check the "Achievable" tab!
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="available" className="space-y-3">
                  {gamificationData.achievements?.locked && gamificationData.achievements.locked.length > 0 ? (
                    gamificationData.achievements.locked.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="group flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:border-border transition-all opacity-70 hover:opacity-100"
                      >
                        <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl grayscale">
                          {achievement.icon || "🎯"}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-sm text-foreground group-hover:text-foreground truncate">
                              {achievement.name}
                            </p>
                            <Badge variant="secondary" className="text-[10px] h-5">
                              +{achievement.xpReward ?? 0} XP
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {achievement.description || "Complete the required activity to unlock."}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                      All milestones unlocked! Amazing work!
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
