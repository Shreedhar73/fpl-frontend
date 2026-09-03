import { redirect } from 'next/navigation';

/**
 * The entry form's GET target. It turns `?managerId=7` into `/team/7`, so the form is plain HTML
 * and the board gets a real, linkable URL. A bad or missing id goes back to the entry page.
 */
export default async function SquadRedirect({
  searchParams,
}: {
  searchParams: Promise<{ managerId?: string }>;
}) {
  const { managerId } = await searchParams;
  const id = Number(managerId);
  if (!managerId || !Number.isInteger(id) || id < 1) redirect('/');
  redirect(`/team/${id}`);
}
