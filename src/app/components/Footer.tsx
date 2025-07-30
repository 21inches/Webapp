import Image from "next/image";

export function Footer() {
  return (
    <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        href="https://github.com/orgs/21inches/repositories"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          aria-hidden
          src="/github-mark.svg"
          alt="Github icon"
          width={16}
          height={16}
        />
        Repositories
      </a>
    </footer>
  );
}
