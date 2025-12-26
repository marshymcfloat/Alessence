"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
  removeProfilePicture,
  type UserProfile,
} from "@/lib/actions/profileActions";
import { getGamificationStats } from "@/lib/actions/gamificationActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Camera,
  Edit,
  Save,
  X,
  Flame,
  Star,
  Trophy,
  Calendar,
  BookOpen,
  FileText,
  Layers,
  Timer,
  Trash2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";

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
      <div className="container mx-auto py-8 max-w-4xl">
        <Skeleton className="h-10 w-20 mb-6" />
        <div className="flex gap-6 items-start">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto py-8 max-w-4xl text-center">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const xpProgress = profileData?.gamification.xpProgress || gamificationData?.xp.progress || 0;

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl px-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/${userId}/dashboard`)}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-6 items-start md:items-center"
      >
        {/* Avatar with Edit Button */}
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-800 shadow-xl">
            <AvatarImage src={profileData.profilePicture || undefined} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
              {getInitials(profileData.name)}
            </AvatarFallback>
          </Avatar>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Profile Picture</DialogTitle>
                <DialogDescription>
                  Upload a new profile picture. Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex justify-center">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profileData.profilePicture || undefined} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                      {getInitials(profileData.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    Upload New Picture
                  </Button>
                  {profileData.profilePicture && (
                    <Button
                      variant="destructive"
                      onClick={() => removeMutation.mutate()}
                      disabled={removeMutation.isPending}
                    >
                      {removeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Name and Bio */}
        <div className="flex-1 space-y-2">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                className="text-2xl font-bold h-12"
              />
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Write a short bio..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{profileData.name}</h1>
                <Button variant="ghost" size="icon" onClick={handleStartEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">{profileData.email}</p>
              {profileData.bio && (
                <p className="text-sm max-w-lg">{profileData.bio}</p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {format(new Date(profileData.createdAt), "MMMM yyyy")}
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {profileData.stats.exams}
              </p>
              <p className="text-xs text-muted-foreground">Exams</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {profileData.stats.flashcardDecks}
              </p>
              <p className="text-xs text-muted-foreground">Decks</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {profileData.stats.notes}
              </p>
              <p className="text-xs text-muted-foreground">Notes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50 dark:border-orange-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Timer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {profileData.stats.studySessions}
              </p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Gamification Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Streak Card */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                {profileData.gamification.streak}
              </p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-200/50 dark:border-orange-800/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Longest streak</span>
              <span className="font-medium">{profileData.gamification.longestStreak} days</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Total study days</span>
              <span className="font-medium">{profileData.gamification.totalStudyDays} days</span>
            </div>
          </div>
        </Card>

        {/* Level Card */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Star className="h-8 w-8 text-purple-500 fill-purple-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                Level {profileData.gamification.level}
              </p>
              <p className="text-sm text-muted-foreground">{profileData.gamification.totalXp} XP</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-800/30 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to next level</span>
              <span className="font-medium">{Math.round(xpProgress)}%</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        </Card>

        {/* Achievements Card */}
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                {gamificationData?.achievements.unlockedCount || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                of {gamificationData?.achievements.total || 0} achievements
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Achievements */}
      {profileData.gamification.recentAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Recent Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {profileData.gamification.recentAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className="p-4 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200/50 dark:border-yellow-800/30"
              >
                <div className="text-center space-y-2">
                  <span className="text-3xl">{achievement.icon}</span>
                  <p className="font-medium text-sm">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {achievement.description}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    +{achievement.xpReward} XP
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Achievements Button */}
      {gamificationData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4">All Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {gamificationData.achievements.unlocked.map((achievement) => (
              <Card
                key={achievement.id}
                className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800/50"
              >
                <div className="text-center space-y-1">
                  <span className="text-2xl">{achievement.icon}</span>
                  <p className="font-medium text-xs">{achievement.name}</p>
                </div>
              </Card>
            ))}
            {gamificationData.achievements.locked.map((achievement) => (
              <Card
                key={achievement.id}
                className="p-3 bg-muted/30 border-muted opacity-50"
              >
                <div className="text-center space-y-1">
                  <span className="text-2xl">🔒</span>
                  <p className="font-medium text-xs text-muted-foreground">
                    {achievement.name}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

