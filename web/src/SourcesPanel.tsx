import type { ReactNode } from "react";

const L = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="text-teal-700 underline" href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);

export default function SourcesPanel() {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Sources and checks</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>
          Data: NASA POWER daily point data for 1981 to 2025 (<L href="https://power.larc.nasa.gov/">power.larc.nasa.gov</L>), built from NASA's MERRA-2 reanalysis (<L href="https://www.earthdata.nasa.gov/data/catalog/ges-disc-m2tmnxflx-5.12.4">MERRA-2 at NASA Earthdata</L>). Citation guide: <L href="https://power.larc.nasa.gov/docs/referencing/">POWER referencing</L>.
        </li>
        <li>
          Pakistan Meteorological Department figures come from press coverage of its 2026 report on 45 years of climate change in Pakistan: <L href="https://www.geo.tv/latest/681138-pakistan-witnessing-faster-rise-in-night-temperatures-than-day-pmd">Geo News</L>, <L href="https://www.thenews.pk/print/1435219-pakistan-faces-frequent-climate-extremes">The News</L>, <L href="https://www.dawn.com/news/2042262">Dawn</L>.
        </li>
        <li>
          Hand check: 5 places and 30 daily values from NASA's Data Access Viewer matched our stored numbers exactly (docs/HAND_CHECK.md in the project repository).
        </li>
        <li>
          Built with React, Vite, Tailwind and TypeScript for the site, and Python with NumPy, SciPy, pymannkendall and requests for the data. Hosted on Vercel. No outside fonts, images or scripts are loaded.
        </li>
      </ul>
    </section>
  );
}
