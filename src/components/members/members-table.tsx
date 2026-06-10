import type { Profile } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function roleLabel(role: Profile["role"]) {
  return role === "master" ? "마스터" : "관리자";
}

export function MembersTable({ members }: { members: Profile[] }) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">등록된 관리자가 없습니다.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이메일</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.email}</TableCell>
            <TableCell>{member.name ?? "-"}</TableCell>
            <TableCell>
              <Badge
                variant={member.role === "master" ? "default" : "secondary"}
              >
                {roleLabel(member.role)}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(member.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
