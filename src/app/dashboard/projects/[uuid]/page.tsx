export default function Dashboard({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Project ID: {projectId}</p>
    </div>
  );
}
