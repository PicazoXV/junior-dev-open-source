import { permanentRedirect } from "next/navigation";

type LegacyGoodFirstIssuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyGoodFirstIssuesPage({
  searchParams,
}: LegacyGoodFirstIssuesPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const firstValue = value.find((item) => typeof item === "string" && item.length > 0);
      if (firstValue) {
        params.set(key, firstValue);
      }
      return;
    }

    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  permanentRedirect(queryString ? `/buena-primera-issue?${queryString}` : "/buena-primera-issue");
}
