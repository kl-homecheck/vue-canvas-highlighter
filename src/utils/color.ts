/* eslint-disable no-case-declarations */

/**
 * 다양한 색상 문자열(HEX, RGB, RGBA)을 RGBA 형식으로 변환합니다.
 *
 * @param color 변환할 색상 문자열. 지원되는 형식:
 *              - HEX: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`
 *              - RGB: `rgb(r, g, b)`
 *              - RGBA: `rgba(r, g, b, a)`
 * @returns `rgba(r, g, b, a)` 형식의 문자열.
 * @throws 잘못된 형식의 색상 문자열이 입력되면 오류를 발생시킵니다.
 *
 * @example
 * toRgba('#fff'); // 'rgba(255, 255, 255, 1)'
 * toRgba('#ff0000'); // 'rgba(255, 0, 0, 1)'
 * toRgba('rgb(255, 0, 0)'); // 'rgba(255, 0, 0, 1)'
 * toRgba('rgba(255, 0, 0, 0.5)'); // 'rgba(255, 0, 0, 0.5)'
 * toRgba('#ff000080'); // 'rgba(255, 0, 0, 0.5)'
 */
export function toRgba(color: string, opacity: number = 1): string {
  if (color.startsWith('#')) {
    const hex = color.slice(1);

    switch (hex.length) {
      case 3: // #rgb
        const r3 = parseInt(hex[0] + hex[0], 16);
        const g3 = parseInt(hex[1] + hex[1], 16);
        const b3 = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r3}, ${g3}, ${b3}, 1)`;

      case 4: // #rgba
        const r4 = parseInt(hex[0] + hex[0], 16);
        const g4 = parseInt(hex[1] + hex[1], 16);
        const b4 = parseInt(hex[2] + hex[2], 16);
        const a4 = (parseInt(hex[3] + hex[3], 16) / 255).toFixed(2);
        return `rgba(${r4}, ${g4}, ${b4}, ${a4})`;

      case 6: // #rrggbb
        const r6 = parseInt(hex.slice(0, 2), 16);
        const g6 = parseInt(hex.slice(2, 4), 16);
        const b6 = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r6}, ${g6}, ${b6}, ${opacity})`;

      case 8: // #rrggbbaa
        const r8 = parseInt(hex.slice(0, 2), 16);
        const g8 = parseInt(hex.slice(2, 4), 16);
        const b8 = parseInt(hex.slice(4, 6), 16);
        const a8 = (parseInt(hex.slice(6, 8), 16) / 255).toFixed(2);
        return `rgba(${r8}, ${g8}, ${b8}, ${a8})`;

      default:
        throw new Error(`Invalid HEX color format: ${color}`);
    }
  }

  if (color.startsWith('rgb')) {
    const values = color.match(/\((.*?)\)/)?.[1];
    if (!values) {
      throw new Error(`Invalid RGB/RGBA color format: ${color}`);
    }

    const parts = values.split(',').map(s => s.trim());

    if (color.startsWith('rgba') && parts.length === 4) {
      const [r, g, b, a] = parts;
      return `rgba(${parseInt(r, 10)}, ${parseInt(g, 10)}, ${parseInt(b, 10)}, ${parseFloat(a)})`;
    }

    if (color.startsWith('rgb') && parts.length === 3) {
      const [r, g, b] = parts;
      return `rgba(${parseInt(r, 10)}, ${parseInt(g, 10)}, ${parseInt(b, 10)}, ${opacity})`;
    }
  }

  throw new Error(`Unsupported color format: ${color}`);
}
