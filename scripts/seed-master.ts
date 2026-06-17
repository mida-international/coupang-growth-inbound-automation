import "dotenv/config";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { disconnectDatabase, prisma } from "../src/lib/db";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }
  return value;
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const email = requireEnv("MASTER_ADMIN_EMAIL");
  const password = requireEnv("MASTER_ADMIN_PASSWORD");

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const masterCount = await prisma.profile.count({
      where: { role: "master" },
    });

    if (masterCount > 0) {
      console.log("마스터 관리자 Profile이 이미 존재합니다. 시드를 건너뜁니다.");
      return;
    }

    let authUser = await findAuthUserByEmail(supabase, email);

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Auth 유저 생성에 실패했습니다.");
      }

      authUser = data.user;
      console.log("Supabase Auth 마스터 유저를 생성했습니다.");
    } else {
      console.log("기존 Supabase Auth 유저를 사용합니다.");
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { id: authUser.id },
    });

    if (existingProfile) {
      if (existingProfile.role !== "master") {
        await prisma.profile.update({
          where: { id: authUser.id },
          data: { role: "master", email },
        });
        console.log("기존 Profile의 role을 master로 갱신했습니다.");
      } else {
        console.log("해당 유저의 master Profile이 이미 존재합니다.");
      }
      return;
    }

    await prisma.profile.create({
      data: {
        id: authUser.id,
        email,
        name: "마스터 관리자",
        role: "master",
      },
    });

    console.log("마스터 관리자 Profile을 생성했습니다.");
  } finally {
    await disconnectDatabase();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
