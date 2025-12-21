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
import type { File as DBFile } from "@repo/db";
import { Separator } from "../ui/separator";
import { SummaryFileInput } from "@repo/types";

type UploadFileProps = {
  value?: SummaryFileInput;
  onChange: (file: SummaryFileInput | undefined) => void;
};

export default function UploadFile({
  value,
  onChange,
}: UploadFileProps) {
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
    const newFile = e.target.files?.[0];
    if (newFile) {
      onChange(newFile);
    }
  };

  const handleDbFileSelect = (file: DBFile) => {
    onChange(file);
  };

  const handleRemoveFile = () => {
    onChange(undefined);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
    }
  };

  if (isError) {
    return <h1>{error.message || "Error fetching files"}</h1>;
  }

  const isDbFile = value && "id" in value;
  const isNewFile = value && value instanceof File;

  return (
    <div className="w-full space-y-3 rounded-md border p-4">
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : filesData?.data?.files && filesData.data.files.length > 0 ? (
        <>
          <p className="text-sm font-medium text-slate-600">
            Select existing file:
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {filesData.data.files.map((file: DBFile) => (
              <Item
                key={file.id}
                variant={"outline"}
                className={`cursor-pointer transition-colors hover:border-blue-500 ${
                  isDbFile && value.id === file.id
                    ? "border-2 border-blue-600 bg-blue-50"
                    : "border-slate-300 bg-slate-50"
                }`}
                onClick={() => handleDbFileSelect(file)}
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
              Upload a new file below to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <Input
        type="file"
        className="hidden"
        ref={hiddenInputRef}
        onChange={handleFileSelect}
      />

      {isNewFile && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">New file to upload:</p>
          <Item
            variant={"outline"}
            className="flex items-center justify-between border-blue-600 bg-blue-50"
          >
            <ItemHeader className="flex w-full flex-row items-center justify-between">
              <ItemTitle>{value.name}</ItemTitle>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-slate-500 hover:text-slate-800"
                onClick={handleRemoveFile}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </ItemHeader>
          </Item>
        </div>
      )}

      {isDbFile && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Selected file:</p>
          <Item
            variant={"outline"}
            className="flex items-center justify-between border-blue-600 bg-blue-50"
          >
            <ItemHeader className="flex w-full flex-row items-center justify-between">
              <ItemTitle>{value.name}</ItemTitle>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-slate-500 hover:text-slate-800"
                onClick={handleRemoveFile}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </ItemHeader>
          </Item>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        className="w-full underline"
        onClick={() => hiddenInputRef.current?.click()}
      >
        Upload New File
      </Button>
    </div>
  );
}

