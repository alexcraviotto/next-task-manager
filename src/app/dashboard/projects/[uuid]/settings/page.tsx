export default function Dashboard({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  console.log("🚀 ~ projectId:", projectId);

  return <h1>Settings</h1>;
}
