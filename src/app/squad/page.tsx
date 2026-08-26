import { redirect } from 'next/navigation';

/**
 * The landing form's GET target. It exists only to turn `?managerId=7` into `/squad/7`, so the
 * form can be plain HTML and the squad itself gets a real, linkable URL.
 *
 * A bad or missing id goes back to the landing page rather than to an error: there is nothing to
 * explain, the number simply was not one.
 */
export default async function SquadRedirect({
  searchParams,
}: {
  searchParams: Promise<{ managerId?: string }>;
}) {
  const { managerId } = await searchParams;
  const id = Number(managerId);

  if (!managerId || !Number.isInteger(id) || id < 1) redirect('/');
  redirect(`/squad/${id}`);
}
