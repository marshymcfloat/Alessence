"use client";

import { getAllFiles } from "@/lib/actions/fileActionts";
import { getFilesSharedWithMe } from "@/lib/actions/sharingActions";
import { useQuery } from "@tanstack/react-query";
import { Item, ItemHeader, ItemTitle } from "../ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Cloud, LoaderCircle, XCircle, Users } from "lucide-react";
import { Input } from "../ui/input";
import { useRef, useState } from "react";
import type { File as DBFile } from "@repo/db";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

type UploadFilesProps = {
  value?: (DBFile | File)[];
  onChange: (files: (DBFile | File)[]) => void;
};

// Type for shared files from the API
interface SharedFileItem {
  id: number;
  permission: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  file: {
    id: number;
    name: string;
    type: string;
    fileUrl: string;
  };
}

export default function UploadFiles({
  value = [],
  onChange,
}: UploadFilesProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"my-files" | "shared">("my-files");

  const {
    data: filesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["files"],
    queryFn: getAllFiles,
  });

  // Fetch files shared with the user
  const { data: sharedFilesData, isLoading: isLoadingShared } = useQuery({
    queryKey: ["sharedFilesWithMe"],
    queryFn: async () => {
      const result = await getFilesSharedWithMe();
      if (!result.success) return [];
      return result.data || [];
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      onChange([...value, ...newFiles]);
    }
  };

  const handleDbFileToggle = (file: DBFile) => {
    const isSelected = value.some(
      (selected) => "id" in selected && selected.id === file.id
    );
    if (isSelected) {
      onChange(
        value.filter(
          (selected) => !("id" in selected) || selected.id !== file.id
        )
      );
    } else {
      onChange([...value, file]);
    }
  };

  const handleRemoveNewFile = (fileToRemove: File) => {
    onChange(value.filter((file) => file !== fileToRemove));
  };

  if (isError) {
    return <h1>{error.message || "Error fetching files"}</h1>;
  }

  const newFiles = value.filter((f): f is File => f instanceof File);
  const selectedDbFileIds = new Set(
    value.filter((f): f is DBFile => "id" in f).map((f) => f.id)
  );

  const sharedFiles = sharedFilesData || [];
  const myFiles = filesData?.data?.files || [];

  const handleSharedFileToggle = (sharedFile: SharedFileItem) => {
    // Use the actual file from the shared item
    const file = {
      id: sharedFile.file.id,
      name: sharedFile.file.name,
      type: sharedFile.file.type,
      fileUrl: sharedFile.file.fileUrl,
    } as DBFile;

    const isSelected = selectedDbFileIds.has(file.id);
    if (isSelected) {
      onChange(
        value.filter(
          (selected) => !("id" in selected) || selected.id !== file.id
        )
      );
    } else {
      onChange([...value, file]);
    }
  };

  return (
    <div className="w-full space-y-3 rounded-md border p-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "my-files" | "shared")}>
        <TabsList className="grid w-full grid-cols-2 mb-3">
          <TabsTrigger value="my-files" className="text-xs">
            My Files
            {myFiles.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {myFiles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="shared" className="text-xs">
            <Users className="size-3 mr-1" />
            Shared with Me
            {sharedFiles.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {sharedFiles.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-files" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : myFiles.length > 0 ? (
            <>
              <p className="text-sm font-medium text-slate-600 mb-2">
                Select existing file(s):
              </p>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {myFiles.map((file: DBFile) => (
                  <Item
                    key={file.id}
                    variant={"outline"}
                    className={`cursor-pointer transition-colors hover:border-blue-500 ${
                      selectedDbFileIds.has(file.id)
                        ? "border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                    }`}
                    onClick={() => handleDbFileToggle(file)}
                  >
                    <ItemHeader>
                      <ItemTitle>{file.name}</ItemTitle>
                    </ItemHeader>
                  </Item>
                ))}
              </div>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Cloud />
                </EmptyMedia>
                <EmptyTitle>No files in storage</EmptyTitle>
                <EmptyDescription>
                  Upload new file(s) below to get started.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-0">
          {isLoadingShared ? (
            <div className="flex items-center justify-center p-4">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : sharedFiles.length > 0 ? (
            <>
              <p className="text-sm font-medium text-slate-600 mb-2">
                Select file(s) shared by friends:
              </p>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {sharedFiles.map((sharedFile: SharedFileItem) => (
                  <Item
                    key={sharedFile.id}
                    variant={"outline"}
                    className={`cursor-pointer transition-colors hover:border-green-500 ${
                      selectedDbFileIds.has(sharedFile.file.id)
                        ? "border-2 border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
                    }`}
                    onClick={() => handleSharedFileToggle(sharedFile)}
                  >
                    <ItemHeader className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <ItemTitle className="truncate">{sharedFile.file.name}</ItemTitle>
                        <p className="text-xs text-muted-foreground">
                          Shared by {sharedFile.owner.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
                        {sharedFile.permission}
                      </Badge>
                    </ItemHeader>
                  </Item>
                ))}
              </div>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No shared files</EmptyTitle>
                <EmptyDescription>
                  Files shared by friends will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-muted-foreground">OR UPLOAD NEW</span>
        <Separator className="flex-1" />
      </div>

      <Input
        type="file"
        multiple
        className="hidden"
        ref={hiddenInputRef}
        onChange={handleFileSelect}
      />

      {newFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">New file(s) to upload:</p>
          {newFiles.map((file, index) => (
            <Item
              key={`${file.name}-${index}`}
              variant={"outline"}
              className="flex items-center justify-between border-blue-600 bg-blue-50"
            >
              <ItemHeader className="flex w-full flex-row items-center justify-between">
                <ItemTitle>{file.name}</ItemTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-slate-500 hover:text-slate-800"
                  onClick={() => handleRemoveNewFile(file)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </ItemHeader>
            </Item>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        className="w-full underline"
        onClick={() => hiddenInputRef.current?.click()}
      >
        Upload New File(s)
      </Button>
    </div>
  );
}
