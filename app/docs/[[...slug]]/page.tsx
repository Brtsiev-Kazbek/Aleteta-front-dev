import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DocsShell } from "@/components/docs/DocsShell";
import { Markdown } from "@/components/docs/Markdown";
import { DOC_PAGES, findDoc } from "@/lib/docs/content.generated";

/**
 * Страница документации.
 *
 * Один маршрут на все документы: содержимое вшито в бандл на этапе сборки
 * (см. scripts/build-docs.mjs), поэтому страницы отрисовываются статически и
 * отдаются мгновенно, без обращения к диску и базе.
 */

export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({
    slug: page.slug ? [page.slug] : [],
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug?: string[] };
}) {
  const page = findDoc(params.slug?.[0] ?? "");
  if (!page) return { title: "Документация — Алетейя" };

  return {
    title: `${page.title} — документация Алетейи`,
    description: page.summary,
  };
}

export default function DocsPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug?.[0] ?? "";
  const page = findDoc(slug);

  if (!page) notFound();

  const index = DOC_PAGES.findIndex((item) => item.slug === page.slug);
  const next = DOC_PAGES[index + 1];

  return (
    <DocsShell activeSlug={page.slug} sourceFile={page.file}>
      <article className="max-w-[46rem]">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-6 bg-brand" />
          <span className="font-mono text-label uppercase text-fg-faint">
            {page.summary}
          </span>
        </div>

        <div className="mt-6">
          <Markdown content={page.content} />
        </div>

        {/* Следующий документ: путь по разделу задан порядком, а не алфавитом. */}
        {next && (
          <Link
            href={next.slug ? `/docs/${next.slug}` : "/docs"}
            className="group mt-16 flex items-center justify-between gap-6 border-t border-line pt-6"
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-mono text-label uppercase text-fg-faint">
                Дальше
              </span>
              <span className="mt-1 truncate text-body text-fg">
                {next.title}
              </span>
            </span>

            <ArrowRight className="h-4 w-4 shrink-0 text-fg-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-fg" />
          </Link>
        )}
      </article>
    </DocsShell>
  );
}
