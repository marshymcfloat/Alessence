"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

interface TagSelectorProps {
  selectedTagIds: number[];
  availableTags: Tag[];
  onTagChange: (tagIds: number[]) => void;
  onCreateTag?: (name: string) => void;
}

export function TagSelector({
  selectedTagIds,
  availableTags,
  onTagChange,
  onCreateTag,
}: TagSelectorProps) {
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onTagChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (newTagName.trim() && onCreateTag) {
      onCreateTag(newTagName.trim());
      setNewTagName("");
      setIsCreating(false);
    }
  };

  const selectedTags = availableTags.filter((tag) =>
    selectedTagIds.includes(tag.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="cursor-pointer"
            style={{
              backgroundColor: tag.color
                ? `${tag.color}20`
                : undefined,
              borderColor: tag.color || undefined,
            }}
            onClick={() => handleToggleTag(tag.id)}
          >
            {tag.name}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        ))}
        <Popover open={isCreating} onOpenChange={setIsCreating}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6">
              <Plus className="w-3 h-3 mr-1" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTag();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {availableTags.filter((tag) => !selectedTagIds.includes(tag.id)).length >
        0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs">
              Select from existing tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-1">
              {availableTags
                .filter((tag) => !selectedTagIds.includes(tag.id))
                .map((tag) => (
                  <Button
                    key={tag.id}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    {tag.name}
                  </Button>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

