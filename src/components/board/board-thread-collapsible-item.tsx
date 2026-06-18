"use client";

import { ChevronDown, MessageSquare, Pin } from "lucide-react";
import * as React from "react";

import { BoardAuthorAvatar } from "@/components/board/board-author-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { BoardMessage, BoardThread } from "@/data/board/communication-posts";
import { cn } from "@/lib/utils";

type BoardThreadCollapsibleItemProps = {
  thread: BoardThread;
};

function BoardMessageBlock({
  message,
  isComment,
}: {
  message: BoardMessage;
  isComment: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3",
        isComment && "ml-3 border-l-2 border-border pl-4",
      )}
    >
      <BoardAuthorAvatar author={message.author} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium text-foreground">{message.author}</span>
          <span className="text-muted-foreground">{message.createdAt}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export function BoardThreadCollapsibleItem({
  thread,
}: BoardThreadCollapsibleItemProps) {
  const [open, setOpen] = React.useState(false);
  const [post, ...comments] = thread.messages;
  const postCreatedAt = post?.createdAt ?? "";
  const commentCount = comments.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card">
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
            "hover:bg-muted/50",
            open && "border-b border-border",
          )}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {thread.pinned ? (
              <Pin className="size-3.5 shrink-0 text-primary" aria-label="고정" />
            ) : null}
            <Badge variant="outline" className="shrink-0">
              {thread.category}
            </Badge>
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {thread.title}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
            {commentCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3.5" />
                {commentCount}
              </span>
            ) : null}
            <span className="hidden sm:inline">{postCreatedAt}</span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 px-4 py-4">
            <p className="text-sm text-muted-foreground sm:hidden">
              {postCreatedAt}
            </p>
            {post ? <BoardMessageBlock message={post} isComment={false} /> : null}
            {comments.map((comment, index) => (
              <BoardMessageBlock
                key={`${comment.createdAt}-${comment.author}-${index}`}
                message={comment}
                isComment
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
