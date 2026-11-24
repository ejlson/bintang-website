import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JournalPostArticle, JournalPostShell } from "@/components/JournalPage";
import { SettleOnReveal } from "@/components/PageTransition";
import { getPost, posts } from "@/lib/journal";
import { articleJsonLd, breadcrumbJsonLd, jsonLdHtml, ogBase } from "@/lib/seo";

// Every post is prerendered. Unknown slugs hit notFound() below (dynamicParams
// isn't allowed with cacheComponents). Because that runs inside Suspense after
// the shell has streamed, they get the 404 page with a noindex tag but HTTP 200.
export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const post = getPost((await props.params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    // Metadata merges shallowly, so restate the layout's site-wide OG fields.
    openGraph: {
      ...ogBase,
      type: "article",
      url: `/journal/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: [{ url: post.image.src, width: post.image.width, height: post.image.height, alt: post.image.alt }],
    },
  };
}

async function Post({ params }: Pick<PageProps<"/journal/[slug]">, "params">) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const article = articleJsonLd(post);
  const crumbs = breadcrumbJsonLd([
    ["Journal", "/journal"],
    [post.title, `/journal/${post.slug}`],
  ]);
  return (
    <>
      <JournalPostArticle post={post} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(article ? [article, crumbs] : crumbs)} />
    </>
  );
}

// params are read inside Suspense so the shell (header, back link) prerenders
// and shows instantly on navigation; the article streams in.
export default function Page({ params }: PageProps<"/journal/[slug]">) {
  return (
    <JournalPostShell>
      <Suspense fallback={<div style={{ minHeight: "80svh" }} />}>
        <Post params={params} />
        <SettleOnReveal />
      </Suspense>
    </JournalPostShell>
  );
}
