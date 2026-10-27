import sprite from './sprite.svg?raw';

/** Inline sprite so symbols, hatch patterns and masks resolve via local url(#id) references. */
export default function Sprite() {
  return (
    <svg aria-hidden="true" focusable="false" height="0" style={{ position: 'absolute' }} width="0">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, bundled SVG sprite */}
      <defs dangerouslySetInnerHTML={{ __html: sprite }} />
    </svg>
  );
}
