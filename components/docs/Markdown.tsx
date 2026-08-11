import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Отрисовка markdown в оформлении сайта.
 *
 * Плагина типографики в проекте нет намеренно: он тянет собственную шкалу
 * размеров и цветов, которая спорит с остальным интерфейсом. Здесь каждый
 * элемент оформлен вручную — их полтора десятка, зато документация выглядит
 * частью продукта, а не вставкой из другого мира.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-0 text-[2rem] font-medium leading-[1.15] tracking-[-0.03em] text-fg">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-14 border-b border-line pb-2.5 text-[1.35rem] font-medium tracking-[-0.02em] text-fg">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-10 text-[15px] font-medium tracking-[-0.01em] text-fg">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mt-5 text-[15px] leading-relaxed text-fg-soft">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mt-5 flex flex-col gap-2.5 text-[15px] leading-relaxed text-fg-soft">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-5 flex list-decimal flex-col gap-2.5 pl-5 text-[15px] leading-relaxed text-fg-soft marker:font-mono marker:text-[12px] marker:text-fg-faint">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="[ul>&]:relative [ul>&]:pl-5">
            {/* Маркер списка — точка того же цвета, что акценты интерфейса. */}
            <span
              aria-hidden
              className="absolute left-0 top-[0.6em] hidden h-1 w-1 rounded-full bg-fg-ghost [ul>li>&]:block"
            />
            {children}
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-medium text-fg">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a
            href={normalizeHref(href)}
            className="border-b border-line-strong pb-0.5 text-fg transition-colors hover:border-fg"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          // Блок кода приходит с классом языка, строчный — без него.
          const isBlock = Boolean(className);
          if (isBlock) {
            return (
              <code className="font-mono text-[13px] leading-relaxed text-inverse-fg">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[12.5px] text-fg">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="scrollable-area mt-5 overflow-x-auto rounded-lg bg-inverse px-5 py-4">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="scrollable-area mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-[14px]">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-line">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="py-2.5 pr-6 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-fg-faint">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-line-soft py-3 pr-6 align-top text-fg-soft">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mt-5 border-l-2 border-violet-300 pl-4 text-[15px] leading-relaxed text-fg-subtle">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="mt-12 border-line" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/**
 * Ссылки между документами.
 *
 * В markdown они написаны как `./DEVELOPMENT.md` — так они работают на GitHub
 * и в редакторе. На сайте те же ссылки должны вести на его страницы, поэтому
 * переписываем их здесь, а не портим исходники ради одного из двух мест.
 */
function normalizeHref(href?: string): string | undefined {
  if (!href) return href;
  if (!href.endsWith(".md") && !href.includes(".md#")) return href;

  const [file = "", hash] = href.split("#");
  const name = file.replace(/^\.\//, "").replace(/\.md$/, "");

  const slug =
    name === "README"
      ? "/docs"
      : `/docs/${name.toLowerCase().replace(/_/g, "-")}`;

  return hash ? `${slug}#${hash}` : slug;
}
