import PushMessageForm from "@/components/PushMessageForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { redirect } from "next/navigation";

export default async function PushMessagePage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.id === process.env.ADMIN_ACCOUNT;

  if(!isAdmin) {
    redirect("/")
  }
  return (
    <div>
      <PushMessageForm />
      {/* <InstallPrompt /> */}
    </div>
  );
}