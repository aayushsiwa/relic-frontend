import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { SignupForm } from "@/components/signup-form"

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}
