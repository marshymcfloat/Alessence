// components/UploadFiles.tsx
"use client";

import { getAllFiles } from "@/lib/actions/fileActionts";
import { useQuery } from "@tanstack/react-query";
import { Item, ItemHeader, ItemTitle } from "../ui/item";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Cloud, LoaderCircle, XCircle } from "lucide-react";
import { Input } from "../ui/input";
import { useRef } from "react";
import { File as DBFile } from "@repo/db";
import { Separator } from "../ui/separator";

type UploadFilesProps = {
  value?: (DBFile | File)[];
  onChange: (files: (DBFile | File)[]) => void;
};

export default function UploadFiles({
  value = [],
  onChange,
}: UploadFilesProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const {
    data: filesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["files"],
    queryFn: getAllFiles,
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

  return (
    <div className="w-full space-y-3 rounded-md border p-4">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : filesData?.data?.files && filesData.data.files.length > 0 ? (
        <>
          <p className="text-sm font-medium text-slate-600">
            Select existing file(s):
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {filesData.data.files.map((file: DBFile) => (
              <Item
                key={file.id}
                variant={"outline"}
                className={`cursor-pointer transition-colors hover:border-blue-500 ${
                  selectedDbFileIds.has(file.id)
                    ? "border-2 border-blue-600 bg-blue-50"
                    : "border-slate-300 bg-slate-50"
                }`}
                onClick={() => handleDbFileToggle(file)}
              >
                <ItemHeader>
                  <ItemTitle>{file.name}</ItemTitle>
                </ItemHeader>
              </Item>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="font-medium">OR</span>
            <Separator className="flex-1" />
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
