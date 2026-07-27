"use client";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { PageContainer } from "@/components/page-container";
export default function AccountPage() {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <PageContainer className="py-16 text-muted-foreground">
        Loading account…
      </PageContainer>
    );
  if (!user)
    return (
      <PageContainer className="py-16">
        <h1 className="text-3xl font-semibold">Authentication required</h1>
        <Link className="mt-4 inline-block underline" href="/login">
          Log in to continue
        </Link>
      </PageContainer>
    );
  return (
    <PageContainer className="py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">
        Protected profile
      </p>
      <h1 className="mt-3 text-4xl font-semibold">
        {user.first_name || user.email}
      </h1>
      <div className="mt-8 max-w-xl rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="mt-1">{user.email}</p>
        <p className="mt-5 text-sm text-muted-foreground">Role</p>
        <p className="mt-1 capitalize">{user.role}</p>
      </div>
    </PageContainer>
  );
}
